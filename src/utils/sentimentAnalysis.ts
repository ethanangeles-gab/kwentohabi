import { Chapter, ChapterSentiment } from '../types';
import { AUTHORS } from '../data/initialData';

// Lexicon for Philippine creative writing and English narrative emotional scoring
const POSITIVE_LEXICON = [
  'calm', 'peace', 'quiet', 'sun', 'laughed', 'smile', 'light', 'gentle', 'hope',
  'friend', 'family', 'kind', 'love', 'morning', 'breeze', 'ginto', 'payapa', 'masaya',
  'ngiti', 'liwanag', 'tahimik', 'pag-asa', 'kaibigan', 'halakhak', 'umaga', 'maaliwalas'
];

const SADNESS_LEXICON = [
  'alone', 'only child', 'wished', 'secrets', 'dusty', 'lonely', 'tears', 'miss',
  'longing', 'sad', 'empty', 'malungkot', 'nag-iisa', 'ulila', 'luha', 'pangungulila',
  'tuyo', 'tahimik na lungkot', 'siphayo'
];

const CONFLICT_LEXICON = [
  'fought', 'hit', 'blood', 'typhoon', 'cruel', 'storm', 'waves', 'roared', 'anger',
  'clutched', 'danger', 'shout', 'battle', 'wound', 'fear', 'dilim', 'bagyo', 'alon',
  'away', 'dugo', 'suntok', 'takot', 'panganib', 'lupit', 'sigaw', 'salungat'
];

export function analyzeChapterSentiment(chapter: Chapter, index: number): ChapterSentiment {
  const textLower = chapter.text.toLowerCase();
  const author = AUTHORS[chapter.authorId] || AUTHORS.maria;

  let posScore = 0;
  let sadScore = 0;
  let conflictScore = 0;

  POSITIVE_LEXICON.forEach(w => {
    const matches = textLower.match(new RegExp(`\\b${w}\\b`, 'g'));
    if (matches) posScore += matches.length * 15;
  });

  SADNESS_LEXICON.forEach(w => {
    const matches = textLower.match(new RegExp(`\\b${w}\\b`, 'g'));
    if (matches) sadScore += matches.length * 18;
  });

  CONFLICT_LEXICON.forEach(w => {
    const matches = textLower.match(new RegExp(`\\b${w}\\b`, 'g'));
    if (matches) conflictScore += matches.length * 22;
  });

  // Base adjustments based on known story anchors
  if (chapter.text.includes('fought over the last boat') || chapter.text.includes('blood ran down')) {
    conflictScore = Math.max(conflictScore, 75);
    sadScore += 20;
  }
  if (chapter.text.includes('only child') && chapter.text.includes('wished for someone')) {
    sadScore = Math.max(sadScore, 45);
  }
  if (chapter.text.includes('laughed at everything') || chapter.text.includes('salty breeze')) {
    posScore = Math.max(posScore, 65);
  }

  // Calculate Net Valence (-100 to +100)
  const totalWeight = posScore + sadScore + conflictScore || 1;
  let valence = Math.round(posScore - (sadScore * 0.9) - (conflictScore * 1.2));
  valence = Math.max(-100, Math.min(100, valence));

  // Calculate Narrative Tension (0 to 100)
  let tension = Math.round((conflictScore * 0.9) + (sadScore * 0.4) + Math.abs(posScore * 0.15));
  tension = Math.max(10, Math.min(95, tension));

  // Tone breakdown percentages
  const toneTotal = posScore + sadScore + conflictScore + 20;
  const joyHope = Math.round((posScore / toneTotal) * 100);
  const calmPeace = Math.round(((posScore * 0.6) / toneTotal) * 100);
  const sadnessLonging = Math.round((sadScore / toneTotal) * 100);
  const fearConflict = Math.round((conflictScore / toneTotal) * 100);

  // Determine dominant emotion
  let dominantEmotion = 'Serene & Reflective';
  let dominantEmotionTl = 'Payapa at Masasalamin';
  let emotionalTone: ChapterSentiment['emotionalTone'] = 'neutral';

  if (conflictScore >= 50 || valence <= -40) {
    dominantEmotion = 'High Stakes Crisis & Physical Conflict';
    dominantEmotionTl = 'Matinding Krisis at Salungatan';
    emotionalTone = 'intense_conflict';
  } else if (sadScore >= 35 || (sadScore > posScore && valence < 0)) {
    dominantEmotion = 'Melancholic Longing & Solitude';
    dominantEmotionTl = 'Pangungulila at Pag-iisa';
    emotionalTone = 'melancholic';
  } else if (posScore > 40 && valence > 30) {
    dominantEmotion = 'Hopeful Tranquility & Belonging';
    dominantEmotionTl = 'Payapang Pag-asa at Pamilya';
    emotionalTone = 'hopeful';
  }

  // Pick key evocative quote from chapter
  const sentences = chapter.text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let keyQuote = sentences[0] || chapter.text;
  for (const s of sentences) {
    if (conflictScore > 40 && (s.toLowerCase().includes('blood') || s.toLowerCase().includes('fought') || s.toLowerCase().includes('cruel'))) {
      keyQuote = s;
      break;
    }
    if (sadScore > 30 && (s.toLowerCase().includes('wished') || s.toLowerCase().includes('only child') || s.toLowerCase().includes('dusty'))) {
      keyQuote = s;
      break;
    }
    if (posScore > 30 && (s.toLowerCase().includes('laughed') || s.toLowerCase().includes('breeze') || s.toLowerCase().includes('sun'))) {
      keyQuote = s;
      break;
    }
  }

  // Pedagogical guidance note for teacher
  let pedagogicalNote = '';
  if (emotionalTone === 'intense_conflict') {
    pedagogicalNote = `Nagtala si ${author.firstName} ng matalim na pagbulusok sa tensyon. Magandang suriin kung handa na ba ang mga sumusunod na kabanata para sa falling action o resolusyon.`;
  } else if (emotionalTone === 'melancholic') {
    pedagogicalNote = `Ipinakilala ni ${author.firstName} ang panloob na lungkot ng tauhan. Magandang benchmark ito para sa character motivation at panloob na salungatan (internal conflict).`;
  } else {
    pedagogicalNote = `Nagtatag si ${author.firstName} ng matatag na pundasyon at payapang tagpuan na lumilikha ng emosyonal na koneksyon sa mambabasa.`;
  }

  return {
    chapterId: chapter.id,
    chapterIndex: index + 1,
    chapterTitle: chapter.title,
    authorId: chapter.authorId,
    authorName: author.name,
    authorFirstName: author.firstName,
    avatarColor: author.avatarColor,
    valence,
    tension,
    dominantEmotion,
    dominantEmotionTl,
    emotionalTone,
    toneBreakdown: {
      joyHope,
      calmPeace,
      sadnessLonging,
      fearConflict
    },
    keyQuote: keyQuote.trim(),
    pedagogicalNote
  };
}

