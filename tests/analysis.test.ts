import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_STORIES, INITIAL_RUBRICS } from "../src/data/initialData";
import {
  localAnalyze,
  validateAnalysis,
  reviewEvaluation,
} from "../src/utils/analysis";
import { extractStoryTimeline } from "../src/utils/timelineAnalysis";
import { analyzeChapterSentiment } from "../src/utils/sentimentAnalysis";
const chapter = (id: string, authorId: string, text: string) => ({
  id,
  authorId,
  text,
  title: id,
  at: new Date().toISOString(),
});

test("English facts retain author/chapter attribution and exact source evidence", () => {
  const chapters = INITIAL_STORIES[0].chapters,
    result = localAnalyze(chapters);
  assert(
    result.contradictions.some(
      (c) =>
        c.attribute === "eye color" &&
        c.a.author === "maria" &&
        c.b.author === "jose",
    ),
  );
  for (const f of result.facts)
    assert(
      chapters.some(
        (c) =>
          c.id === f.chapterId &&
          c.authorId === f.authorId &&
          c.text.includes(f.quote),
      ),
    );
  assert(
    result.contradictions.some(
      (c) =>
        c.attribute === "hometown" &&
        c.a.value === "Batangas" &&
        c.b.value === "Quezon",
    ),
  );
  assert(result.contradictions.some((c) => c.attribute === "siblings"));
});
test("Actual Filipino Makiling sample detects written-number ages and necklace material", () => {
  const result = localAnalyze(INITIAL_STORIES[1].chapters);
  assert(
    result.contradictions.some(
      (c) =>
        c.subject === "Samuel" &&
        c.attribute === "age" &&
        c.a.value === "15" &&
        c.b.value === "16",
    ),
  );
  assert(
    result.contradictions.some(
      (c) =>
        c.attribute === "necklace material" &&
        c.a.value === "tanso" &&
        c.b.value === "pilak",
    ),
  );
});
test("Three authors have independently addressable conflicts", () => {
  const result = localAnalyze(
    ["brown", "green", "blue"].map((color, i) =>
      chapter("c" + i, "a" + i, `Lia's eyes were ${color}.`),
    ),
  );
  assert.equal(result.contradictions.length, 3);
  assert.equal(new Set(result.contradictions.map((c) => c.key)).size, 3);
});
test("Individual mode reviews same-author history; shared mode checks cross-author pairs", () => {
  const chapters = [
    chapter("a", "maria", "Lia's eyes were brown."),
    chapter("b", "maria", "Lia's eyes were green."),
  ];
  assert.equal(
    localAnalyze(chapters, "strict", "shared").contradictions.length,
    0,
  );
  assert.equal(
    localAnalyze(chapters, "strict", "individual").contradictions.length,
    1,
  );
});
test("Consistent control and unsupported prose never invent contradictions or Lia summaries", () => {
  assert.equal(
    localAnalyze([
      chapter("a", "a", "Lia's eyes were brown."),
      chapter("b", "b", "Lia's eyes were brown."),
    ]).contradictions.length,
    0,
  );
  const r = localAnalyze([
    chapter("x", "a", "They enjoyed a peaceful picnic."),
  ]);
  assert.equal(r.facts.length, 0);
  assert.equal(r.storyWikiSummary, "");
});
for (const level of ["strict", "moderate", "literature"])
  test(`All high-risk categories remain reviewable in ${level}`, () => {
    const fixtures: [string, string][] = [
      ["self-harm", "I want to kill myself."],
      ["distress", "Gusto ko nang mawala."],
      ["sexual", "The story described sexual assault."],
      ["hate", "They shouted kill all immigrants."],
      ["violence", "May dugo sa kanyang kamay."],
      ["self-harm", "Gusto niyang magpakamatay."],
      ["sexual", "Tinalakay ang panggagahasa."],
      ["hate", "Sinabi niyang patayin ang lahat ng muslim."],
    ];
    for (const [category, text] of fixtures) {
      const flags = localAnalyze([chapter("x", "a", text)], level).flags;
      assert(
        flags.some((f) => f.category === category),
        text,
      );
      assert(flags.every((f) => !f.reason.includes("Routed")));
    }
  });
test("Invalid model evidence and malformed structure cannot become valid analysis", () => {
  const chapters = [chapter("x", "a", "Lia's eyes were brown.")];
  assert.throws(() =>
    validateAnalysis(
      {
        facts: [
          {
            subject: "Lia",
            attribute: "eyes",
            value: "brown",
            chapterId: "x",
            authorId: "b",
            quote: chapters[0].text,
          },
        ],
        contradictions: [],
        flags: [],
      },
      chapters,
    ),
  );
  assert.throws(() => validateAnalysis({ facts: [], flags: [] }, chapters));
  assert.throws(() =>
    validateAnalysis(
      {
        facts: [],
        contradictions: [],
        flags: [
          {
            chapter: "x",
            author: "a",
            quote: "invented",
            category: "violence",
            severity: "graphic",
            reason: "x",
          },
        ],
      },
      chapters,
    ),
  );
});
test("Unscored evaluation uses exactly selected criteria and actual source excerpts", () => {
  for (const rubric of INITIAL_RUBRICS) {
    const r = reviewEvaluation(INITIAL_STORIES[1].chapters, rubric, 2);
    assert.equal(r.criteria.length, rubric.criteria.length);
    assert(
      r.criteria.every(
        (c, i) =>
          c.name === rubric.criteria[i].name &&
          c.weight === rubric.criteria[i].weight &&
          c.score === null,
      ),
    );
    assert(
      r.criteria.every((c) =>
        c.evidence.every((e) =>
          INITIAL_STORIES[1].chapters.some(
            (ch) => ch.id === e.chapterId && ch.text.includes(e.quote),
          ),
        ),
      ),
    );
  }
});
test("Timeline derives from current text; unknown times and flashbacks do not fabricate collisions", () => {
  const picnic = extractStoryTimeline([
    chapter("c3", "ana", "They enjoyed a peaceful picnic."),
  ]);
  assert.equal(picnic.events[0].keyQuote, "");
  assert.equal(picnic.events[0].inStoryTimeValue, null);
  assert(!JSON.stringify(picnic).includes("storm"));
  assert.equal(picnic.pacingSummary.pacingScore, null);
  const flash = extractStoryTimeline([
    chapter("x", "a", "She remembered years ago, when they met."),
  ]);
  assert(flash.pacingSummary.hasFlashbacks);
  assert(!flash.pacingSummary.hasAnachronism);
});
test("Tone composition totals 100 for empty, neutral, positive-only, and mixed texts", () => {
  for (const text of [
    "",
    "table chair",
    "hope ".repeat(100),
    "hope blood sad tears calm danger",
  ]) {
    const b = analyzeChapterSentiment(
      chapter("x", "unknown", text),
      0,
    ).toneBreakdown;
    assert.equal(
      Object.values(b).reduce((a, b) => a + b, 0),
      100,
    );
    assert(Object.values(b).every((v) => v >= 0 && v <= 100));
  }
});
