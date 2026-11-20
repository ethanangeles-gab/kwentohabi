import assert from "node:assert/strict";
import test from "node:test";
import { fixture, client } from "./runtime.mjs";

test(
  "Profile changes are owner-only, bounded, private to the owner, and durable",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture();
    t.after(() => f.cleanup());
    const teacher = client(f.url),
      student = client(f.url),
      anonymous = client(f.url);
    const setup = await teacher("/api/setup", {
      school: "Profile test school",
      username: "profile-teacher",
      password: "profile-password-123",
    });
    const account = setup.data.accounts.find(
      (entry: any) => entry.username === "maria",
    );
    await student("/api/login", { ...account, role: "student" });
    const avatar =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jdsQAAAAASUVORK5CYII=";
    assert.equal(
      (
        await anonymous("/api/profile", {
          name: "Anonymous",
          avatarDataUrl: "",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await student("/api/profile", {
          name: "New name",
          avatarDataUrl: "",
          role: "teacher",
        })
      ).status,
      400,
    );
    for (const value of [
      "https://example.com/photo.png",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "data:image/png;base64,bm90LXBuZw==",
      "x".repeat(131073),
    ])
      assert.equal(
        (
          await student("/api/profile", {
            name: "Uncommitted",
            avatarDataUrl: value,
          })
        ).status,
        400,
      );
    assert.equal(
      (await student("/api/profile", { name: "  ", avatarDataUrl: "" })).status,
      400,
    );
    assert.equal(
      (await student("/api/profile", { name: "A\nB", avatarDataUrl: "" }))
        .status,
      400,
    );
    const saved = await student("/api/profile", {
      name: "  María Santos  ",
      avatarDataUrl: avatar,
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.data.user.name, "María Santos");
    assert.equal(saved.data.user.role, "student");
    assert.equal(saved.data.user.avatarDataUrl, avatar);
    assert.equal(saved.data.user.hash, undefined);
    let w = (await teacher("/api/workspace")).data;
    assert.equal(w.user.name, "Class Teacher");
    assert.equal(
      w.users.find((entry: any) => entry.id === "maria").name,
      "María Santos",
    );
    assert.equal(
      w.users.find((entry: any) => entry.id === "maria").avatarDataUrl,
      undefined,
    );
    await f.stop();
    await f.start();
    w = (await student("/api/workspace")).data;
    assert.equal(w.user.name, "María Santos");
    assert.equal(w.user.avatarDataUrl, avatar);
    assert.equal(
      (
        await student("/api/profile", {
          name: "María Santos",
          avatarDataUrl: "",
        })
      ).status,
      200,
    );
    assert.equal(
      (await student("/api/workspace")).data.user.avatarDataUrl,
      undefined,
    );
  },
);

test(
  "Only teachers can rename the school, and the name persists",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture();
    t.after(() => f.cleanup());
    const teacher = client(f.url),
      student = client(f.url),
      anonymous = client(f.url);
    const setup = await teacher("/api/setup", {
      school: "School",
      username: "school-teacher",
      password: "school-password-123",
    });
    const account = setup.data.accounts.find(
      (entry: any) => entry.username === "maria",
    );
    await student("/api/login", { ...account, role: "student" });
    assert.equal(
      (await anonymous("/api/school", { school: "Anon" })).status,
      401,
    );
    assert.equal(
      (await student("/api/school", { school: "Student school" })).status,
      403,
    );
    assert.equal((await teacher("/api/school", { school: "  " })).status, 400);
    assert.equal(
      (await teacher("/api/school", { school: "A\nB" })).status,
      400,
    );
    const saved = await teacher("/api/school", {
      school: "  Mataas na Paaralang Mabini  ",
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.data.school, "Mataas na Paaralang Mabini");
    await f.stop();
    await f.start();
    assert.equal(
      (await student("/api/workspace")).data.school,
      "Mataas na Paaralang Mabini",
    );
  },
);