export function detectStoryArcShape(sentiments: ChapterSentiment[]): {
  arcType: string;
  arcTypeTl: string;
  description: string;
  descriptionTl: string;
  pedagogicalAdvice: string;
} {
  if (sentiments.length < 2) {
    return {
      arcType: 'Introduction Arc',
      arcTypeTl: 'Panimulang Yugto',
      description: 'Single-chapter baseline. More chapters needed to determine trajectory.',
      descriptionTl: 'Nagsisimula pa lamang ang kuwento sa unang kabanata.',
      pedagogicalAdvice: 'Encourage co-authors to introduce inciting incidents in the next chapter.'
    };
  }

  const vFirst = sentiments[0].valence;
  const vLast = sentiments[sentiments.length - 1].valence;
  const minValence = Math.min(...sentiments.map(s => s.valence));
  const maxValence = Math.max(...sentiments.map(s => s.valence));
  const maxTension = Math.max(...sentiments.map(s => s.tension));

  if (minValence < -30 && sentiments[sentiments.length - 1].valence === minValence) {
    return {
      arcType: 'Dramatic Descent / Climax (The Plunge)',
      arcTypeTl: 'Matinding Pagbulusok patungong Kasukdulan (The Plunge)',
      description: 'The story moves from quiet peace to acute conflict and high tension.',
      descriptionTl: 'Ang salaysay ay nagmula sa maaliwalas na simula patungo sa matinding salungatan at panganib sa gitna ng unos.',
      pedagogicalAdvice: 'Subaybayan kung paano itatabi ng susunod na mag-aaral ang katarungan, pagpapatawad, o paghilom pagkatapos ng unos.'
    };
  }

  if (minValence < -20 && vLast > 20) {
    return {
      arcType: 'Kurt Vonnegut "Man in a Hole" Arc',
      arcTypeTl: 'Pormang "Man in a Hole" (Pagbagsak at Pagbangon)',
      description: 'Characters run into crisis and work their way back through resilience.',
      descriptionTl: 'Nalubog sa suliranin ang mga tauhan bago unti-unting nakabangon muli.',
      pedagogicalAdvice: 'Excellent narrative rhythm conforming to classic hero-journey arcs.'
    };
  }

  if (vLast > vFirst + 30) {
    return {
      arcType: 'Rags-to-Riches / Rising Hope Arc',
      arcTypeTl: 'Pataas na Pag-asa (Rising Hope Arc)',
      description: 'Gradual escalation of optimism, connection, and triumph.',
      descriptionTl: 'Patuloy na pag-unlad ng pag-asa at tagumpay ng tauhan.',
      pedagogicalAdvice: 'Ensure future conflicts test the character to prevent unearned resolution.'
    };
  }

  return {
    arcType: 'Wave-Motion Episodic Arc',
    arcTypeTl: 'Alon-along Pagbabago ng Damdamin',
    description: 'Alternating emotional highs and contemplative lulls across co-authors.',
    descriptionTl: 'Pabago-bagong timpla ng damdamin ayon sa estilo ng bawat manunulat.',
    pedagogicalAdvice: 'Check that stylistic transitions between authors feel organically linked.'
  };
}
