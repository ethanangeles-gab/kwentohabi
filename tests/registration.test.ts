import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fixture, client } from "./runtime.mjs";

test(
  "Email identifiers register, deduplicate case-insensitively and sign in through the same role-based login",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture();
    t.after(() => f.cleanup());
    const owner = client(f.url);
    const teacherEmail = "school.teacher@example.school";
    assert.equal(
      (
        await owner("/api/setup", {
          school: "Email identifier school",
          username: teacherEmail,
          password: "teacher-email-password-123",
        })
      ).status,
      200,
    );
    const body = (username: string) => ({
      name: "Email Learner",
      username,
      password: "email-learner-password-123",
      confirmPassword: "email-learner-password-123",
      role: "student",
      classId: "mabini",
      privacyAccepted: true,
    });
    const learner = client(f.url),
      email = "story.learner+class@example.school";
    assert.equal(
      (await learner("/api/register", body("  " + email.toUpperCase() + "  ")))
        .status,
      201,
    );
    assert.equal((await learner("/api/workspace")).data.user.role, "student");
    assert.equal(
      (await client(f.url)("/api/register", body(email))).status,
      409,
    );
    await learner("/api/logout", {});
    assert.equal(
      (
        await learner("/api/login", {
          username: email.toUpperCase(),
          password: "email-learner-password-123",
          role: "student",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await client(f.url)("/api/login", {
          username: email,
          password: "email-learner-password-123",
          role: "teacher",
        })
      ).status,
      403,
    );
    for (const invalid of [
      "missing@",
      "two@@example.school",
      "bad email@example.school",
      ".name@example.school",
    ])
      assert.equal(
        (await client(f.url)("/api/register", body(invalid))).status,
        400,
      );
    const longEmail =
      "long.reader." +
      "a".repeat(42) +
      "@" +
      "b".repeat(55) +
      ".example.school";
    assert(longEmail.length > 80);
    assert.equal(
      (await client(f.url)("/api/register", body(longEmail))).status,
      201,
    );
    assert.equal(
      (
        await client(f.url)("/api/login", {
          username: longEmail,
          password: "email-learner-password-123",
          role: "student",
        })
      ).status,
      200,
    );
    const provisioned = await owner("/api/users", {
      name: "Provisioned Email Learner",
      username: "managed.learner@example.school",
      classId: "mabini",
    });
    assert.equal(provisioned.status, 201);
    assert.equal(
      (
        await client(f.url)("/api/login", {
          username: provisioned.data.username,
          password: provisioned.data.password,
          role: "student",
        })
      ).status,
      200,
    );
    await owner("/api/logout", {});
    assert.equal(
      (
        await owner("/api/login", {
          username: teacherEmail.toUpperCase(),
          password: "teacher-email-password-123",
          role: "teacher",
        })
      ).status,
      200,
    );
  },
);

test(
  "Open registration assigns role/class from the form, rejects privilege fields, and persists accounts",
  { timeout: 45000 },
  async (t) => {
    const f = await fixture();
    t.after(() => f.cleanup());
    const owner = client(f.url),
      anonymous = client(f.url);
    assert.equal((await anonymous("/api/register", {})).status, 409);
    await owner("/api/setup", {
      school: "Registration test school",
      username: "registration-teacher",
      password: "registration-password-123",
    });
    const body = (username: string, role = "student", classId = "mabini") => ({
      name: "New Registered Learner",
      username,
      role,
      ...(role === "student" ? { classId } : {}),
      password: "new-account-password-123",
      confirmPassword: "new-account-password-123",
      privacyAccepted: true,
    });
    for (const changes of [
      { password: "short", confirmPassword: "short" },
      { confirmPassword: "different-password" },
      { privacyAccepted: false },
      { role: "admin" },
      { classId: "foreign" },
      { classId: undefined },
      { classIds: ["rizal"] },
      { isDemo: true },
      { inviteCode: "ABCDEF" },
      { username: "bad username" },
      { name: "A\nB" },
    ])
      assert.equal(
        (
          await anonymous("/api/register", {
            ...body("new-learner"),
            ...changes,
          })
        ).status,
        400,
      );
    const learner = client(f.url),
      registered = await learner("/api/register", body(" NEW-LEARNER "));
    assert.equal(registered.status, 201);
    assert.equal(registered.data.user.role, "student");
    assert.deepEqual(registered.data.user.classIds, ["mabini"]);
    assert.equal(registered.data.user.consentStatus, "pending");
    assert.equal(registered.data.user.isDemo, false);
    assert.equal(registered.data.user.hash, undefined);
    assert.deepEqual(
      (await learner("/api/workspace")).data.stories,
      [],
      "Joining a class does not join another group's manuscripts",
    );
    assert.equal(
      (await learner("/api/invitations?classId=mabini")).status,
      403,
    );
    assert.equal(
      (
        await learner("/api/stories", {
          title: "Foreign",
          mode: "individual",
          classId: "rizal",
        })
      ).status,
      400,
    );
    assert.equal(
      (await anonymous("/api/register", body("new-learner"))).status,
      409,
    );
    const rizal = await client(f.url)(
      "/api/register",
      body("rizal-learner", "student", "rizal"),
    );
    assert.equal(rizal.status, 201);
    assert.deepEqual(rizal.data.user.classIds, ["rizal"]);
    const colleague = client(f.url),
      joined = await colleague("/api/register", body("new-teacher", "teacher"));
    assert.equal(joined.status, 201);
    assert.equal(joined.data.user.role, "teacher");
    assert.deepEqual(joined.data.user.classIds, ["mabini", "rizal"]);
    await f.stop();
    const file = path.join(f.dir, "workspace.json"),
      snapshot = JSON.parse(await readFile(file, "utf8"));
    const savedUser = snapshot.users.find(
      (user: any) => user.id === registered.data.user.id,
    );
    assert(savedUser.hash && !savedUser.password);
    assert.equal(savedUser.registration.noticeVersion, "2026-11-20");
    assert(!JSON.stringify(snapshot).includes("new-account-password-123"));
    await f.start();
    const login = await client(f.url)("/api/login", {
      username: "new-learner",
      password: "new-account-password-123",
      role: "student",
    });
    assert.equal(login.status, 200);
  },
);

test(
  "Teachers still manage class join codes",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture();
    t.after(() => f.cleanup());
    const owner = client(f.url),
      anonymous = client(f.url);
    await owner("/api/setup", {
      school: "Invitation test school",
      username: "invitation-teacher",
      password: "invitation-password-123",
    });
    assert.equal(
      (await anonymous("/api/invitations?classId=mabini")).status,
      401,
    );
    assert.equal(
      (
        await owner("/api/invitations", {
          classId: "foreign",
          role: "student",
          maxUses: 1,
        })
      ).status,
      403,
    );
    const created = await owner("/api/invitations", {
      classId: "mabini",
      role: "student",
      maxUses: 2,
    });
    assert.equal(created.status, 201);
    assert.equal(
      (
        await owner(`/api/invitations/${created.data.invitation.id}/revoke`, {})
      ).status,
      200,
    );
  },
);
