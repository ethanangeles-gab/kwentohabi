import test from "node:test";
import assert from "node:assert/strict";
import { LoginProtection, canonicalOrigin } from "../server/security";
import {
  ANALYSIS_LIMITS,
  localAnalyze,
  validateAnalysis,
} from "../src/utils/analysis";
import {
  blankDraft,
  editChapter,
  newChapter,
  finishChapterSave,
  type WritingBuffers,
} from "../src/utils/writingDrafts";
const chapter = (id: string, authorId: string, text: string) => ({
  id,
  authorId,
  text,
  title: id,
  at: "2026-11-20T09:00:00+08:00",
});
test("QA-02: pending create acknowledges only its snapshot and retains newer typing as a revision", () => {
  const submitted = { ...blankDraft(), title: "New", text: "Submitted words" };
  const state: WritingBuffers = {
    activeKey: "new",
    buffers: {
      new: { ...submitted, text: "Submitted words plus newer writing" },
    },
  };
  const result = finishChapterSave(
    state,
    "new",
    submitted,
    chapter("saved", "maria", submitted.text),
  );
  assert.equal(result.activeKey, "chapter:saved");
  assert.equal(
    result.buffers[result.activeKey].text,
    "Submitted words plus newer writing",
  );
  assert.equal(result.buffers[result.activeKey].baseText, submitted.text);
  assert.equal(result.buffers[result.activeKey].chapterId, "saved");
});
test("QA-02: pending revision retains later typing and never clears another selected buffer", () => {
  const submitted = {
    ...blankDraft(),
    title: "c1",
    chapterId: "c1",
    baseText: "Old",
    text: "Submitted",
  };
  const state: WritingBuffers = {
    activeKey: "new",
    buffers: {
      new: { ...blankDraft(), text: "An independent new chapter" },
      "chapter:c1": { ...submitted, text: "Submitted plus newer revision" },
    },
  };
  const result = finishChapterSave(
    state,
    "chapter:c1",
    submitted,
    chapter("c1", "maria", submitted.text),
  );
  assert.equal(result.activeKey, "new");
  assert.equal(result.buffers.new.text, state.buffers.new.text);
  assert.equal(
    result.buffers["chapter:c1"].text,
    "Submitted plus newer revision",
  );
  assert.equal(result.buffers["chapter:c1"].baseText, "Submitted");
});
test("QA-03: opening and switching revisions retains new and edited buffers independently", () => {
  const original: WritingBuffers = {
    activeKey: "new",
    buffers: { new: { ...blankDraft(), text: "Unsaved new story" } },
  };
  let state = editChapter(original, chapter("c1", "maria", "Server text"));
  state.buffers["chapter:c1"].text = "My unsaved revision";
  state = newChapter(state);
  assert.equal(state.buffers.new.text, "Unsaved new story");
  state = editChapter(state, chapter("c1", "maria", "Newer server text"));
  assert.equal(state.buffers["chapter:c1"].text, "My unsaved revision");
  assert.equal(state.buffers["chapter:c1"].baseText, "Server text");
});
test("QA-04: successful classroom batches do not consume failed-login budgets", () => {
  let now = 0;
  const guard = new LoginProtection(() => now);
  for (let i = 0; i < 100; i++) {
    const name = "student-" + i;
    assert(!guard.blocked("school-nat", name));
    guard.success("school-nat", name);
  }
  for (let i = 0; i < 5; i++) guard.failure("school-nat", "wrong-password");
  assert(guard.blocked("school-nat", "wrong-password"));
  assert(!guard.blocked("school-nat", "another-student"));
  now = 16 * 60_000;
  assert(!guard.blocked("school-nat", "wrong-password"));
});
test("QA-07: canonical origins reject paths and normalize genuine origins only", () => {
  assert.equal(
    canonicalOrigin("https://school.example/"),
    "https://school.example",
  );
  assert.throws(() => canonicalOrigin("https://school.example/path"));
  assert.throws(() => canonicalOrigin("https://user:secret@school.example"));
  assert.throws(() => canonicalOrigin("file:///example"));
});
test("QA-08: a small manuscript cannot amplify into thousands of persisted conflicts", () => {
  const text = Array.from(
    { length: 150 },
    (_, i) => `Lia is ${i + 1} years old.`,
  ).join(" ");
  const result = localAnalyze(
    [chapter("x", "maria", text)],
    "strict",
    "individual",
  );
  assert(result.facts.length <= ANALYSIS_LIMITS.facts);
  assert(result.contradictions.length <= ANALYSIS_LIMITS.conflicts);
  assert(result.coverage.truncated);
  assert(Buffer.byteLength(JSON.stringify(result)) < 250000);
  const many = localAnalyze(
    [
      chapter(
        "x",
        "maria",
        Array.from(
          { length: 1000 },
          (_, i) => `Lia is ${i + 1} years old.`,
        ).join(" "),
      ),
    ],
    "strict",
    "individual",
  );
  assert(many.facts.length <= 200);
  assert(many.coverage.truncated);
});
test("QA-09: shared provider conflicts require two authors and distinct evidence", () => {
  const chapters = [
    chapter("a", "maria", "Lia's eyes were brown."),
    chapter("b", "maria", "Lia's eyes were green."),
  ];
  const conflict = {
    subject: "Lia",
    attribute: "eye color",
    a: {
      chapter: "a",
      author: "maria",
      quote: chapters[0].text,
      value: "brown",
    },
    b: {
      chapter: "b",
      author: "maria",
      quote: chapters[1].text,
      value: "green",
    },
  };
  assert.throws(() =>
    validateAnalysis(
      { facts: [], contradictions: [conflict], flags: [] },
      chapters,
      "shared",
    ),
  );
  assert.equal(
    validateAnalysis(
      { facts: [], contradictions: [conflict], flags: [] },
      chapters,
      "individual",
    ).contradictions.length,
    1,
  );
  conflict.b = { ...conflict.a, value: "green" };
  assert.throws(() =>
    validateAnalysis(
      { facts: [], contradictions: [conflict], flags: [] },
      chapters,
      "individual",
    ),
  );
});
test("Safety context distinguishes clinical tests and games from injury and violence", () => {
  for (const text of [
    "The doctor ran a blood test.",
    "The children hit the target in a game.",
    "She donated blood at the clinic.",
    "They drank fruit punch.",
    "Sinukat ang presyon ng dugo.",
  ])
    assert.equal(
      localAnalyze([chapter("x", "maria", text)]).flags.length,
      0,
      text,
    );
  for (const text of [
    "Blood ran down his cheek after he was hit.",
    "The victim was stabbed.",
    "May dugo sa kanyang kamay.",
    "The doctor ordered a blood test after the child was stabbed.",
  ])
    assert(localAnalyze([chapter("x", "maria", text)]).flags.length > 0, text);
});
