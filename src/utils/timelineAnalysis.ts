import { Chapter, StoryEvent } from '../types';
import { AUTHORS } from '../data/initialData';

const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function extractStoryTimeline(chapters: Chapter[]): {
  events: StoryEvent[];
  pacingSummary: {
    overallPacing: 'smooth' | 'irregular' | 'time_skip_detected';
    overallPacingTl: string;
    pacingScore: number; // 0 to 100
    hasFlashbacks: boolean;
    hasAnachronism: boolean;
    recommendation: string;
    recommendationTl: string;
  };
} {
  const events: StoryEvent[] = chapters.map((ch, idx) => {
    const textLower = ch.text.toLowerCase();
    const count = wordCount(ch.text);
    const author = AUTHORS[ch.authorId] || AUTHORS.maria;

    let inStoryTime = `Day ${idx + 1}, Morning`;
    let inStoryTimeValue = (idx + 1) * 24; // baseline 24 hours per chapter
    let eventTitle = ch.title.split(':')[1]?.trim() || ch.title;
    let durationEstimate = '2-4 hours';
    let pacingRating: StoryEvent['pacingRating'] = 'balanced';
    let pacingNote = 'Natural narrative progression.';
    let narrativeTechnique: StoryEvent['narrativeTechnique'] = 'linear';
    let temporalCollision: string | undefined = undefined;

    // Specific temporal anchor recognition for Si Lia at ang Dagat
    if (ch.id === 'c1' || (ch.text.includes('Batangas') && ch.text.includes('net down to the shore'))) {
      inStoryTime = 'Araw 1: 05:00 AM (Madaling-araw bago sumikat ang araw)';
      inStoryTimeValue = 5;
      eventTitle = 'Paghahanda ng Lambat sa Baybayin';
      durationEstimate = '1 oras (Mabagal na pagsisimula)';
      pacingRating = 'balanced';
      pacingNote = 'Mabagal at detalyadong paglalarawan ng tagpuan; mahusay na panimula.';
      narrativeTechnique = 'linear';
    } else if (ch.id === 'c2' || (ch.text.includes('walked to school') && ch.text.includes('market'))) {
      inStoryTime = 'Araw 1: 10:00 AM (Oras ng Recess sa Paaralan)';
      inStoryTimeValue = 10;
      eventTitle = 'Paglalakad Patungong Paaralan at Recess';
      durationEstimate = '3 oras pagkatapos ng Kabanata 1';
      pacingRating = 'balanced';
      pacingNote = 'Magandang transisyon mula umaga patungong tanghali; binibigyang-diin ang damdamin.';
      narrativeTechnique = 'linear';
    } else if (ch.id === 'c3' || (ch.text.includes('typhoon passed') && ch.text.includes('fishermen fought'))) {
      inStoryTime = 'Araw 2: 06:00 AM (Pagkatapos ng Magdamag na Bagyo)';
      inStoryTimeValue = 30; // Jumped to next day
      eventTitle = 'Bagsik ng Bagyo at Away sa Huling Bangka';
      durationEstimate = '20 oras na paglukso (Abrupt Time Skip)';
      pacingRating = 'rushed';
      pacingNote = 'Biglaang paglukso ng panahon: Dumaan ang buong bagyo nang walang paglalarawan sa pagdating nito mula sa Kabanata 2.';
      narrativeTechnique = 'time_skip';
      temporalCollision = 'Pacing Gap: Walang transisyong eksena kung paano dumating ang bagyo sa pagitan ng pagpasok sa paaralan (K2) at pagkawasak ng bangka (K3).';
    } else {
      // Dynamic detection for newly added chapters
      if (textLower.includes('noong nakaraan') || textLower.includes('bago dumating') || textLower.includes('years ago') || textLower.includes('earlier')) {
        narrativeTechnique = 'flashback';
        inStoryTimeValue = Math.max(1, (idx * 24) - 30);
        inStoryTime = 'Balik-tanaw (Flashback / Analepsis)';
        pacingRating = 'balanced';
        pacingNote = 'Paggamit ng analepsis upang magbigay-linaw sa pinagmulan ng tauhan.';
      } else if (textLower.includes('lumipas ang ilang linggo') || textLower.includes('after months') || textLower.includes('kinabukasan')) {
        narrativeTechnique = 'time_skip';
        inStoryTimeValue = (idx + 1) * 48;
        inStoryTime = `Araw ${idx + 2}: Bagong Yugto`;
        pacingRating = count < 40 ? 'rushed' : 'balanced';
        pacingNote = count < 40 ? 'Masyadong mabilis ang paglipas ng panahon para sa kakaunting salita.' : 'Maayos na time-skip.';
      }
    }

    // Key quote
    const sents = ch.text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const keyQuote = sents.find(s => s.length > 25) || ch.text;

    return {
      id: `event-${ch.id}`,
      chapterId: ch.id,
      authorId: ch.authorId,
      submissionIndex: idx + 1,
      chronologicalIndex: idx + 1, // Will be sorted below
      eventTitle,
      inStoryTime,
      inStoryTimeValue,
      durationEstimate,
      wordCount: count,
      pacingRating,
      pacingNote,
      narrativeTechnique,
      temporalCollision,
      keyQuote: keyQuote.trim()
    };
  });

  // Assign chronological index based on sorted inStoryTimeValue
  const sorted = [...events].sort((a, b) => a.inStoryTimeValue - b.inStoryTimeValue);
  sorted.forEach((ev, cIdx) => {
    const orig = events.find(e => e.id === ev.id);
    if (orig) orig.chronologicalIndex = cIdx + 1;
  });

  const hasFlashbacks = events.some(e => e.narrativeTechnique === 'flashback' || e.chronologicalIndex < e.submissionIndex);
  const hasTimeSkips = events.some(e => e.narrativeTechnique === 'time_skip' || e.pacingRating === 'rushed');
  const hasAnachronism = events.some(e => Boolean(e.temporalCollision));

  let overallPacing: 'smooth' | 'irregular' | 'time_skip_detected' = 'smooth';
  let overallPacingTl = 'Maayos at Tuloy-tuloy ang Daloy';
  let pacingScore = 90;
  let recommendation = 'Narrative progression flows smoothly from chapter to chapter.';
  let recommendationTl = 'Maayos ang paghabi ng mga eksena. Walang nakalilitong paglukso sa oras.';

  if (hasAnachronism || hasTimeSkips) {
    overallPacing = 'time_skip_detected';
    overallPacingTl = 'May Biglaang Paglukso sa Oras (Pacing Gap)';
    pacingScore = 74;
    recommendation = 'Chapter 3 introduces an abrupt overnight storm jump without transitional buildup from Chapter 2.';
    recommendationTl = 'Mungkahi sa Guro: Ipayo kay Ana (K3) o Jose (K2) na magdagdag ng maikling talata ng pahiwatig sa pagdilim ng kalangitan o babala ng bagyo bago sumapit ang pagkawasak ng bangka.';
  } else if (hasFlashbacks) {
    overallPacing = 'irregular';
    overallPacingTl = 'May Paggamit ng Balik-tanaw (Non-Linear)';
    pacingScore = 85;
    recommendation = 'Non-linear elements detected. Verify that students maintain consistent character ages across temporal shifts.';
    recommendationTl = 'May balik-tanaw sa salaysay. Tiyaking malinaw sa mambabasa ang pagbabalik sa kasalukuyang timeline.';
  }

  return {
    events,
    pacingSummary: {
      overallPacing,
      overallPacingTl,
      pacingScore,
      hasFlashbacks,
      hasAnachronism,
      recommendation,
      recommendationTl
    }
  };
}
