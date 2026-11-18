import type {
  Chapter,
  Contradiction,
  SafetyFlag,
  StoryFact,
  RubricStandard,
  Evaluation,
} from "../types";

export const LIMITATION =
  "Limited English/Filipino pattern check. Missing facts or flags do not establish consistency or suitability. Teacher review is required.";
export const evidenceId = (...parts: string[]) =>
  parts.map((p) => encodeURIComponent(p)).join("|");

export function localAnalyze(
  chapters: Chapter[],
  level: string = "strict",
  mode: string = "shared",
) {
  const facts: StoryFact[] = [];
  const flags: SafetyFlag[] = [];
  const add = (
    ch: Chapter,
    subject: string,
    attribute: string,
    value: string,
    quote: string,
  ) => {
    const id = evidenceId(
      ch.id,
      ch.authorId,
      subject.toLowerCase(),
      attribute,
      value.toLowerCase(),
      quote,
    );
    if (!facts.some((f) => f.id === id))
      facts.push({
        id,
        subject,
        attribute,
        value,
        quote,
        authorId: ch.authorId,
        chapterId: ch.id,
        status: "canon",
      });
  };
  for (const ch of chapters) {
    const sentences =
      ch.text
        .match(/[^.!?]+[.!?]*/g)
        ?.map((s) => s.trim())
        .filter(Boolean) || [];
    // Resolve pronouns only when this chapter names exactly one explicit subject.
    const named = [...ch.text.matchAll(/\b(?:si|Si) ([A-Z][a-z]+)\b/g)].map(
      (m) => m[1],
    );
    const subject = [...new Set(named)].length === 1 ? named[0] : null;
    for (const quote of sentences) {
      const rules: [
        RegExp,
        (m: RegExpMatchArray) => [string, string, string],
      ][] = [
        [
          /\b([A-Z][a-z]+)'s (eyes|hair) (?:were|was|are|is) ([a-z]+)/g,
          (m) => [m[1], m[2] === "eyes" ? "eye color" : "hair color", m[3]],
        ],
        [
          /\b([A-Z][a-z]+)'s ([a-z]+) (eyes|hair)\b/g,
          (m) => [m[1], m[3] === "eyes" ? "eye color" : "hair color", m[2]],
        ],
        [
          /\b([A-Z][a-z]+) (?:lived|lives|naninirahan|nakatira) (?:in|sa) (?:[^.!?]*? (?:in|sa) )?([A-Z][a-z]+)/g,
          (m) => [m[1], "hometown", m[2]],
        ],
        [
          /\b([A-Z][a-z]+) (?:was|is|ay) (\d+) (?:years old|taong gulang)/g,
          (m) => [m[1], "age", m[2]],
        ],
        [
          /\b([A-Z][a-z]+) (?:had|has|may) (one|two|three|four|five|isang|dalawang|tatlong|\d+) (brothers?|sisters?|siblings?|kapatid)/g,
          (m) => [m[1], "siblings", `${m[2]} ${m[3]}`],
        ],
        [
          /\b([A-Z][a-z]+) (?:was|is|ay) (?:an only child|nag-iisang anak)\b/g,
          (m) => [m[1], "siblings", "only child"],
        ],
        [
          /\b([A-Z][a-z]+) (?:has|had) (?:a |an )?([a-z]+) (necklace|pendant|ring|sword|amulet)\b/g,
          (m) => [m[1], `${m[3]} material`, m[2]],
        ],
        [
          /\b(?:Labing-limang|Labinlimang|Labing-anim|Labing-anim na|Labing-pitong|\d+)(?: na)? taong gulang si ([A-Z][a-z]+)/g,
          (m) => [
            m[1],
            "age",
            /limang/i.test(m[0])
              ? "15"
              : /anim/i.test(m[0])
                ? "16"
                : /pitong/i.test(m[0])
                  ? "17"
                  : m[0].match(/\d+/)![0],
          ],
        ],
        [
          /\bSi ([A-Z][a-z]+) ay may dalang (?:lumang |bagong )?(tanso|pilak|ginto)(?: na)? kwintas/g,
          (m) => [m[1], "necklace material", m[2]],
        ],
      ];
      for (const [re, read] of rules)
        for (const m of quote.matchAll(re)) add(ch, ...read(m), quote);
      const necklace = quote.match(
        /\b(?:kanyang|niya ang kanyang) (tanso|pilak|ginto)(?: na)? kwintas\b/i,
      );
      if (subject && necklace)
        add(ch, subject, "necklace material", necklace[1], quote);

      const safety: [SafetyFlag["category"], RegExp, SafetyFlag["severity"]][] =
        [
          [
            "self-harm",
            /\b(kill myself|hurt myself|end my life|suicide|magpakamatay|saktan ang sarili|wakasan ang buhay)\b/i,
            "graphic",
          ],
          [
            "distress",
            /\b(gusto ko nang mawala|ayoko na mabuhay|nobody cares about me|so hopeless|pagod na pagod na ako sa lahat)\b/i,
            "graphic",
          ],
          [
            "sexual",
            /\b(rape|sexual assault|sexual abuse|panggagahasa|sekswal na pang-aabuso|explicit sex)\b/i,
            "graphic",
          ],
          [
            "hate",
            /\b(kill all (?:muslims|christians|jews|immigrants)|racial slur|hate (?:all )?(?:muslims|christians|jews)|patayin ang lahat ng (?:muslim|kristiyano)|mas mababang lahi)\b/i,
            "graphic",
          ],
          [
            "violence",
            /\b(blood|dugo|bled|stabbed|sinaksak|gunshot|pinatay|corpse|bangkay|slaughter|pagpatay)\b/i,
            "graphic",
          ],
          [
            "violence",
            /\b(fought|nag-away|fight|hit|sinuntok|punch|tinamaan)\b/i,
            "mild",
          ],
        ];
      for (const [category, re, severity] of safety) {
        if (severity === "mild" && level !== "strict") continue;
        if (!re.test(quote)) continue;
        flags.push({
          key: evidenceId(ch.id, category, quote),
          chapter: ch.id,
          author: ch.authorId,
          quote,
          category,
          severity,
          reason:
            category === "distress" || category === "self-harm"
              ? "Possible distress cue in fictional text. Teacher review pending; no counselor referral has been sent."
              : `Possible ${category} cue; a teacher must interpret context. Literature mode still reviews high-risk content.`,
        });
        break;
      }
    }
  }
  const contradictions: Contradiction[] = [];
  for (let i = 0; i < facts.length; i++)
    for (let j = i + 1; j < facts.length; j++) {
      const a = facts[i],
        b = facts[j];
      if (
        a.subject.toLowerCase() !== b.subject.toLowerCase() ||
        a.attribute !== b.attribute ||
        a.value.toLowerCase() === b.value.toLowerCase() ||
        (mode === "shared" && a.authorId === b.authorId)
      )
        continue;
      const side = (f: StoryFact) => ({
        chapter: f.chapterId,
        author: f.authorId,
        value: f.value,
        quote: f.quote,
      });
      contradictions.push({
        key: evidenceId(a.id, b.id),
        subject: a.subject,
        attribute: a.attribute,
        a: side(a),
        b: side(b),
        explanation: `Possible inconsistency: "${a.value}" / "${b.value}". Discuss changes over time, perspective, or intentional differences before deciding.`,
      });
    }
  for (const f of facts)
    if (
      contradictions.some((c) => c.a.quote === f.quote || c.b.quote === f.quote)
    )
      f.status = "contested";
  return {
    facts,
    contradictions,
    flags,
    storyWikiSummary: "",
    notice: LIMITATION,
  };
}

