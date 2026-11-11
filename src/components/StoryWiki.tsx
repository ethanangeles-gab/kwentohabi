import React, { useState } from 'react';
import { Database, GitCompare, Layers, Cpu, CheckCircle2, AlertTriangle, Search, Filter, Sparkles, BookOpen, UserCheck, MessageSquareCode, ArrowRight } from 'lucide-react';
import { AUTHORS } from '../data/initialData';
import { StoryFact, Contradiction, Resolution } from '../types';

interface StoryWikiProps {
  facts: StoryFact[];
  contradictions: Contradiction[];
  resolutions: Record<string, Resolution>;
  storySummary: string;
  lang: 'tl' | 'en';
}

export const StoryWiki: React.FC<StoryWikiProps> = ({
  facts,
  contradictions,
  resolutions,
  storySummary,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [activePhase, setActivePhase] = useState<number>(2);

  // Filtered facts
  const filteredFacts = facts.filter(f => {
    const matchesSearch =
      f.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.attribute.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.quote.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAuthor = selectedAuthor === 'all' || f.authorId === selectedAuthor;
    return matchesSearch && matchesAuthor;
  });

  const getFactStatus = (f: StoryFact) => {
    const key = `${f.subject.toLowerCase()}|${f.attribute.toLowerCase()}`;
    const res = resolutions[key];
    if (res) {
      if (res.type === 'both') return 'intentional';
      if (res.type === 'merged' || res.type === 'teacher-decided') {
        return res.resolvedValue?.toLowerCase() === f.value.toLowerCase() ? 'canon' : 'superseded';
      }
      return 'in_review';
    }
    const hasCollision = contradictions.some(c => c.key === key);
    return hasCollision ? 'contested' : 'canon';
  };

  return (
    <div className="space-y-8">
      {/* 4-PHASE RECONCILIATION ENGINE OVERVIEW (Based on Slides 4-10) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Core Architecture
              </span>
              <h2 className="text-xl font-bold font-serif text-slate-900">
                {lang === 'tl'
                  ? 'Anatomy ng KwentoHabi: Isang Reconciliation Engine'
                  : 'KwentoHabi Architecture: The Reconciliation Engine'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'tl'
                ? 'Ang KwentoHabi ay hindi simpleng text generator. Ito ay isang reconciliation engine na nag-uugnay ng ideya mula sa maraming may-akda.'
                : 'KwentoHabi is not a generic text generator. It is a multi-author reconciliation engine.'}
            </p>
          </div>

          <div className="flex space-x-1">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setActivePhase(num)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activePhase === num
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Phase {num}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Phase 1 */}
          <div
            onClick={() => setActivePhase(1)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activePhase === 1
                ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              {lang === 'tl' ? 'Ingestion (Ang Batayan)' : 'Ingestion (Reference Standard)'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {lang === 'tl'
                ? 'Pagpasok ng rubric at model text ng guro mula sa shared archive bilang aktibong pamantayan.'
                : 'Rubric & model text ingestion to serve as active evaluation benchmarks.'}
            </p>
          </div>

          {/* Phase 2 */}
          <div
            onClick={() => setActivePhase(2)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activePhase === 2
                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <Database className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              {lang === 'tl' ? 'Memory & Parsing (Ang Paghabi)' : 'Semantic Memory & Parsing'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {lang === 'tl'
                ? 'Awtomatikong pag-extract ng AI sa facts [Entity, Attribute, Author, Timestamp] sa background.'
                : 'Automated fact extraction mapping entities, attributes, timestamps & authors.'}
            </p>
          </div>

          {/* Phase 3 */}
          <div
            onClick={() => setActivePhase(3)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activePhase === 3
                ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              {lang === 'tl' ? 'Collision Engine (Pagsalungat)' : 'Collision Detection Engine'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {lang === 'tl'
                ? 'Semantic Logic Gate: tinutukoy kung saan sumasalungat si Student B sa itinatag ni Student A.'
                : 'Logic Gate Trigger: alerts where Student B contradicts Student A across chapters.'}
            </p>
          </div>

          {/* Phase 4 */}
          <div
            onClick={() => setActivePhase(4)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activePhase === 4
                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              {lang === 'tl' ? 'Human Loop (Pagbuo ng Kapayapaan)' : 'Human Loop & Peacemaking'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {lang === 'tl'
                ? 'Socratic UI: Perspective notes, 3 resolution pathways (Merge, Sinadya, Guro). SDG 4 & 16.'
                : 'Socratic dialogue, perspective notes & intentionality resolution pathways.'}
            </p>
          </div>
        </div>

        {/* Phase Deep-Dive Detail Box */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white text-xs sm:text-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              {lang === 'tl' ? `Aktibong Pagsusuri: Phase ${activePhase}` : `Deep Dive: Phase ${activePhase}`}
            </span>
            <p className="text-slate-200 font-medium">
              {activePhase === 1 && (lang === 'tl'
                ? 'Pagtatakda ng Batayan: Ang rubric at kuwento ay na-parse bilang reference vector na ginagamit sa bawat pagsusuri.'
                : 'Ingestion Standards: Rubrics are parsed into criteria vectors that continuously benchmark student writing.')}
              {activePhase === 2 && (lang === 'tl'
                ? 'Story Wiki Extraction: Sa bawat pangungusap, kumukuha ang AI ng structured facts upang magkaroon ng persistent memory ang klase.'
                : 'Semantic Fact Extraction: Sentences are distilled into entity-attribute-value triplets attributed by author.')}
              {activePhase === 3 && (lang === 'tl'
                ? 'Collision Gate Trigger: Kung si Student A ay nagsulat ng "Batangas" at si Student B ay "Quezon", pansamantalang hihinto ang thread na iyon.'
                : 'Conflict Logic Gate: If Student A wrote Batangas and Student B wrote Quezon, the system halts only that thread.')}
              {activePhase === 4 && (lang === 'tl'
                ? 'Pagsasanay sa Paggalang: Nagtuturo ng pakikipagkapwa at mapayapang paglutas ng salungatan sa pamamagitan ng Socratic prompts.'
                : 'Constructive Peacemaking: Minors practice structured respectful disagreement before committing edits.')}
            </p>
          </div>

          <div className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 font-mono text-xs">
            {activePhase === 2 ? `${facts.length} facts in memory` : activePhase === 3 ? `${contradictions.length} collisions detected` : 'Active'}
          </div>
        </div>
      </section>

      {/* STORY WIKI LIVING DATABASE */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-amber-600" />
              <span>{lang === 'tl' ? 'Ang Living Story Wiki' : 'The Living Story Wiki'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'tl'
                ? 'Lahat ng naitatag na katotohanan (facts) sa mundo ng kuwento, naka-tag ayon sa may-akda at kabanata.'
                : 'All established canon details parsed from student submissions with full author attribution.'}
            </p>
          </div>

          {/* Search & Author Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={lang === 'tl' ? 'Maghanap ng tauhan, lugar...' : 'Search facts...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
              />
            </div>

            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">{lang === 'tl' ? 'Lahat ng May-Akda' : 'All Authors'}</option>
              {Object.values(AUTHORS).map(a => (
                <option key={a.id} value={a.id}>{a.firstName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Story World Summary Box */}
        {storySummary && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-950 flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{lang === 'tl' ? 'Buod ng Mundo ng Kuwento (AI Lore Synthesis):' : 'World Lore Synthesis:'}</span>{' '}
              {storySummary}
            </div>
          </div>
        )}

        {/* Fact Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 uppercase tracking-wider">{lang === 'tl' ? 'Tauhan / Paksa' : 'Subject'}</th>
                <th className="py-3 px-4 uppercase tracking-wider">{lang === 'tl' ? 'Katangian' : 'Attribute'}</th>
                <th className="py-3 px-4 uppercase tracking-wider">{lang === 'tl' ? 'Halaga (Value)' : 'Established Value'}</th>
                <th className="py-3 px-4 uppercase tracking-wider">{lang === 'tl' ? 'May-akda' : 'Author'}</th>
                <th className="py-3 px-4 uppercase tracking-wider">{lang === 'tl' ? 'Katayuan' : 'Status'}</th>
                <th className="py-3 px-4 uppercase tracking-wider">{lang === 'tl' ? 'Orihinal na Sipi' : 'Source Quote'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    {lang === 'tl' ? 'Walang nahanap na facts.' : 'No story facts match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredFacts.map((f) => {
                  const author = AUTHORS[f.authorId] || AUTHORS.maria;
                  const status = getFactStatus(f);

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{f.subject}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{f.attribute}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {f.value}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: author.avatarColor }}
                          />
                          <span className="font-medium text-slate-700">{author.firstName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({f.chapterId})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {status === 'canon' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Canon
                          </span>
                        )}
                        {status === 'contested' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            May Salungatan
                          </span>
                        )}
                        {status === 'intentional' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Sinadya (Creative Device)
                          </span>
                        )}
                        {status === 'superseded' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            Pinalitan
                          </span>
                        )}
                        {status === 'in_review' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Nasa Guro
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-serif text-slate-600 italic max-w-xs truncate" title={f.quote}>
                        "{f.quote}"
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CAPABILITY MATRIX (From Slide 3) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            {lang === 'tl' ? 'Matrix ng Kakayahan (Capability Matrix)' : 'Platform Capability Matrix'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'tl'
              ? 'Paghahambing sa pagitan ng Google Docs, Grammarly, ChatGPT, at KwentoHabi bilang collaborative writing tool.'
              : 'Competitive differentiator matrix comparing word processors, grammar checkers, chatbots, and KwentoHabi.'}
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{lang === 'tl' ? 'Kakayahan / Tampok' : 'Capability'}</th>
                <th className="py-3 px-4 text-center">Google Docs / Word</th>
                <th className="py-3 px-4 text-center">Grammarly</th>
                <th className="py-3 px-4 text-center">ChatGPT / Chatbots</th>
                <th className="py-3 px-4 text-center bg-indigo-50/70 font-bold text-indigo-950">KwentoHabi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">
                  1. {lang === 'tl' ? 'May semantic na pag-unawa sa teksto?' : 'Semantic story text understanding?'}
                </td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕ (Version history only)</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-3 px-4 text-center bg-indigo-50/70 text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">
                  2. {lang === 'tl' ? 'Nakakasubaybay sa maraming may-akda?' : 'Multi-author cross-checking?'}
                </td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕</td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕</td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕ (Single user prompt)</td>
                <td className="py-3 px-4 text-center bg-indigo-50/70 text-emerald-600 font-bold">
                  ✓ (Cross-Author Moat)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">
                  3. {lang === 'tl' ? 'May memorya ng mga nakaraang kabanata?' : 'Memory across past chapters & sessions?'}
                </td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕</td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕</td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕ (Session reset)</td>
                <td className="py-3 px-4 text-center bg-indigo-50/70 text-emerald-600 font-bold">
                  ✓ (Living Story Wiki)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">
                  4. {lang === 'tl' ? 'Socratic (Hindi nag-a-auto-rewrite)?' : 'Socratic feedback (No auto-rewrite)?'}
                </td>
                <td className="py-3 px-4 text-center text-slate-400">—</td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕ (Auto-replaces words)</td>
                <td className="py-3 px-4 text-center text-rose-500 font-bold">✕ (Rewrites student draft)</td>
                <td className="py-3 px-4 text-center bg-indigo-50/70 text-emerald-600 font-bold">
                  ✓ (Student stays author)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
