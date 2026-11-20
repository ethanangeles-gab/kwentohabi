export interface StudentAuthor {
  id: string;
  name: string;
  firstName: string;
  avatarColor: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  role: string;
}

export interface Chapter {
  id: string;
  authorId: string;
  title: string;
  at: string;
  text: string;
  review?: {
    status: "reviewed" | "rework";
    feedback: string;
    teacherId: string;
    at: string;
  };
}

export interface StoryFact {
  id: string;
  subject: string;
  attribute: string;
  value: string;
  authorId: string;
  chapterId: string;
  quote: string;
  status: "canon" | "contested" | "alternative";
}

export interface AnalysisCoverage {
  truncated: boolean;
  limits: {
    facts: number;
    conflicts: number;
    flags: number;
    quoteLength: number;
  };
  notice: string;
}

export interface WikiEntry {
  id: string;
  category:
    "character" | "location" | "object" | "event" | "relationship" | "rule";
  name: string;
  description: string;
  details: string;
  chapterIds: string[];
  createdBy: string;
  updatedAt: string;
}

export interface ChapterRevision extends Chapter {
  chapterId: string;
  revisionId: string;
  savedAt: string;
}

export interface ConsentRecord {
  status: "pending" | "recorded" | "declined" | "not-required";
  reference: string;
  noticeVersion: string;
  recordedAt: string;
  recordedBy: string;
}

export interface Contradiction {
  key: string;
  subject: string;
  attribute: string;
  a: {
    chapter: string;
    value: string;
    quote: string;
    author: string;
  };
  b: {
    chapter: string;
    value: string;
    quote: string;
    author: string;
  };
  explanation?: string;
  starterPrompts?: {
    aToB?: string;
    bToA?: string;
  };
}

export interface Resolution {
  key: string;
  type: "merged" | "both" | "teacher" | "teacher-decided";
  summary: string;
  at: string;
  resolvedValue?: string;
  sourceAuthor?: string;
  outcome?: "a" | "b" | "both";
  notes?: Record<string, string>;
}

export interface SafetyFlag {
  key: string;
  chapter: string;
  author: string;
  quote: string;
  category: "violence" | "self-harm" | "sexual" | "hate" | "distress";
  severity: "mild" | "graphic";
  reason: string;
  decision?: "allow" | "rework";
}

export interface ResolutionLogEntry {
  id: string;
  at: string;
  text: string;
  type: string;
  discussion?: {
    revision: number;
    conflict: Contradiction;
    notes: Record<string, string>;
  };
}

export interface DefenseQuestion {
  id: number;
  section: string;
  question: string;
  answer: string;
  questionTl?: string;
  answerTl?: string;
}

export interface RubricStandard {
  id: string;
  title: string;
  author: string;
  category: string;
  criteria: Array<{
    name: string;
    description: string;
    weight: number;
  }>;
  exemplarText?: string;
  source?: string;
  license?: string;
  attested?: boolean;
  visibility?: "class";
  withdrawn?: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
  role: "teacher" | "student";
  classIds: string[];
  isDemo?: boolean;
  consentStatus?: ConsentRecord["status"];
}

export interface StoryWorkspace {
  id: string;
  title: string;
  genre: string;
  gradeLevel: string;
  description: string;
  classId: string;
  memberIds: string[];
  mode: "shared" | "individual";
  chapters: Chapter[];
  version: number;
  revision: number;
  checkedRevision: number | null;
  contradictions: Contradiction[];
  facts: StoryFact[];
  safetyFlags: SafetyFlag[];
  resolutions: Record<string, Resolution>;
  notes: Record<string, Record<string, string>>;
  logs: ResolutionLogEntry[];
  contentLevel: "strict" | "moderate" | "literature";
  selectedRubricId: string;
  summary: string;
  checkMethod: string;
  contributions: {
    id: string;
    authorId: string;
    chapterId: string;
    at: string;
    wordsAdded: number;
    kind: string;
  }[];
  evaluations?: Record<string, Evaluation>;
  coverage?: AnalysisCoverage;
  instructions?: string;
  dueAt?: string;
  status?: "active" | "closed" | "archived";
  isDemo?: boolean;
  wikiEntries?: WikiEntry[];
}

export interface Evaluation {
  rubricId: string;
  revision: number;
  method: "gemini" | "teacher-review";
  criteria: {
    name: string;
    weight: number;
    score: number | null;
    feedback: string;
    evidence: { chapterId: string; quote: string }[];
  }[];
  notice: string;
  generatedAt?: string;
  generatedBy?: string;
  language?: "tl" | "en";
}

export interface ChapterSentiment {
  chapterId: string;
  chapterIndex: number;
  chapterTitle: string;
  authorId: string;
  authorName: string;
  authorFirstName: string;
  avatarColor: string;
  valence: number; // -100 to +100
  tension: number; // 0 to 100
  dominantEmotion: string;
  dominantEmotionTl: string;
  emotionalTone:
    "positive" | "neutral" | "melancholic" | "intense_conflict" | "hopeful";
  toneBreakdown: {
    joyHope: number;
    calmPeace: number;
    sadnessLonging: number;
    fearConflict: number;
  };
  keyQuote: string;
  pedagogicalNote: string;
}

export interface StoryEvent {
  id: string;
  chapterId: string;
  authorId: string;
  submissionIndex: number; // 1, 2, 3...
  chronologicalIndex: number; // 1, 2, 3...
  eventTitle: string;
  inStoryTime: string; // e.g. "Araw 1: Madaling Araw (Dawn)"
  inStoryTimeValue: number | null; // relative hour / numerical progression
  durationEstimate: string;
  wordCount: number;
  pacingRating: "dragging" | "balanced" | "rushed";
  pacingNote: string;
  narrativeTechnique: "linear" | "flashback" | "time_skip" | "simultaneous";
  temporalCollision?: string;
  keyQuote: string;
}
