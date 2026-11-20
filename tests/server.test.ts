import assert from "node:assert/strict";
import test from "node:test";
import { fixture } from "./runtime.mjs";
import { mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import net from "node:net";

function client(url: string) {
  let cookie = "";
  return async (endpoint: string, body?: any, method = "POST") => {
    const res = await fetch(url + endpoint, {
      method: body === undefined ? "GET" : method,
      headers: {
        "Content-Type": "application/json",
        Connection: "close",
        Cookie: cookie,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const next = res.headers.get("set-cookie");
    if (next) cookie = next.split(";")[0];
    return { status: res.status, data: await res.json() };
  };
}

test(
  "Authenticated durable classroom workflow and authorization boundaries",
  { timeout: 60000 },
  async (t) => {
    const f = await fixture();
    t.after(() => f.cleanup());
    const teacher = client(f.url),
      maria = client(f.url),
      jose = client(f.url),
      ethan = client(f.url),
      anonymous = client(f.url);
    assert.equal((await anonymous("/api/workspace")).status, 401);
    const created = await teacher("/api/setup", {
      school: "QA school",
      username: "qa-teacher",
      password: "long-password-for-qa",
    });
    assert.equal(created.status, 200);
    const credentials = created.data.accounts;
    const password = (id: string) =>
      credentials.find((a: any) => a.username === id).password;
    for (const [id, request] of [
      ["maria", maria],
      ["jose", jose],
      ["ethan", ethan],
    ] as const)
      assert.equal(
        (
          await request("/api/login", {
            role: "student",
            username: id,
            password: password(id),
          })
        ).status,
        200,
      );
    let w = (await teacher("/api/workspace")).data;
    let lia = w.stories.find((s: any) => s.id === "story-lia");
    assert.equal(
      (await maria("/api/gemini/analyze", { chapters: [{}] })).status,
      400,
    );
    assert.equal(
      (
        await anonymous("/api/gemini/analyze", {
          storyId: lia.id,
          version: lia.version,
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await maria(`/api/stories/${lia.id}/actions`, {
          version: lia.version,
          action: "policy",
          payload: { contentLevel: "literature" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await maria(`/api/stories/${lia.id}/actions`, {
          version: lia.version,
          action: "chapter-edit",
          payload: {
            chapterId: "c2",
            baseText: lia.chapters[1].text,
            text: "Impersonated",
          },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await ethan(`/api/stories/${lia.id}/actions`, {
          version: lia.version,
          action: "chapter-add",
          payload: { title: "x", text: "x" },
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await maria("/api/stories", {
          title: "bad",
          mode: "shared",
          classId: "mabini",
          memberIds: ["jose"],
        })
      ).status,
      403,
    );
    const checked = await teacher("/api/gemini/analyze", {
      storyId: lia.id,
      version: lia.version,
    });
    assert.equal(checked.status, 200);
    lia = checked.data.story;
    assert(lia.contradictions.length >= 3);
    assert(lia.facts.every((f: any) => f.authorId && f.chapterId));
    const pair = lia.contradictions.find(
      (c: any) => c.attribute === "eye color",
    );
    let note = await maria(`/api/stories/${lia.id}/actions`, {
      version: lia.version,
      action: "note",
      payload: { key: pair.key, text: "I imagined brown eyes in this scene." },
    });
    assert.equal(note.status, 200);
    lia = note.data;
    const stale = await jose(`/api/stories/${lia.id}/actions`, {
      version: lia.version - 1,
      action: "note",
      payload: { key: pair.key, text: "Green eyes from the light." },
    });
    assert.equal(stale.status, 409);
    note = await jose(`/api/stories/${lia.id}/actions`, {
      version: lia.version,
      action: "note",
      payload: { key: pair.key, text: "Green eyes from the light." },
    });
    assert.equal(note.status, 200);
    lia = note.data;
    let decision = await maria(`/api/stories/${lia.id}/actions`, {
      version: lia.version,
      action: "resolve",
      payload: { key: pair.key, choice: "teacher" },
    });
    assert.equal(decision.status, 200);
    lia = decision.data;
    decision = await teacher(`/api/stories/${lia.id}/actions`, {
      version: lia.version,
      action: "arbitrate",
      payload: { key: pair.key, choice: "both" },
    });
    assert.equal(decision.status, 200);
    lia = decision.data;
    assert.equal(lia.resolutions[pair.key].outcome, "both");
    assert(lia.resolutions[pair.key].notes.maria);
    const flag = lia.safetyFlags[0];
    assert(flag);
    decision = await teacher(`/api/stories/${lia.id}/actions`, {
      version: lia.version,
      action: "moderate",
      payload: { key: flag.key, decision: "allow" },
    });
    assert.equal(decision.status, 200);
    lia = decision.data;
    let recheck = await teacher("/api/gemini/analyze", {
      storyId: lia.id,
      version: lia.version,
    });
    lia = recheck.data.story;
    assert.equal(
      lia.safetyFlags.find((f: any) => f.key === flag.key).decision,
      "allow",
    );
    assert.equal(lia.resolutions[pair.key].outcome, "both");
    const evalResult = await teacher("/api/evaluate", {
      storyId: lia.id,
      version: lia.version,
    });
    assert.equal(evalResult.status, 200);
    assert(
      evalResult.data.evaluation.criteria.every((c: any) => c.score === null),
    );
    assert.equal(evalResult.data.evaluation.method, "teacher-review");
    lia = evalResult.data.story;
    const oldText = lia.chapters[0].text;
    const edit = await maria(`/api/stories/${lia.id}/actions`, {
      version: lia.version,
      action: "chapter-edit",
      payload: {
        chapterId: "c1",
        baseText: oldText,
        text: oldText.replace("brown", "blue"),
      },
    });
    assert.equal(edit.status, 200);
    lia = edit.data;
    assert.equal(Object.keys(lia.resolutions).length, 0);
    assert.equal(lia.checkedRevision, lia.revision);
    assert.equal(lia.checkMethod, "local-auto");
    assert.equal(
      (
        await maria(`/api/stories/${lia.id}/actions`, {
          version: lia.version,
          action: "chapter-edit",
          payload: { chapterId: "c1", baseText: oldText, text: "overwritten" },
        })
      ).status,
      409,
    );
    w = (await teacher("/api/workspace")).data;
    const makiling = w.stories.find((s: any) => s.id === "story-makiling");
    assert.equal(makiling.facts.length, 0);
    assert.equal(makiling.safetyFlags.length, 0);
    const checkedMak = await teacher("/api/gemini/analyze", {
      storyId: makiling.id,
      version: makiling.version,
    });
    assert(
      checkedMak.data.story.contradictions.some(
        (c: any) => c.subject === "Samuel",
      ),
    );
    assert(!JSON.stringify(checkedMak.data.story.facts).includes("Lia"));
    const priv = await maria("/api/stories", {
      title: "My private work",
      mode: "individual",
      classId: "mabini",
    });
    assert.equal(priv.status, 201);
    assert.deepEqual(priv.data.memberIds, ["maria"]);
    assert(
      !(await jose("/api/workspace")).data.stories.some(
        (s: any) => s.id === priv.data.id,
      ),
    );
    assert.equal(
      (
        await jose(`/api/stories/${priv.data.id}/actions`, {
          version: priv.data.version,
          action: "chapter-add",
          payload: { title: "x", text: "x" },
        })
      ).status,
      404,
    );
    let privateStory = priv.data;
    for (const text of ["Lia's eyes were brown.", "Lia's eyes were green."]) {
      const r = await maria(`/api/stories/${privateStory.id}/actions`, {
        version: privateStory.version,
        action: "chapter-add",
        payload: { title: "Private", text },
      });
      assert.equal(r.status, 200);
      privateStory = r.data;
    }
    const privateCheck = await maria("/api/gemini/analyze", {
      storyId: privateStory.id,
      version: privateStory.version,
    });
    assert.equal(privateCheck.data.story.contradictions.length, 1);
    const badRubric = {
      title: "bad",
      category: "Test",
      source: "QA teacher",
      license: "Own work",
      attested: true,
      criteria: [{ name: "X", description: "Test", weight: -5 }],
    };
    assert.equal((await teacher("/api/rubrics", badRubric)).status, 400);
    assert.equal((await maria("/api/rubrics", { ...badRubric })).status, 403);
    const rubric = await teacher("/api/rubrics", {
      ...badRubric,
      title: "Same title",
      criteria: [{ name: "Plot", description: "Check timeline", weight: 100 }],
      exemplarText: "A verified reference.",
    });
    assert.equal(rubric.status, 201);
    assert.equal(rubric.data.exemplarText, "A verified reference.");
    const duplicate = await teacher("/api/rubrics", {
      ...badRubric,
      title: "Same title",
      criteria: [
        { name: "Voice", description: "Check perspective", weight: 100 },
      ],
    });
    assert.equal(duplicate.status, 201);
    assert.notEqual(duplicate.data.id, rubric.data.id);
    const modelA = (await teacher("/api/workspace")).data.rubrics.find(
      (r: any) => r.id === rubric.data.id,
    );
    assert.equal(modelA.criteria[0].name, "Plot");
    assert.equal(
      (await teacher(`/api/rubrics/${rubric.data.id}`, {}, "DELETE")).status,
      200,
    );
    assert(
      !(await teacher("/api/workspace")).data.rubrics.some(
        (r: any) => r.id === rubric.data.id,
      ),
    );
    const addedUser = await teacher("/api/users", {
      username: "new-learner",
      name: "New Learner",
      classId: "mabini",
    });
    assert.equal(addedUser.status, 201);
    assert.equal(addedUser.data.user.role, "student");
    assert.equal(
      (
        await maria("/api/users", {
          username: "unauthorized",
          name: "Bad",
          classId: "mabini",
        })
      ).status,
      403,
    );
    const before = (await teacher("/api/workspace")).data;
    await f.stop();
    await f.start();
    const after = (await teacher("/api/workspace")).data;
    assert.deepEqual(after.stories, before.stories);
    assert.equal(after.school, "QA school");
    const disk = JSON.parse(
      await readFile(path.join(f.dir, "workspace.json"), "utf8"),
    );
    assert(disk.users.every((u: any) => !u.password && u.hash));
    assert(!JSON.stringify(disk).includes("long-password-for-qa"));
    // New allowances are enforced even for direct API calls and all analysis endpoints share them.
    for (let i = 0; i < 30; i++) {
      const current = (await maria("/api/workspace")).data;
      const story = current.stories.find((s: any) => s.id === lia.id);
      const result = await maria("/api/gemini/analyze", {
        storyId: story.id,
        version: story.version,
      });
      if (result.status === 429) {
        assert.equal(current.usage.remaining, 0);
        return;
      }
      assert.equal(result.status, 200);
    }
    assert.fail("Monthly cap was not enforced.");
  },
);
