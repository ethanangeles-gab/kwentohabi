import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidAccountIdentifier,
  normalizeAccountIdentifier,
} from "../src/utils/accountIdentifier";

test("Username/email identifiers accept real email shapes, legacy usernames, and email lengths beyond 80 characters", () => {
  const longest =
    "a".repeat(64) +
    "@" +
    "b".repeat(63) +
    "." +
    "c".repeat(63) +
    "." +
    "d".repeat(61);
  assert.equal(longest.length, 254);
  for (const valid of [
    "maria",
    "school.learner_01",
    "teacher-two",
    "reader@example.com",
    "Story.Writer+class@school-example.edu.ph",
    "  READER@EXAMPLE.COM  ",
    longest,
  ])
    assert.equal(isValidAccountIdentifier(valid), true, valid);
  for (const invalid of [
    "",
    "ab",
    "a".repeat(81),
    "bad username",
    "reader@",
    "@example.com",
    "reader@example",
    "reader@@example.com",
    "first..last@example.com",
    ".reader@example.com",
    "reader.@example.com",
    "reader@-example.com",
    "reader@example-.com",
    "reader@exa mple.com",
    "reader@example..com",
    "a".repeat(65) + "@example.com",
    longest + "x",
    null,
    {},
  ])
    assert.equal(isValidAccountIdentifier(invalid), false, String(invalid));
  assert.equal(
    normalizeAccountIdentifier("  Story.Writer+Class@Example.School  "),
    "story.writer+class@example.school",
  );
});
