import React, { useState } from 'react';
import { Shield, Users, CheckCircle, AlertOctagon, BarChart3, Sliders, History, FileCheck, Check, Sparkles, AlertCircle, HeartHandshake } from 'lucide-react';
import { AUTHORS } from '../data/initialData';
import { Chapter, Contradiction, Resolution, SafetyFlag, ResolutionLogEntry } from '../types';
import { SentimentDashboard } from './SentimentDashboard';
import { StoryTimeline } from './StoryTimeline';

interface TeacherDashboardProps {
  chapters: Chapter[];
  contradictions: Contradiction[];
  resolutions: Record<string, Resolution>;
  onTeacherDecide: (key: string, choice: 'a' | 'b' | 'both') => void;
  safetyFlags: SafetyFlag[];
  onDecideFlag: (key: string, decision: 'allow' | 'rework') => void;
  contentLevel: 'strict' | 'moderate' | 'literature';
  onChangeContentLevel: (level: 'strict' | 'moderate' | 'literature') => void;
  resolutionLogs: ResolutionLogEntry[];
  lang: 'tl' | 'en';
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  chapters,
  contradictions,
  resolutions,
  onTeacherDecide,
  safetyFlags,
  onDecideFlag,
  contentLevel,
  onChangeContentLevel,
  resolutionLogs,
  lang,
}) => {
  const [selectedContradictionKey, setSelectedContradictionKey] = useState<string | null>(null);

  const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
  const totalWords = chapters.reduce((sum, c) => sum + wordCount(c.text), 0) || 1;

  const openCount = contradictions.filter(c => !resolutions[c.key] || resolutions[c.key].type === 'teacher').length;
  const resolvedCount = contradictions.length - openCount;
  const pendingFlags = safetyFlags.filter(f => !f.decision);

  const getStatus = (key: string) => {
    const res = resolutions[key];
    if (!res) return 'open';
    return res.type;
  };

  return (
    <div className="space-y-8">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
              Teacher Command Hub
            </span>
            <span className="text-xs text-slate-300">Grade 9 - Seksyon Mabini (32 Students)</span>
          </div>
          <h2 className="text-2xl font-bold font-serif mt-1">
            {lang === 'tl' ? 'Ang Paningin ng Guro' : 'Teacher Supervision Dashboard'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {lang === 'tl'
              ? 'Grading Superpower: Ang guro ay hindi na naghahanap ng plot holes nang manu-mano. Ginugugol ang oras sa paghusga sa kalidad, pagkamalikhain, at pakikipagkapwa ng mag-aaral.'
              : 'Grading Superpower: AI handles low-level continuity collision tracking so you can focus on creativity, narrative craft, and group equity.'}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <div className="text-2xl font-bold font-mono text-white">{chapters.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">
              {lang === 'tl' ? 'Kabanata' : 'Chapters'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <div className="text-2xl font-bold font-mono text-amber-300">{openCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">
              {lang === 'tl' ? 'Bukas na Salungat' : 'Open Conflicts'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <div className="text-2xl font-bold font-mono text-emerald-300">{resolvedCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">
              {lang === 'tl' ? 'Nalutas na' : 'Resolved'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <div className="text-2xl font-bold font-mono text-rose-300">{pendingFlags.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">
              {lang === 'tl' ? 'Suriing Sipi' : 'Review Queue'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: CONTESTED FACTS MAP (From Slide 11) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>{lang === 'tl' ? 'Contested Facts Map' : 'Class-Level Contested Facts Map'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'tl'
                ? 'Isang class-level na mapa ng lahat ng pinagtatalunang detalye. Berde = Nalutas, Pula/Dilaw = May Salungatan, Asul = Hawak ng Guro.'
                : 'Interactive overview of all narrative collision threads across co-authors.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Resolved</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Pending</span>
            </span>
            <span className="flex items-center space-x-1 text-indigo-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Escalated to Teacher</span>
            </span>
          </div>
        </div>

        {/* Visual Woven Strand Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contradictions.map(c => {
            const authorA = AUTHORS[c.a.author] || AUTHORS.maria;
            const authorB = AUTHORS[c.b.author] || AUTHORS.jose;
            const status = getStatus(c.key);
            const res = resolutions[c.key];

            return (
              <div
                key={c.key}
                className={`p-4 rounded-xl border transition-all ${
                  status === 'open'
                    ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
                    : status === 'teacher'
                    ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-200'
                    : 'border-emerald-200 bg-emerald-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-800">
                    {c.subject} · {c.attribute}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      status === 'open'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : status === 'teacher'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {status === 'open' ? 'Pending' : status === 'teacher' ? 'Action Needed' : 'Resolved'}
                  </span>
                </div>

                <div className="space-y-1 text-xs mb-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: authorA.avatarColor }}></span>
                      <span>{authorA.firstName}:</span>
                    </span>
                    <span className="font-semibold text-slate-900">{c.a.value}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: authorB.avatarColor }}></span>
                      <span>{authorB.firstName}:</span>
                    </span>
                    <span className="font-semibold text-slate-900">{c.b.value}</span>
                  </div>
                </div>

                {/* If escalated to teacher, show teacher decision buttons */}
                {status === 'teacher' ? (
                  <div className="pt-2 border-t border-indigo-200 space-y-1.5">
                    <p className="text-[11px] font-bold text-indigo-900">
                      {lang === 'tl' ? 'Pumili ng Desisyon para sa Grupo:' : 'Choose Teacher Verdict:'}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => onTeacherDecide(c.key, 'a')}
                        className="py-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold truncate"
                        title={`Use ${authorA.firstName}'s version`}
                      >
                        {authorA.firstName}
                      </button>
                      <button
                        onClick={() => onTeacherDecide(c.key, 'b')}
                        className="py-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold truncate"
                        title={`Use ${authorB.firstName}'s version`}
                      >
                        {authorB.firstName}
                      </button>
                      <button
                        onClick={() => onTeacherDecide(c.key, 'both')}
                        className="py-1 px-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[10px] font-bold truncate"
                        title="Keep both as artistic device"
                      >
                        {lang === 'tl' ? 'Pareho' : 'Both'}
                      </button>
                    </div>
                  </div>
                ) : res ? (
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 italic line-clamp-2">
                    {res.summary}
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-700 bg-amber-100/50 p-1.5 rounded text-center">
                    {lang === 'tl' ? 'Sumusulat ng perspective notes ang mga mag-aaral' : 'Students drafting perspective notes'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION: SENTIMENT ANALYSIS DASHBOARD (Emotional Arc across chapters using Recharts) */}
      <SentimentDashboard chapters={chapters} lang={lang} />

      {/* SECTION: STORY TIMELINE (Chronological vs Submission Order & Pacing Issues) */}
      <StoryTimeline chapters={chapters} lang={lang} />

      {/* SECTION 2: WEEKLY CONTRIBUTION RECORD & ANTI-FREE-RIDER METER (From Slide 11) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>{lang === 'tl' ? 'Weekly Contribution Record' : 'Weekly Contribution & Attribution Record'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'tl'
                ? 'Anti-Free-Rider Meter: Malinaw na naipakikita kung sino ang sumulat, sino ang nag-ambag ng dialogue, at sino ang pumalya sa pagsusumite.'
                : 'Visible author contributions preventing free-riding and ensuring transparent group grading.'}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Total: {totalWords} words</span>
        </div>

        <div className="space-y-4">
          {Object.values(AUTHORS).map(author => {
            const authorChapters = chapters.filter(c => c.authorId === author.id);
            const authorWords = authorChapters.reduce((sum, c) => sum + wordCount(c.text), 0);
            const pct = Math.round((authorWords / totalWords) * 100);

            return (
              <div key={author.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: author.avatarColor }}
                    />
                    <span className="font-bold text-slate-900">{author.name}</span>
                    <span className="text-slate-500">({author.role})</span>
                  </div>

                  <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-600">
                    <span>{authorChapters.length} {lang === 'tl' ? 'kabanata' : 'chapters'}</span>
                    <span className="font-bold text-slate-900">{authorWords} {lang === 'tl' ? 'salita' : 'words'}</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Contribution Progress Bar */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(pct, 5)}%`,
                      backgroundColor: author.avatarColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: CONTENT FILTER LAYER & SAFE SPACE (From Slide 12) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'tl' ? 'Ligtas at Kontrolado ng Guro na Espasyo' : 'Safe & Teacher-Controlled Story Space'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'tl'
              ? 'Age-appropriate settings na nakalinya sa DepEd Child Protection Policy at Data Privacy Act (RA 10173). Hindi awtomatikong nagbubura ng teksto.'
              : 'Teacher sets content thresholds; AI suggests flags while human educator stays firmly in the loop.'}
          </p>
        </div>

        {/* Level Selector (Strict vs Moderate vs Literature) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            {lang === 'tl' ? 'Antas ng Pagsala ng Nilalaman (Content Level)' : 'Content Screening Level'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Strict */}
            <div
              onClick={() => onChangeContentLevel('strict')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                contentLevel === 'strict'
                  ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-2xs'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">Strict (Mahigpit)</span>
                {contentLevel === 'strict' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                {lang === 'tl'
                  ? 'Default para sa Junior High. Minamarkahan maging ang mild na away o pananakit.'
                  : 'Junior high default. Flags mild physical disputes and all graphic content.'}
              </p>
            </div>

            {/* Moderate */}
            <div
              onClick={() => onChangeContentLevel('moderate')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                contentLevel === 'moderate'
                  ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-2xs'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">Moderate (Katamtaman)</span>
                {contentLevel === 'moderate' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                {lang === 'tl'
                  ? 'Para sa Senior High. Minamarkahan lamang ang graphic violence o banta.'
                  : 'Senior high level. Flags severe graphic violence only.'}
              </p>
            </div>

            {/* Literature Study */}
            <div
              onClick={() => onChangeContentLevel('literature')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                contentLevel === 'literature'
                  ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-2xs'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">Literature Study</span>
                {contentLevel === 'literature' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                {lang === 'tl'
                  ? 'Walang automatic flags upang masuri ang mga klasikong akda tulad ng Noli Me Tangere nang may konteksto.'
                  : 'No automated blockades, enabling uninhibited study of classical Philippine literary conflicts.'}
              </p>
            </div>
          </div>
        </div>

        {/* Flagged Passages Queue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {lang === 'tl' ? 'Talaan ng Minarkahang Bahagi (Passages for Review)' : 'Flagged Passages for Review'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {pendingFlags.length} {lang === 'tl' ? 'naghihintay' : 'pending'}
            </span>
          </div>

          {safetyFlags.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              {lang === 'tl' ? 'Walang namarkahang bahagi sa kasalukuyang kuwento.' : 'No flagged passages under this content level.'}
            </div>
          ) : (
            safetyFlags.map(f => {
              const author = AUTHORS[f.author] || AUTHORS.ana;
              const isDistress = f.category === 'distress';

              return (
                <div
                  key={f.key}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    isDistress
                      ? 'border-amber-300 bg-amber-50/60'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{author.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({f.chapter})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDistress
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {f.category} · {f.severity}
                      </span>
                    </div>

                    {f.decision ? (
                      <span className="text-[11px] font-bold text-slate-700">
                        {lang === 'tl' ? 'Desisyon:' : 'Verdict:'} {f.decision === 'allow' ? 'Pinayagan' : 'Ipa-rework'}
                      </span>
                    ) : (
                      <div className="flex space-x-1.5">
                        <button
                          onClick={() => onDecideFlag(f.key, 'allow')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          {lang === 'tl' ? 'Payagan (Allow)' : 'Allow'}
                        </button>
                        <button
                          onClick={() => onDecideFlag(f.key, 'rework')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          {lang === 'tl' ? 'Ipa-rework (Ask Rework)' : 'Ask Rework'}
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="font-serif italic text-slate-800 text-sm bg-white p-2.5 rounded border border-slate-200">
                    "{f.quote}"
                  </p>

                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">{lang === 'tl' ? 'Paliwanag ng AI:' : 'AI Note:'}</span> {f.reason}
                  </div>

                  {isDistress && (
                    <div className="p-2 bg-amber-100/70 border border-amber-300 rounded text-[11px] text-amber-900 font-medium">
                      {lang === 'tl'
                        ? 'Paalala: Ipinapasa ito sa Guidance Counselor nang walang automatic diagnosis o parusa sa mag-aaral.'
                        : 'Notice: Routed to Guidance Counselor per school wellness policy; student is never penalized.'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SECTION 4: RESOLUTION AUDIT LOG */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-700" />
            <span>{lang === 'tl' ? 'Audit Log ng mga Kasunduan' : 'Conflict Resolution Audit Trail'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'tl'
              ? 'Talaan ng bawat kasunduan, pagsasama ng bersyon, at desisyong sinadya sa silid-aralan.'
              : 'Verifiable log of all student conflict resolutions and teacher arbitrations.'}
          </p>
        </div>

        <div className="space-y-2">
          {resolutionLogs.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              {lang === 'tl' ? 'Wala pang naitalang resolusyon.' : 'No resolutions recorded yet.'}
            </div>
          ) : (
            resolutionLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700 mt-0.5">{log.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
