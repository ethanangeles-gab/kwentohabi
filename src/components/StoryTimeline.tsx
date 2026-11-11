import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Hourglass, 
  GitCommit, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  FastForward, 
  Rewind, 
  Sparkles, 
  Eye, 
  ArrowDownUp, 
  Scale, 
  MessageSquare 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { Chapter, StoryEvent } from '../types';
import { AUTHORS } from '../data/initialData';
import { extractStoryTimeline } from '../utils/timelineAnalysis';

interface StoryTimelineProps {
  chapters: Chapter[];
  lang: 'tl' | 'en';
}

export const StoryTimeline: React.FC<StoryTimelineProps> = ({ chapters, lang }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [timelineMode, setTimelineMode] = useState<'dual_track' | 'chronological' | 'pacing_graph'>('dual_track');

  // Extract timeline and pacing diagnostic
  const { events, pacingSummary } = useMemo(() => {
    return extractStoryTimeline(chapters);
  }, [chapters]);

  const activeEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Recharts data comparing Submission Index (X) vs In-Story Time progression (Y)
  const chartData = events.map(e => ({
    submissionIndex: e.submissionIndex,
    chapterLabel: `K${e.submissionIndex}`,
    chronologicalIndex: e.chronologicalIndex,
    inStoryTimeValue: e.inStoryTimeValue,
    title: e.eventTitle,
    author: AUTHORS[e.authorId]?.firstName || e.authorId,
    pacingRating: e.pacingRating,
    wordCount: e.wordCount,
  }));

  // Chronologically sorted events
  const chronologicalEvents = useMemo(() => {
    return [...events].sort((a, b) => a.inStoryTimeValue - b.inStoryTimeValue);
  }, [events]);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-700" />
              <span>{lang === 'tl' ? 'Pagsusuri ng Timeline at Pacing' : 'Narrative Chronology & Pacing'}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Fabula vs. Syuzhet</span>
          </div>

          <h3 className="text-xl font-bold font-serif text-slate-900 mt-1">
            {lang === 'tl'
              ? 'Kronolohikal na Timeline laban sa Pagkakasunod-sunod ng Pagsusumite'
              : 'Story Chronology vs. Chapter Submission Order'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            {lang === 'tl'
              ? 'Ipinakikita ang pagkakaiba ng tunay na oras ng mga pangyayari sa kuwento (Fabula) laban sa pagkakasulat ng mga kabanata (Syuzhet) upang matukoy ang mga time-skip, anachronism, at pacing gaps.'
              : 'Visualizes in-story chronological event progression against student chapter submission order, flagging abrupt time jumps and narrative pacing bottlenecks.'}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setTimelineMode('dual_track')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timelineMode === 'dual_track' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? 'Dual Track (Habi)' : 'Dual Track (Weave)'}
          </button>
          <button
            onClick={() => setTimelineMode('pacing_graph')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timelineMode === 'pacing_graph' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? 'Pacing Curve' : 'Pacing Curve'}
          </button>
          <button
            onClick={() => setTimelineMode('chronological')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timelineMode === 'chronological' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? 'Kronolohikal na Ayos' : 'Chronological View'}
          </button>
        </div>
      </div>

      {/* PACING DIAGNOSTIC SUMMARY CALLOUT */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                pacingSummary.overallPacing === 'smooth'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {lang === 'tl' ? pacingSummary.overallPacingTl : pacingSummary.overallPacing}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Score: {pacingSummary.pacingScore}/100
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
            {lang === 'tl' ? pacingSummary.recommendationTl : pacingSummary.recommendation}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center min-w-[100px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === 'tl' ? 'Pacing Rating' : 'Pacing Health'}
            </span>
            <span className="text-sm font-extrabold text-amber-600">
              {pacingSummary.hasAnachronism ? 'Time Skip Gap' : 'Balanced Flow'}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: DUAL-TRACK WEAVE CONNECTOR (Interactive Visualizer) */}
      {timelineMode === 'dual_track' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
            {/* LEFT TRACK: Chapter Submission Order */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>{lang === 'tl' ? '1. Pagkakasunod ng Pagsusumite (Syuzhet)' : '1. Submission Order (Syuzhet)'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">As Written by Students</span>
              </div>

              <div className="space-y-3">
                {events.map((ev) => {
                  const author = AUTHORS[ev.authorId] || AUTHORS.maria;
                  const isSelected = activeEvent?.id === ev.id;
                  const isRushed = ev.pacingRating === 'rushed';

                  return (
                    <div
                      key={`sub-${ev.id}`}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                            {ev.submissionIndex}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{ev.eventTitle}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: author.avatarColor }}
                          />
                          <span className="text-[11px] font-semibold text-slate-700">{author.firstName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({ev.wordCount} words)</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 font-serif italic line-clamp-1">
                        "{ev.keyQuote}"
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-medium">
                          {lang === 'tl' ? 'Itinatag na Oras:' : 'Anchor:'} {ev.inStoryTime}
                        </span>
                        {isRushed && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                            Pacing Gap
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT TRACK: In-Story Chronology (Fabula) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>{lang === 'tl' ? '2. Tunay na Oras sa Kuwento (Fabula)' : '2. In-Story Chronology (Fabula)'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">True Timeline Order</span>
              </div>

              <div className="space-y-3">
                {chronologicalEvents.map((ev, cIdx) => {
                  const author = AUTHORS[ev.authorId] || AUTHORS.maria;
                  const isSelected = activeEvent?.id === ev.id;
                  const isTimeSkip = ev.narrativeTechnique === 'time_skip';

                  return (
                    <div
                      key={`chron-${ev.id}`}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-200 shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                            {cIdx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{ev.eventTitle}</span>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                          {ev.inStoryTime}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span className="italic font-serif">
                          {author.firstName} ({lang === 'tl' ? 'isinulat sa K' : 'written in Ch'} {ev.submissionIndex})
                        </span>
                        <span className="text-[10px] text-slate-500">{ev.durationEstimate}</span>
                      </div>

                      {ev.temporalCollision && (
                        <div className="mt-2 p-1.5 rounded bg-amber-100/70 text-amber-900 text-[10px] font-medium border border-amber-300">
                          {ev.temporalCollision}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PACING CURVE GRAPH (Genette Narrative Progression) */}
      {timelineMode === 'pacing_graph' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-900">
              {lang === 'tl' ? 'Paano basahin ang Pacing Curve:' : 'How to Interpret the Pacing Curve:'}
            </span>{' '}
            {lang === 'tl'
              ? 'Ipinapakita ng grapiko ang paglipas ng oras sa kuwento (Y-axis sa oras) habang sumusulong ang mga kabanata (X-axis). Ang matarik na pagtaas (steep slope) ay nagpapahiwatig ng mabilis na time skip na maaaring ikalito ng mambabasa kung walang pahiwatig.'
              : 'Plots in-story hours elapsed against sequential chapter progression. A sudden sharp vertical slope signifies an abrupt temporal gap/time-skip.'}
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="chapterLabel" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickFormatter={(val, i) => `${chartData[i]?.author} (${val})`}
                />
                <YAxis 
                  dataKey="inStoryTimeValue"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `${val}h`}
                  label={{ value: 'In-Story Hours Elapsed', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip 
                  formatter={(val: any, name: any, item: any) => [
                    `${val} in-story hours (${item.payload.title})`,
                    'Timeline Progression'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="inStoryTimeValue" 
                  name="In-Story Timeline Hour" 
                  stroke="#c2410c" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#c2410c', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: FULL CHRONOLOGICAL ASSEMBLY */}
      {timelineMode === 'chronological' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            {lang === 'tl'
              ? 'Preview kung paano mababasa ang kuwento kung aayusin ang mga eksena ayon sa totoong oras ng pagkaganap:'
              : 'Preview of narrative assembly reordered into true in-story chronological sequence:'}
          </p>

          <div className="space-y-3">
            {chronologicalEvents.map((ev, i) => {
              const author = AUTHORS[ev.authorId] || AUTHORS.maria;
              return (
                <div key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {i + 1}. {ev.eventTitle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {ev.inStoryTime}
                    </span>
                  </div>
                  <p className="font-serif italic text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                    "{ev.keyQuote}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {lang === 'tl' ? 'Orihinal na isinulat ni' : 'Authored by'} {author.name} (Kabanata {ev.submissionIndex})
                    </span>
                    <span className="font-semibold text-slate-700">{ev.wordCount} words</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED EVENT INSPECTOR & TEACHER ADVICE PANEL */}
      {activeEvent && (
        <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="font-bold text-sm">
                {activeEvent.eventTitle} (Kabanata {activeEvent.submissionIndex})
              </span>
            </div>
            <span className="text-amber-400 font-mono text-[11px]">
              {activeEvent.inStoryTime}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {lang === 'tl' ? 'Pagsusuri sa Pacing:' : 'Pacing Diagnostic:'}
              </span>
              <p className="text-slate-300 leading-relaxed">
                {activeEvent.pacingNote}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {lang === 'tl' ? 'Mungkahi sa Guro para sa Grupo:' : 'Teacher Formative Action:'}
              </span>
              <p className="text-amber-300 leading-relaxed">
                {activeEvent.pacingRating === 'rushed'
                  ? (lang === 'tl'
                      ? 'Ipayo sa grupo na magdagdag ng 1-2 pangungusap tungkol sa pagtitipon ng mga ulap o pag-aalala sa pantalan bago ang bagyo sa Kabanata 3.'
                      : 'Advise the student writing group to insert a transitional line establishing storm preparations between chapters.')
                  : (lang === 'tl'
                      ? 'Panatilihin ang kasalukuyang bilis ng paglalahad ng mga detalye.'
                      : 'Maintain current scene transition rhythm.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