export function validateAnalysis(data: any, chapters: Chapter[]) {
  const text = (v: unknown) =>
    typeof v === "string" && v.length > 0 && v.length <= 60000;
  const source = (chapter: unknown, author: unknown, quote: unknown) =>
    chapters.some(
      (c) =>
        c.id === chapter &&
        c.authorId === author &&
        text(quote) &&
        c.text.includes(quote as string),
    );
  if (
    !data ||
    !Array.isArray(data.facts) ||
    !Array.isArray(data.contradictions) ||
    !Array.isArray(data.flags) ||
    [...data.facts, ...data.contradictions, ...data.flags].length > 3000
  )
    throw new Error("Invalid analysis structure");
  const facts: StoryFact[] = data.facts.map((f: any) => {
    if (
      ![f.subject, f.attribute, f.value].every(text) ||
      !source(f.chapterId, f.authorId, f.quote)
    )
      throw new Error("Invalid fact evidence");
    return {
      ...f,
      id: evidenceId(
        f.chapterId,
        f.authorId,
        f.subject.toLowerCase(),
        f.attribute,
        f.value.toLowerCase(),
        f.quote,
      ),
      status: "canon",
    };
  });
  const contradictions: Contradiction[] = data.contradictions.map((c: any) => {
    if (
      ![c.subject, c.attribute].every(text) ||
      ![c.a, c.b].every(
        (s) => s && text(s.value) && source(s.chapter, s.author, s.quote),
      )
    )
      throw new Error("Invalid conflict evidence");
    return {
      ...c,
      key: evidenceId(
        c.subject,
        c.attribute,
        c.a.chapter,
        c.a.author,
        c.a.value,
        c.a.quote,
        c.b.chapter,
        c.b.author,
        c.b.value,
        c.b.quote,
      ),
    };
  });
  const flags: SafetyFlag[] = data.flags.map((f: any) => {
    if (
      !source(f.chapter, f.author, f.quote) ||
      !["violence", "self-harm", "sexual", "hate", "distress"].includes(
        f.category,
      ) ||
      !["mild", "graphic"].includes(f.severity) ||
      !text(f.reason)
    )
      throw new Error("Invalid safety evidence");
    return {
      ...f,
      key: evidenceId(f.chapter, f.category, f.quote),
      decision: undefined,
    };
  });
  return {
    facts,
    contradictions,
    flags,
    storyWikiSummary:
      typeof data.storyWikiSummary === "string"
        ? data.storyWikiSummary.slice(0, 2000)
        : "",
    notice: LIMITATION,
  };
}

export function reviewEvaluation(
  chapters: Chapter[],
  rubric: RubricStandard,
  revision: number,
  tl = false,
): Evaluation {
  return {
    rubricId: rubric.id,
    revision,
    method: "teacher-review",
    criteria: rubric.criteria.map((c) => ({
      name: c.name,
      weight: c.weight,
      score: null,
      feedback: tl
        ? `Suriin ang draft ayon sa: ${c.description}`
        : `Review the draft against: ${c.description}`,
      evidence: chapters
        .filter((ch) => ch.text.trim())
        .slice(0, 2)
        .map((ch) => ({
          chapterId: ch.id,
          quote:
            ch.text.match(/[^.!?]+[.!?]*/)?.[0]?.trim() ||
            ch.text.slice(0, 300),
        })),
    })),
    notice: tl
      ? "Kailangan ang pagsusuri ng guro. Walang awtomatikong marka dahil hindi available ang AI evaluator."
      : "Teacher review required. No automated score: the AI evaluator is unavailable. Evidence excerpts are reading prompts, not proof of meeting a criterion.",
  };
}
