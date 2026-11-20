import assert from "node:assert/strict";
import test from "node:test";
import { fixture, client } from "./runtime.mjs";

test(
  "Login requires a matching selected role and cannot change account permissions",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture();
    t.after(() => f.cleanup());
    const owner = client(f.url);
    const setup = await owner("/api/setup", {
      school: "Role login test",
      username: "role-teacher",
      password: "role-login-password-123",
    });
    const teacher = {
      username: "role-teacher",
      password: "role-login-password-123",
    };
    const student = setup.data.accounts.find(
      (account: any) => account.username === "maria",
    );
    for (const role of [undefined, "", "admin", null, ["teacher"]]) {
      const attempt = await client(f.url)("/api/login", { ...teacher, role });
      assert.equal(attempt.status, 400);
      assert.equal(attempt.headers.get("set-cookie"), null);
    }
    for (const [credentials, wrongRole] of [
      [student, "teacher"],
      [teacher, "student"],
    ] as const) {
      const visitor = client(f.url);
      for (let i = 0; i < 6; i++) {
        const attempt = await visitor("/api/login", {
          ...credentials,
          role: wrongRole,
        });
        assert.equal(attempt.status, 403);
        assert.match(attempt.data.error, /selected role/);
        assert.equal(attempt.headers.get("set-cookie"), null);
      }
      assert.equal((await visitor("/api/workspace")).status, 401);
      const role = wrongRole === "teacher" ? "student" : "teacher";
      const signedIn = await visitor("/api/login", { ...credentials, role });
      assert.equal(signedIn.status, 200);
      assert.equal(signedIn.data.role, role);
      assert.equal((await visitor("/api/workspace")).data.user.role, role);
      if (role === "student")
        assert.equal(
          (
            await visitor("/api/users", {
              name: "Unauthorized",
              username: "unauthorized",
              classId: "mabini",
            })
          ).status,
          403,
        );
    }
    assert.equal(
      (
        await client(f.url)("/api/login", {
          ...student,
          password: "incorrect",
          role: "teacher",
        })
      ).status,
      401,
    );
    const users = (await owner("/api/workspace")).data.users;
    assert.equal(
      users.find((user: any) => user.id === "maria").role,
      "student",
    );
    assert.equal(
      users.find((user: any) => user.id === "teacher").role,
      "teacher",
    );
  },
);
