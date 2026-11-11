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
}

export interface StoryFact {
  id: string;
  subject: string;
  attribute: string;
  value: string;
  authorId: string;
  chapterId: string;
  quote: string;
  status: 'canon' | 'contested' | 'alternative';
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
  type: 'merged' | 'both' | 'teacher' | 'teacher-decided';
  summary: string;
  at: string;
  resolvedValue?: string;
  sourceAuthor?: string;
}

export interface SafetyFlag {
  key: string;
  chapter: string;
  author: string;
  quote: string;
  category: 'violence' | 'self-harm' | 'sexual' | 'hate' | 'distress';
  severity: 'mild' | 'graphic';
  reason: string;
  decision?: 'allow' | 'rework';
}

export interface ResolutionLogEntry {
  id: string;
  at: string;
  text: string;
  type: string;
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
  emotionalTone: 'positive' | 'neutral' | 'melancholic' | 'intense_conflict' | 'hopeful';
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
  inStoryTimeValue: number; // relative hour / numerical progression
  durationEstimate: string;
  wordCount: number;
  pacingRating: 'dragging' | 'balanced' | 'rushed';
  pacingNote: string;
  narrativeTechnique: 'linear' | 'flashback' | 'time_skip' | 'simultaneous';
  temporalCollision?: string;
  keyQuote: string;
}
