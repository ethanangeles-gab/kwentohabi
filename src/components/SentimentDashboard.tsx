import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  Heart, 
  TrendingUp, 
  Sparkles, 
  Activity, 
  Compass, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  BookOpen, 
  Quote 
} from 'lucide-react';
import { Chapter } from '../types';
import { AUTHORS } from '../data/initialData';
import { analyzeChapterSentiment, detectStoryArcShape } from '../utils/sentimentAnalysis';

interface SentimentDashboardProps {
  chapters: Chapter[];
  lang: 'tl' | 'en';
}

export const SentimentDashboard: React.FC<SentimentDashboardProps> = ({ chapters, lang }) => {
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'arc' | 'tones'>('arc');

  // Compute sentiment data for all chapters
  const sentimentData = useMemo(() => {
    return chapters.map((ch, idx) => analyzeChapterSentiment(ch, idx));
  }, [chapters]);

  // Detect narrative arc shape
  const arcAnalysis = useMemo(() => {
    return detectStoryArcShape(sentimentData);
  }, [sentimentData]);

  // Selected chapter sentiment details
  const activeSentiment = sentimentData[selectedChapterIdx] || sentimentData[0];

  // Custom Tooltip for Recharts Emotional Arc
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200">{data.chapterTitle}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
              {data.authorFirstName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">{lang === 'tl' ? 'Valence (Damdamin):' : 'Valence:'}</span>
              <span className={`font-mono font-bold ${data.valence >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.valence > 0 ? `+${data.valence}` : data.valence}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{lang === 'tl' ? 'Tension (Tensyon):' : 'Tension:'}</span>
              <span className="font-mono font-bold text-amber-400">
                {data.tension} / 100
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-300">
            <span className="font-semibold text-amber-300">
              {lang === 'tl' ? data.dominantEmotionTl : data.dominantEmotion}
            </span>
          </div>

          <p className="font-serif italic text-[11px] text-slate-300 border-t border-slate-800 pt-1.5 line-clamp-2">
            "{data.keyQuote}"
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
              <Heart className="w-3 h-3 text-rose-600 inline" />
              <span>{lang === 'tl' ? 'Pagsusuri ng Damdamin' : 'Sentiment Analysis Arc'}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Recharts Engine</span>
          </div>
          <h3 className="text-xl font-bold font-serif text-slate-900 mt-1">
            {lang === 'tl' ? 'Emotional Arc at Tensyon ng Salaysay' : 'Story Emotional Arc & Narrative Tension'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            {lang === 'tl'
              ? 'Sinusubaybayan kung paano lumilipat ang damdamin (valence) at tensyon ng kuwento sa bawat kabanatang isinulat ng iba\'t ibang mag-aaral.'
              : 'Tracks the narrative valence and dramatic tension trajectory as the collaborative story unfolds across student chapters.'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('arc')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'arc' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? 'Emotional Curve' : 'Emotional Curve'}
          </button>
          <button
            onClick={() => setViewMode('tones')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'tones' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? 'Tone Breakdown' : 'Tone Breakdown'}
          </button>
        </div>
      </div>

      {/* STORY ARC CLASSIFICATION CALLOUT */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-amber-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              {lang === 'tl' ? 'Natukoy na Porma ng Banghay:' : 'Identified Story Arc Archetype:'}
            </span>
            <span className="text-xs font-extrabold text-indigo-950 bg-white/80 px-2 py-0.5 rounded border border-indigo-200">
              {lang === 'tl' ? arcAnalysis.arcTypeTl : arcAnalysis.arcType}
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {lang === 'tl' ? arcAnalysis.descriptionTl : arcAnalysis.description}
          </p>
        </div>

        <div className="bg-white/90 p-3 rounded-lg border border-indigo-100 text-xs text-slate-800 max-w-xs shrink-0">
          <span className="font-bold text-indigo-900 block mb-0.5">
            {lang === 'tl' ? 'Payo sa Guro:' : 'Pedagogical Advice:'}
          </span>
          <p className="text-[11px] text-slate-600 leading-snug">
            {arcAnalysis.pedagogicalAdvice}
          </p>
        </div>
      </div>

      {/* RECHARTS CHART CONTAINER */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'arc' ? (
            <AreaChart data={sentimentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="chapterTitle" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val, i) => `${sentimentData[i]?.authorFirstName || ''} (K${i + 1})`}
              />
              <YAxis 
                domain={[-100, 100]} 
                ticks={[-100, -50, 0, 50, 100]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => val === 0 ? '0 (Neutral)' : val > 0 ? `+${val}` : `${val}`}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Equilibrium Baseline', position: 'right', fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
              />
              <Area 
                type="monotone" 
                dataKey="valence" 
                name={lang === 'tl' ? 'Emotional Valence (-100 to +100)' : 'Emotional Valence (-100 to +100)'} 
                stroke="#1e3a8a" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorValence)" 
                activeDot={{ r: 6, fill: '#1e3a8a', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="tension" 
                name={lang === 'tl' ? 'Narrative Tension (0 to 100)' : 'Narrative Tension (0 to 100)'} 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                dot={{ r: 4, fill: '#f59e0b' }} 
              />
            </AreaChart>
          ) : (
            <BarChart data={sentimentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="chapterTitle" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickFormatter={(val, i) => `${sentimentData[i]?.authorFirstName || ''} (K${i + 1})`}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
              />
              <Bar dataKey="toneBreakdown.joyHope" name={lang === 'tl' ? 'Pag-asa at Ligaya' : 'Hope & Joy'} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="toneBreakdown.calmPeace" name={lang === 'tl' ? 'Kapayapaan' : 'Calm & Peace'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="toneBreakdown.sadnessLonging" name={lang === 'tl' ? 'Pangungulila' : 'Melancholy'} fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="toneBreakdown.fearConflict" name={lang === 'tl' ? 'Salungatan at Panganib' : 'Crisis & Conflict'} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* CHAPTER EMOTIONAL CARDS (Interactive Selector) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {sentimentData.map((s, idx) => {
          const isSelected = selectedChapterIdx === idx;
          const isPositive = s.valence >= 0;

          return (
            <div
              key={s.chapterId}
              onClick={() => setSelectedChapterIdx(idx)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: s.avatarColor }}
                  />
                  <span className="font-bold text-xs text-slate-900">{s.authorFirstName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({s.chapterTitle.split(':')[0]})</span>
                </div>

                <div className="flex items-center space-x-1">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Valence: {s.valence > 0 ? `+${s.valence}` : s.valence}
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-slate-800 mb-2">
                {lang === 'tl' ? s.dominantEmotionTl : s.dominantEmotion}
              </div>

              <p className="font-serif italic text-xs text-slate-600 bg-white p-2 rounded border border-slate-200 line-clamp-2">
                "{s.keyQuote}"
              </p>
            </div>
          );
        })}
      </div>

      {/* ACTIVE CHAPTER PEDAGOGICAL INSIGHT PANEL */}
      {activeSentiment && (
        <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeSentiment.avatarColor }}
              />
              <span className="font-bold text-sm">
                {activeSentiment.authorName} — {activeSentiment.chapterTitle}
              </span>
            </div>
            <span className="text-[11px] text-amber-400 font-mono">
              Tension: {activeSentiment.tension}/100 · Valence: {activeSentiment.valence}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                {lang === 'tl' ? 'Pangunahing Sipi ng Damdamin:' : 'Key Emotional Anchor Quote:'}
              </span>
              <p className="font-serif italic text-slate-200 bg-slate-800/80 p-2 rounded border border-slate-700">
                "{activeSentiment.keyQuote}"
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                {lang === 'tl' ? 'Pedagogical Observation for Teacher:' : 'Pedagogical Observation:'}
              </span>
              <p className="text-slate-300 leading-relaxed">
                {activeSentiment.pedagogicalNote}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
