import test from "node:test";
import assert from "node:assert/strict";
import { fixture, client } from "./runtime.mjs";
import { pdfFixture, docxFixture } from "./document-fixtures.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";
import { writeFile } from "node:fs/promises";

test(
  "Round 2 classroom: teacher authority, unilateral help, retained reports, imports, consent and lifecycle",
  { timeout: 90000 },
  async (t) => {
    const f = await fixture({ MONTHLY_CHECK_LIMIT: "100" });
    t.after(() => f.cleanup());
    const teacher = client(f.url),
      maria = client(f.url),
      jose = client(f.url);
    const setup = await teacher("/api/setup", {
      school: "Round 2 QA",
      username: "qa-teacher",
      password: "round-two-password",
    });
    assert.equal(setup.status, 200);
    const password = (id: string) =>
      setup.data.accounts.find((u: any) => u.username === id).password;
    for (const [name, request] of [
      ["maria", maria],
      ["jose", jose],
    ] as const)
      assert.equal(
        (
          await request("/api/login", {
            username: name,
            password: password(name),
          })
        ).status,
        200,
      );
    for (let i = 0; i < 35; i++)
      assert.equal(
        (
          await teacher("/api/login", {
            username: "qa-teacher",
            password: "round-two-password",
          })
        ).status,
        200,
        `Normal login ${i}`,
      );
    let w = (await teacher("/api/workspace")).data,
      s = w.stories[0];
    s = (
      await teacher("/api/gemini/analyze", {
        storyId: s.id,
        version: s.version,
      })
    ).data.story;
    const conflict = s.contradictions.find(
      (c: any) => c.attribute === "eye color",
    );
    s = (
      await maria(`/api/stories/${s.id}/actions`, {
        version: s.version,
        action: "note",
        payload: {
          key: conflict.key,
          text: "Please help me understand the conflicting eye colors.",
        },
      })
    ).data;
    const help = await maria(`/api/stories/${s.id}/actions`, {
      version: s.version,
      action: "resolve",
      payload: { key: conflict.key, choice: "teacher" },
    });
    assert.equal(help.status, 200);
    s = help.data;
    assert(
      !s.notes[conflict.key].jose,
      "Help must be available before a peer cooperates",
    );
    s = (
      await teacher(`/api/stories/${s.id}/actions`, {
        version: s.version,
        action: "arbitrate",
        payload: { key: conflict.key, choice: "a" },
      })
    ).data;
    assert.equal(
      (
        await jose(`/api/stories/${s.id}/actions`, {
          version: s.version,
          action: "resolve",
          payload: { key: conflict.key, choice: "b" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await jose(`/api/stories/${s.id}/actions`, {
          version: s.version,
          action: "reopen",
          payload: { key: conflict.key },
        })
      ).status,
      403,
    );
    assert.equal(
      (await teacher("/api/workspace")).data.stories[0].resolutions[
        conflict.key
      ].outcome,
      "a",
    );
    const unrelated = await jose(`/api/stories/${s.id}/actions`, {
      version: s.version,
      action: "chapter-add",
      payload: {
        title: "An unrelated scene",
        text: "The friends quietly watched a bird.",
      },
    });
    assert.equal(unrelated.status, 200);
    s = unrelated.data;
    assert.equal(
      s.resolutions[conflict.key].type,
      "teacher-decided",
      "An unrelated save must not unlock the teacher’s unchanged evidence",
    );
    assert.equal(
      (
        await jose(`/api/stories/${s.id}/actions`, {
          version: s.version,
          action: "resolve",
          payload: { key: conflict.key, choice: "b" },
        })
      ).status,
      403,
    );
    s = (
      await teacher(`/api/stories/${s.id}/actions`, {
        version: s.version,
        action: "reopen",
        payload: { key: conflict.key },
      })
    ).data;
    assert(!s.resolutions[conflict.key]);
    const before = (await teacher("/api/workspace")).data.usage.used;
    const evaluated = await teacher("/api/evaluate", {
      storyId: s.id,
      version: s.version,
      lang: "en",
    });
    assert.equal(evaluated.status, 200);
    s = evaluated.data.story;
    const cached = await teacher("/api/evaluate", {
      storyId: s.id,
      version: s.version,
      lang: "en",
    });
    assert.equal(cached.status, 200);
    assert.equal(cached.data.cached, true);
    assert.equal(cached.data.usage.used, before + 1);
    assert.deepEqual(cached.data.evaluation, evaluated.data.evaluation);
    assert.equal(
      Object.keys((await maria("/api/workspace")).data.stories[0].evaluations)
        .length,
      0,
      "A student cannot retrieve another account’s generated report",
    );
    await f.stop();
    await f.start();
    w = (await teacher("/api/workspace")).data;
    s = w.stories[0];
    assert.equal(
      Object.keys(s.evaluations).length,
      1,
      "Feedback survives restart",
    );
    const source = s.chapters[0];
    const saved = await maria(`/api/stories/${s.id}/actions`, {
      version: s.version,
      action: "chapter-edit",
      payload: {
        chapterId: source.id,
        title: source.title,
        text: source.text + " A new ending.",
        baseText: source.text,
      },
    });
    assert.equal(saved.status, 200);
    s = saved.data;
    assert.equal(s.checkMethod, "local-auto");
    assert.equal(s.checkedRevision, s.revision);
    assert(
      Object.values(s.evaluations).every((e: any) => e.revision !== s.revision),
    );
    const versions = await maria(
      `/api/stories/${s.id}/chapters/${source.id}/history`,
    );
    assert.equal(versions.status, 200);
    assert(versions.data.versions.some((v: any) => v.text === source.text));
    assert.equal(
      (await jose(`/api/stories/${s.id}/chapters/${source.id}/history`)).status,
      403,
    );
    const pdf = await teacher("/api/materials/extract", {
      fileName: "reference.pdf",
      base64: pdfFixture().toString("base64"),
    });
    assert.equal(pdf.status, 200, JSON.stringify(pdf.data));
    assert(pdf.data.text.includes("narrative continuity"));
    const docx = await teacher("/api/materials/extract", {
      fileName: "reference.docx",
      base64: docxFixture().toString("base64"),
    });
    assert.equal(docx.status, 200, JSON.stringify(docx.data));
    assert(docx.data.text.includes("Filipino storytelling"));
    assert.equal(
      (
        await teacher("/api/materials/extract", {
          fileName: "scan.pdf",
          base64: pdfFixture("").toString("base64"),
        })
      ).status,
      422,
    );
    assert.equal(
      (
        await maria("/api/materials/extract", {
          fileName: "reference.pdf",
          base64: pdfFixture().toString("base64"),
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await teacher("/api/materials/extract", {
          fileName: "legacy.doc",
          base64: Buffer.from("old document").toString("base64"),
        })
      ).status,
      415,
    );
    const added = await teacher("/api/users", {
      username: "real-learner",
      name: "QA Learner",
      classId: "mabini",
    });
    assert.equal(added.status, 201);
    assert.equal(added.data.user.consentStatus, "pending");
    const consents = await teacher("/api/consents");
    const noticeVersion = consents.data.notice.version;
    assert.equal((await maria("/api/consents")).status, 403);
    const consent = await teacher(`/api/users/${added.data.user.id}/consent`, {
      status: "recorded",
      reference: "School record QA-2026-11",
      noticeVersion,
    });
    assert.equal(consent.status, 200);
    assert.equal(
      (await teacher("/api/consents")).data.records[added.data.user.id]
        .recordedBy,
      "teacher",
    );
    const review = await teacher(`/api/stories/${s.id}/actions`, {
      version: s.version,
      action: "review-chapter",
      payload: {
        chapterId: source.id,
        baseText: s.chapters[0].text,
        status: "rework",
        feedback: "Add a transition between the two settings.",
      },
    });
    assert.equal(review.status, 200);
    s = review.data;
    assert.equal(
      (await maria("/api/workspace")).data.stories[0].chapters[0].review.status,
      "rework",
    );
    const profile = await maria(`/api/stories/${s.id}/actions`, {
      version: s.version,
      action: "wiki-save",
      payload: {
        entry: {
          category: "character",
          name: "Lia",
          description: "The main character",
          details: "A fisher’s daughter",
          chapterIds: [source.id],
        },
      },
    });
    assert.equal(profile.status, 200);
    s = profile.data;
    const own = s.wikiEntries[0];
    assert.equal(
      (
        await jose(`/api/stories/${s.id}/actions`, {
          version: s.version,
          action: "wiki-save",
          payload: { entry: { ...own, description: "Overwritten by peer" } },
        })
      ).status,
      403,
    );
    s = (
      await teacher(`/api/stories/${s.id}/actions`, {
        version: s.version,
        action: "assignment",
        payload: {
          status: "closed",
          instructions: "Write a careful revision.",
          dueAt: "2026-12-01",
        },
      })
    ).data;
    assert.equal(
      (
        await maria(`/api/stories/${s.id}/actions`, {
          version: s.version,
          action: "chapter-add",
          payload: { title: "Blocked", text: "This assignment is closed." },
        })
      ).status,
      403,
    );
    const exported = await teacher(`/api/stories/${s.id}/export?format=json`);
    assert.equal(exported.status, 200);
    assert(exported.headers.get("content-disposition")?.includes("attachment"));
    assert(!JSON.stringify(exported.data).includes("hash"));
    assert.equal(
      (await maria(`/api/stories/${s.id}/export?format=json`)).status,
      403,
    );
    const csv = await teacher(`/api/stories/${s.id}/export?format=csv`);
    assert.equal(csv.status, 200);
    assert.equal(typeof csv.data, "string");
    const demo = await teacher("/api/demo-story", {});
    assert.equal(demo.status, 201);
    assert.equal(demo.data.title, "Ang Huling Habi");
    assert(demo.data.isDemo);
    assert(demo.data.wikiEntries.length >= 3);
    assert.equal((await teacher("/api/demo-story", {})).status, 200);
    const child = spawn(process.execPath, ["--import", "tsx", "server.ts"], {
      windowsHide: true,
      env: {
        ...process.env,
        NODE_ENV: "production",
        DATA_DIR: f.dir,
        PORT: "0",
        GEMINI_API_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stderr!.on("data", (data) => (output += data));
    child.stdout!.on("data", (data) => (output += data));
    await new Promise((resolve) => child.once("exit", resolve));
    assert(output.includes("already in use"));
    assert(
      (await teacher("/api/workspace")).status === 200,
      "A rejected second writer cannot disturb the live store",
    );
    const disk = JSON.parse(
      await readFile(path.join(f.dir, "workspace.json"), "utf8"),
    );
    assert(disk.consents[added.data.user.id]);
    const privateStory = await maria("/api/stories", {
      title: "Bounded review",
      mode: "individual",
      classId: "mabini",
    });
    assert.equal(privateStory.status, 201);
    const ageText = Array.from(
      { length: 150 },
      (_, index) => `Lia is ${index + 1} years old.`,
    ).join(" ");
    const bounded = await maria(
      `/api/stories/${privateStory.data.id}/actions`,
      {
        version: privateStory.data.version,
        action: "chapter-add",
        payload: { title: "Many details", text: ageText },
      },
    );
    assert.equal(bounded.status, 200);
    assert(bounded.data.coverage.truncated);
    assert(bounded.data.contradictions.length <= 80);
    assert(Buffer.byteLength(JSON.stringify(bounded.data)) < 250000);
    for (let i = 0; i < 5; i++)
      assert.equal(
        (
          await client(f.url)("/api/login", {
            username: "maria",
            password: "incorrect",
          })
        ).status,
        401,
      );
    assert.equal(
      (
        await client(f.url)("/api/login", {
          username: "maria",
          password: password("maria"),
        })
      ).status,
      429,
    );
    assert.equal(
      (
        await client(f.url)("/api/login", {
          username: "jose",
          password: password("jose"),
        })
      ).status,
      200,
    );
    const reset = await teacher("/api/users/maria/reset-password", {});
    assert.equal(reset.status, 200);
    assert.equal(
      (
        await client(f.url)("/api/login", {
          username: reset.data.username,
          password: reset.data.password,
        })
      ).status,
      200,
      "Teacher reset clears the failed-account lock",
    );
    assert.equal(
      (await maria("/api/workspace")).status,
      401,
      "Reset revokes previous student sessions",
    );
    const backupFile = path.join(f.dir, "verified-backup.json");
    const storageCommand = (command: string, file = backupFile) =>
      new Promise<{ code: number; output: string }>((resolve) => {
        const child = spawn(
          process.execPath,
          ["scripts/storage.mjs", command, "--data-dir", f.dir, "--file", file],
          { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
        );
        let output = "";
        child.stdout!.on("data", (chunk) => (output += chunk));
        child.stderr!.on("data", (chunk) => (output += chunk));
        child.on("exit", (code) => resolve({ code: code!, output }));
      });
    assert.equal((await storageCommand("backup")).code, 0);
    assert.equal((await storageCommand("inspect")).code, 0);
    assert.equal(
      (await storageCommand("restore")).code,
      1,
      "Live stores cannot be restored over a running process",
    );
    await f.stop();
    const invalidFile = path.join(f.dir, "invalid-backup.json");
    const invalid = JSON.parse(await readFile(backupFile, "utf8"));
    invalid.payload.school = "Tampered";
    await writeFile(invalidFile, JSON.stringify(invalid));
    assert.equal((await storageCommand("restore", invalidFile)).code, 1);
    assert.equal((await storageCommand("restore")).code, 0);
    await f.start();
    assert.equal(
      (await teacher("/api/workspace")).status,
      401,
      "Restore must revoke old sessions",
    );
    assert.equal(
      (
        await teacher("/api/login", {
          username: "qa-teacher",
          password: "round-two-password",
        })
      ).status,
      200,
    );
    assert(
      (await teacher("/api/workspace")).data.stories.some(
        (story: any) => story.id === "demo-huling-habi",
      ),
    );
  },
);

test(
  "QA-07: trusted HTTPS proxy and canonical origin accept same-origin writes, reject foreign origins",
  { timeout: 45000 },
  async (t) => {
    const raw = await fixture(),
      trusted = await fixture({ TRUST_PROXY: "loopback" }),
      canonical = await fixture({ APP_ORIGIN: "https://school.example" });
    t.after(async () => {
      await Promise.all([
        raw.cleanup(),
        trusted.cleanup(),
        canonical.cleanup(),
      ]);
    });
    const headers = {
      Host: "school.example",
      Origin: "https://school.example",
      "X-Forwarded-Proto": "https",
    };
    const write = (url: string, headers: Record<string, string>) =>
      new Promise<number>((resolve, reject) => {
        const request = http.request(
          new URL("/api/setup", url),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": "2",
              ...headers,
            },
          },
          (response) => {
            response.resume();
            resolve(response.statusCode!);
          },
        );
        request.on("error", reject);
        request.end("{}");
      });
    assert.equal(await write(raw.url, headers), 403);
    assert.equal(await write(trusted.url, headers), 400);
    assert.equal(
      await write(canonical.url, { Origin: "https://school.example" }),
      400,
    );
    assert.equal(
      await write(trusted.url, {
        ...headers,
        Origin: "https://foreign.example",
      }),
      403,
    );
    assert.equal(
      await write(canonical.url, { Origin: "https://foreign.example" }),
      403,
    );
  },
);
