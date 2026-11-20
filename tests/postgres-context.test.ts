import assert from "node:assert/strict";
import { test } from "node:test";

process.env.VERCEL = "1";
const { createInitialDatabase, db, persist, runWithDatabase } =
  await import("../server/store");
const { LoginProtection } = await import("../server/security");

test("concurrent serverless requests use isolated workspace snapshots", async () => {
  const first = createInitialDatabase();
  first.school = "First school";
  const second = createInitialDatabase();
  second.school = "Second school";

  const results = await Promise.all([
    runWithDatabase(first, async (context) => {
      db.school = "Updated first school";
      await new Promise((resolve) => setTimeout(resolve, 10));
      persist();
      return { school: db.school, dirty: context.dirty };
    }),
    runWithDatabase(second, async (context) => {
      db.school = "Updated second school";
      await new Promise((resolve) => setTimeout(resolve, 1));
      persist();
      return { school: db.school, dirty: context.dirty };
    }),
  ]);

  assert.deepEqual(results, [
    { school: "Updated first school", dirty: true },
    { school: "Updated second school", dirty: true },
  ]);
  assert.equal(first.school, "Updated first school");
  assert.equal(second.school, "Updated second school");
});

test("serverless failed sign-in limits are stored with the request workspace", () => {
  const database = createInitialDatabase();
  runWithDatabase(database, (context) => {
    const protection = new LoginProtection(() => 1000, true);
    for (let attempt = 0; attempt < 5; attempt++)
      protection.failure("school-network", "student@example.test");

    assert.equal(
      protection.blocked("school-network", "student@example.test"),
      true,
    );
    assert.equal(context.dirty, true);
  });
  assert.equal(
    Object.keys(database.rateLimits).filter((key) => key.startsWith("pair:"))
      .length,
    1,
  );
});
