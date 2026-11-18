import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir } from "node:fs/promises";
import path from "node:path";
import net from "node:net";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function freePort() {
  const s = net.createServer();
  await new Promise<void>((r) => s.listen(0, "127.0.0.1", r));
  const port = (s.address() as net.AddressInfo).port;
  await new Promise<void>((r) => s.close(() => r()));
  return port;
}
test(
  "Controlled model output: stale responses discarded, malformed evidence falls back, rubric text reaches evaluator",
  { timeout: 60000 },
  async (t) => {
    await mkdir("tmp", { recursive: true });
    const dir = await mkdtemp(path.resolve("tmp/qa-model-")),
      port = await freePort();
    let responseData: any = {
        facts: [],
        contradictions: [],
        flags: [],
        storyWikiSummary: "Empty evidence result.",
      },
      delay = 0,
      received: any[] = [];
    const model = http.createServer(async (req, res) => {
      let input = "";
      for await (const chunk of req) input += chunk;
      received.push(JSON.parse(input));
      await sleep(delay);
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          candidates: [
            {
              content: {
                role: "model",
                parts: [{ text: JSON.stringify(responseData) }],
              },
              finishReason: "STOP",
            },
          ],
        }),
      );
    });
    await new Promise<void>((r) => model.listen(0, "127.0.0.1", r));
    const modelPort = (model.address() as net.AddressInfo).port;
    const child = spawn(process.execPath, ["--import", "tsx", "server.ts"], {
      windowsHide: true,
      env: {
        ...process.env,
        NODE_ENV: "production",
        DATA_DIR: dir,
        PORT: String(port),
        GEMINI_API_KEY: "qa-fake-key",
        GEMINI_BASE_URL: `http://127.0.0.1:${modelPort}`,
        MONTHLY_CHECK_LIMIT: "100",
      },
      stdio: "ignore",
    });
    t.after(async () => {
      child.kill();
      model.closeAllConnections();
      await new Promise<void>((r) => model.close(() => r()));
    });
    const url = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 200; i++) {
      try {
        if ((await fetch(url + "/api/health")).ok) break;
      } catch {}
      await sleep(50);
    }
    let cookie = "";
    const request = async (endpoint: string, body?: any) => {
      const r = await fetch(url + endpoint, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (r.headers.get("set-cookie"))
        cookie = r.headers.get("set-cookie")!.split(";")[0];
      return { status: r.status, data: await r.json() };
    };
    await request("/api/setup", {
      school: "Model QA",
      username: "teacher-model",
      password: "model-qa-password",
    });
    let w = (await request("/api/workspace")).data;
    let lia = w.stories[0];
    const empty = await request("/api/gemini/analyze", {
      storyId: lia.id,
      version: lia.version,
    });
    assert.equal(empty.status, 200);
    lia = empty.data.story;
    assert.equal(lia.checkMethod, "gemini");
    assert.equal(lia.facts.length, 0);
    const modelInput = JSON.parse(received[0].contents[0].parts[0].text);
    assert(Array.isArray(modelInput.rubric.criteria));
    assert.equal(modelInput.rubric.exemplarText, w.rubrics[0].exemplarText);
    assert(modelInput.chapters.every((c: any) => c.authorId));
    responseData = {
      facts: [
        {
          subject: "Invented",
          attribute: "age",
          value: "12",
          chapterId: "missing",
          authorId: "wrong",
          quote: "fabricated",
        },
      ],
      contradictions: [],
      flags: [],
    };
    const bad = await request("/api/gemini/analyze", {
      storyId: lia.id,
      version: lia.version,
    });
    assert.equal(bad.status, 200);
    lia = bad.data.story;
    assert.equal(lia.checkMethod, "local-fallback");
    assert(lia.facts.every((f: any) => f.subject !== "Invented"));
    responseData = {
      facts: [],
      contradictions: [],
      flags: [],
      storyWikiSummary: "Stale result",
    };
    delay = 500;
    const pending = request("/api/gemini/analyze", {
      storyId: lia.id,
      version: lia.version,
    });
    while (received.length < 3) await sleep(10);
    const edit = await request(`/api/stories/${lia.id}/actions`, {
      version: lia.version,
      action: "policy",
      payload: { contentLevel: "moderate" },
    });
    assert.equal(edit.status, 200);
    const stale = await pending;
    assert.equal(stale.status, 409);
    const after = (await request("/api/workspace")).data;
    assert.notEqual(after.stories[0].summary, "Stale result");
    assert.equal(after.stories[1].facts.length, 0);
    delay = 0;
    const current = after.stories[0],
      rubric = after.rubrics.find(
        (r: any) => r.id === current.selectedRubricId,
      );
    responseData = {
      criteria: rubric.criteria.map((c: any) => ({
        ...c,
        score: c.weight,
        feedback: "Evidence review",
        evidence: [{ chapterId: "c1", quote: current.chapters[0].text }],
      })),
    };
    const evaluated = await request("/api/evaluate", {
      storyId: current.id,
      version: current.version,
    });
    assert.equal(evaluated.data.evaluation.method, "gemini");
    assert.equal(
      evaluated.data.evaluation.criteria.length,
      rubric.criteria.length,
    );
    responseData.criteria[0].evidence[0].quote = "invented quote";
    const invalidEval = await request("/api/evaluate", {
      storyId: current.id,
      version: current.version,
    });
    assert.equal(invalidEval.data.evaluation.method, "teacher-review");
    assert(
      invalidEval.data.evaluation.criteria.every((c: any) => c.score === null),
    );
  },
);
