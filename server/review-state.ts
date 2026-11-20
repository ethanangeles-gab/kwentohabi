import type {
  Contradiction,
  StoryWorkspace,
  StoryFact,
  SafetyFlag,
  AnalysisCoverage,
} from "../src/types";
type Analysis = {
  facts: StoryFact[];
  contradictions: Contradiction[];
  flags: SafetyFlag[];
  storyWikiSummary: string;
  coverage: AnalysisCoverage;
};
const identity = (conflict: Contradiction) =>
  JSON.stringify([
    conflict.subject.toLowerCase().trim(),
    conflict.attribute.toLowerCase().trim(),
    [conflict.a, conflict.b]
      .map((side) => [
        side.chapter,
        side.author,
        side.value.toLowerCase().trim(),
      ])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  ]);
/** Rechecking or editing an unrelated chapter must not silently unlock teacher authority. */
export function applyAnalysis(
  story: StoryWorkspace,
  result: Analysis,
  method: string,
) {
  const unchanged = story.checkedRevision === story.revision;
  const decisions: StoryWorkspace["resolutions"] = {};
  for (const previous of story.contradictions) {
    const resolution = story.resolutions[previous.key];
    if (!resolution || (!unchanged && resolution.type !== "teacher-decided"))
      continue;
    if (
      ![previous.a, previous.b].every((side) =>
        story.chapters.some(
          (ch) =>
            ch.id === side.chapter &&
            ch.authorId === side.author &&
            ch.text.includes(side.quote),
        ),
      )
    )
      continue;
    const match = result.contradictions.find(
      (conflict) => identity(conflict) === identity(previous),
    );
    if (!match) continue;
    decisions[match.key] = { ...resolution, key: match.key };
    if (story.notes[previous.key])
      story.notes[match.key] ??= structuredClone(story.notes[previous.key]);
  }
  const oldFlags = story.safetyFlags;
  story.facts = result.facts;
  story.contradictions = result.contradictions;
  story.safetyFlags = result.flags.map((flag) => ({
    ...flag,
    decision: oldFlags.find((old) => old.key === flag.key)?.decision,
  }));
  story.resolutions = decisions;
  story.summary = result.storyWikiSummary;
  story.coverage = result.coverage;
  story.checkedRevision = story.revision;
  story.checkMethod = method;
}
