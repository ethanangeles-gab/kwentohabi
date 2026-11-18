import type { Chapter, StoryEvent } from "../types";
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
export function extractStoryTimeline(chapters: Chapter[]) {
  const events: StoryEvent[] = chapters.map((ch, index) => {
    const time = ch.text.match(
      /\b(?:the next (?:day|morning)|the following day|years? later|days? later|hours? later|kinabukasan|pagkalipas ng [^.!?]{1,45}|noong [^.!?]{1,45}|kahapon|madaling araw|umaga|tanghali|hapon|gabi|morning|afternoon|evening|night)\b/i,
    );
    const flashback =
      /\b(?:years? (?:ago|earlier)|remembered|flashback|naalala|noong bata|nakaraan)\b/i.test(
        ch.text,
      );
    const skip =
      /\b(?:years? later|days? later|hours? later|pagkalipas|kinabukasan|next day|following day)\b/i.test(
        ch.text,
      );
    const quote = time
      ? (ch.text.match(/[^.!?]+[.!?]*/g) || [])
          .find((s) => s.includes(time[0]))
          ?.trim() || time[0]
      : "";
    return {
      id: `event:${ch.id}`,
      chapterId: ch.id,
      authorId: ch.authorId,
      submissionIndex: index + 1,
      chronologicalIndex: index + 1,
      eventTitle: ch.title,
      inStoryTime: time
        ? `Text cue / Pahiwatig: ${time[0]}`
        : "Time unknown / Hindi tiyak ang oras",
      inStoryTimeValue: null,
      durationEstimate: "Unknown / Hindi tiyak",
      wordCount: words(ch.text),
      pacingRating: "balanced",
      pacingNote:
        "Length alone cannot establish pacing. Teacher review required.",
      narrativeTechnique: flashback
        ? "flashback"
        : skip
          ? "time_skip"
          : "linear",
      keyQuote: quote,
    } as StoryEvent;
  });
  const hasFlashbacks = events.some(
      (e) => e.narrativeTechnique === "flashback",
    ),
    hasSkip = events.some((e) => e.narrativeTechnique === "time_skip");
  return {
    events,
    pacingSummary: {
      overallPacing: hasSkip
        ? ("time_skip_detected" as const)
        : ("irregular" as const),
      overallPacingTl: "Hindi pa napagtitibay ang kronolohiya",
      pacingScore: null,
      hasFlashbacks,
      hasAnachronism: false,
      recommendation:
        "Review explicit time cues in context. Unknown chronology is not a contradiction; chapter order is submission order.",
      recommendationTl:
        "Suriin ang mga pahiwatig ng oras. Ang hindi tiyak na kronolohiya ay hindi awtomatikong salungatan; pagkakasunod ng pagsumite ang ayos ng kabanata.",
    },
  };
}
