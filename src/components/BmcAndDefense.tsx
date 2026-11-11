import React, { useState } from 'react';
import { 
  Building2, Users, Compass, Coins, Cpu, CheckSquare, Receipt, Sparkles, 
  HelpCircle, ChevronDown, ChevronRight, Calculator, Image as ImageIcon, 
  Search, Shield, GraduationCap, ArrowUpRight, CheckCircle2 
} from 'lucide-react';
import { BMC_BLOCKS, DEFENSE_QUESTIONS } from '../data/initialData';

interface BmcAndDefenseProps {
  lang: 'tl' | 'en';
}

export const BmcAndDefense: React.FC<BmcAndDefenseProps> = ({ lang }) => {
  const [subTab, setSubTab] = useState<'bmc' | 'defense' | 'infographics' | 'calculator'>('bmc');
  const [selectedBmcId, setSelectedBmcId] = useState<string>('vp');
  
  // Defense Q&A search & filters
  const [searchDefense, setSearchDefense] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [openQuestionIds, setOpenQuestionIds] = useState<number[]>([1, 3, 4, 8]);

  // Unit Economics Calculator State
  const [numStudents, setNumStudents] = useState<number>(1000);
  const [checksPerMonth, setChecksPerMonth] = useState<number>(20);
  const [costPerCheckUSD, setCostPerCheckUSD] = useState<number>(0.03);
  const [annualSeatFeePHP, setAnnualSeatFeePHP] = useState<number>(75);
  const [exchangeRate, setExchangeRate] = useState<number>(58);

  const toggleQuestion = (id: number) => {
    setOpenQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  // Unit Economics calculations
  const monthlyCostUSD = numStudents * checksPerMonth * costPerCheckUSD;
  const monthlyCostPHP = monthlyCostUSD * exchangeRate;
  const annualRevenuePHP = numStudents * annualSeatFeePHP;
  const monthlyRevenuePHP = annualRevenuePHP / 12;
  const monthlyMarginPHP = monthlyRevenuePHP - monthlyCostPHP;
  const marginPct = monthlyRevenuePHP > 0 ? Math.round((monthlyMarginPHP / monthlyRevenuePHP) * 100) : 0;

  // Filter defense questions
  const filteredQuestions = DEFENSE_QUESTIONS.filter(q => {
    const matchesSection = selectedSection === 'all' || q.section === selectedSection;
    const matchesSearch = 
      q.question.toLowerCase().includes(searchDefense.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchDefense.toLowerCase()) ||
      (q.questionTl && q.questionTl.toLowerCase().includes(searchDefense.toLowerCase())) ||
      (q.answerTl && q.answerTl.toLowerCase().includes(searchDefense.toLowerCase()));
    return matchesSection && matchesSearch;
  });

  const sections = Array.from(new Set(DEFENSE_QUESTIONS.map(q => q.section)));

  return (
    <div className="space-y-8">
      {/* HEADER & SUB-NAV */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Technopreneurship Stage 1
            </span>
            <span className="text-xs text-slate-500">Group 5 — 4-ISB | UST CICS</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900 mt-1">
            {lang === 'tl'
              ? 'KwentoHabi, Inc. — Business Model Canvas at Title Defense'
              : 'KwentoHabi, Inc. — BMC & Title Defense Command Center'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {lang === 'tl'
              ? 'Inihanda para kay Mr. Fernando Arazo Jr. · Corporation under RA 11232 · SDG 4, 16, 9, 10'
              : 'Submitted for Mr. Fernando Arazo Jr. · Corporation under RA 11232 · Aligning with SDGs 4, 16, 9, 10'}
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('bmc')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subTab === 'bmc' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? '9-Block Canvas' : '9-Block Canvas'}
          </button>
          <button
            onClick={() => setSubTab('defense')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subTab === 'defense' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? 'Q&A Defense Cheat Sheet' : 'Q&A Defense Sheet'}
          </button>
          <button
            onClick={() => setSubTab('calculator')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subTab === 'calculator' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? 'Unit Economics' : 'Unit Economics'}
          </button>
          <button
            onClick={() => setSubTab('infographics')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subTab === 'infographics' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'tl' ? 'Infographics & Mind Map' : 'Infographics & Mind Map'}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: 9-BLOCK BUSINESS MODEL CANVAS */}
      {subTab === 'bmc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {BMC_BLOCKS.map(block => (
              <div
                key={block.id}
                onClick={() => setSelectedBmcId(block.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedBmcId === block.id
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    {lang === 'tl' ? block.titleTl : block.title}
                  </span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                  {block.bullets.slice(0, 2).map((b, i) => (
                    <li key={i} className="line-clamp-2">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Active Block Inspector */}
          {(() => {
            const activeBlock = BMC_BLOCKS.find(b => b.id === selectedBmcId) || BMC_BLOCKS[1];
            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                      {lang === 'tl' ? 'Pagsusuri sa Bloke ng BMC' : 'BMC Block Deep Dive'}
                    </span>
                    <h3 className="text-xl font-bold font-serif text-slate-900">
                      {lang === 'tl' ? activeBlock.titleTl : activeBlock.title}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {lang === 'tl' ? 'Mga Nilalaman sa Canvas:' : 'Key Canvas Points:'}
                  </h4>
                  <ul className="space-y-2">
                    {activeBlock.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {lang === 'tl' ? 'Bakit Ito Naroon (Defense Rationale):' : 'Why It Is There (Defense Rationale):'}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {activeBlock.rationale}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Four Pillars of Technopreneurship Test (From Reviewer) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold font-serif text-slate-900">
              {lang === 'tl' ? 'Ang Apat na Haligi ng Technopreneurship' : 'The Four Technopreneurship Pillars'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-indigo-900 block text-sm">1. Innovative (Makabago)</span>
                <p className="text-slate-600">Cross-author continuity checking: pagtutugma ng detalye mula sa magkakaibang may-akda sa iisang dokumento (wala sa Grammarly, Notion, o Scrivener).</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-900 block text-sm">2. Sustainable (Napapanatili)</span>
                <p className="text-slate-600">Institutional licensing (₱50-₱100/seat) bilang anchor revenue; mas mababa nang malaki ang AI API cost ($0.40-$1.00/student/mo).</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-amber-900 block text-sm">3. Something New (Bago)</span>
                <p className="text-slate-600">Bagong paggamit ng AI: ginagawang kasangkapan sa pagtuturo, pagmamarka, at mapayapang pakikipagkapwa ang continuity checking.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-purple-900 block text-sm">4. Current Society Problem</span>
                <p className="text-slate-600">Tumutugon sa 91% Philippine learning poverty at totoong grading bottleneck ng 30+ mag-aaral sa bawat klase.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DEFENSE Q&A SIMULATOR */}
      {subTab === 'defense' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-serif text-slate-900">
                  {lang === 'tl' ? 'KwentoHabi Title Defense — Q&A Cheat Sheet' : 'Anticipated Panel Questions & Answers'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'tl'
                    ? 'Lahat ng posibleng tanong ng panel, nakaayos ayon sa paksa (Problem, Technology, Corporation, SDGs, Unit Economics).'
                    : 'Comprehensive answers to panel inquiries on moat, pedagogy, law, and unit economics.'}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchDefense}
                    onChange={(e) => setSearchDefense(e.target.value)}
                    placeholder={lang === 'tl' ? 'Maghanap ng tanong...' : 'Search question...'}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                  />
                </div>

                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">{lang === 'tl' ? 'Lahat ng Paksa' : 'All Topics'}</option>
                  {sections.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accordion Questions */}
            <div className="space-y-3 pt-2">
              {filteredQuestions.map(q => {
                const isOpen = openQuestionIds.includes(q.id);

                return (
                  <div key={q.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                    <button
                      onClick={() => toggleQuestion(q.id)}
                      className="w-full p-4 text-left bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-3 pr-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {q.id}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                            {q.section}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {lang === 'tl' && q.questionTl ? q.questionTl : q.question}
                          </span>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-slate-800 leading-relaxed border-t border-slate-200 space-y-2">
                        <p>{lang === 'tl' && q.answerTl ? q.answerTl : q.answer}</p>
                        {lang === 'tl' && (
                          <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 italic">
                            English version: "{q.answer}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: UNIT ECONOMICS CALCULATOR */}
      {subTab === 'calculator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'tl' ? 'Interactive Unit Economics Simulator' : 'Unit Economics & Procurement Runway'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'tl'
                  ? 'Patunayan ang kakayahan ng modelo: Tantiya sa gastos ng AI ($0.02 - $0.05 kada check) kumpara sa inaasahang ₱50 - ₱100 seat fee.'
                  : 'Demonstrating margin viability against the 6-12 month educational sales cycle.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Inputs */}
              <div className="space-y-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-700">
                  {lang === 'tl' ? 'Mga Parametro (Variables)' : 'Parameters'}
                </h4>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>{lang === 'tl' ? 'Bilang ng mga Mag-aaral:' : 'Number of Student Seats:'}</span>
                    <span className="font-bold font-mono text-slate-900">{numStudents.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={numStudents}
                    onChange={(e) => setNumStudents(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>{lang === 'tl' ? 'Checks kada estudyante bawat buwan:' : 'Checks per student / mo:'}</span>
                    <span className="font-bold font-mono text-slate-900">{checksPerMonth}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={checksPerMonth}
                    onChange={(e) => setChecksPerMonth(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>{lang === 'tl' ? 'Tantiyang Gastos sa Gemini API ($/check):' : 'Estimated Gemini Cost ($/check):'}</span>
                    <span className="font-bold font-mono text-slate-900">${costPerCheckUSD.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.10"
                    step="0.005"
                    value={costPerCheckUSD}
                    onChange={(e) => setCostPerCheckUSD(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>{lang === 'tl' ? 'Taunang Bayad sa Lisensya kada Upuan (PHP):' : 'Annual Seat License Fee (PHP):'}</span>
                    <span className="font-bold font-mono text-slate-900">₱{annualSeatFeePHP}</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="5"
                    value={annualSeatFeePHP}
                    onChange={(e) => setAnnualSeatFeePHP(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Output Cards */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {lang === 'tl' ? 'Buwanang Gastos sa AI' : 'Monthly AI Cost'}
                    </span>
                    <div className="text-xl font-bold font-mono text-rose-600 mt-1">
                      ${monthlyCostUSD.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      (₱{monthlyCostPHP.toLocaleString()})
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {lang === 'tl' ? 'Buwanang Kita (Amortized)' : 'Monthly Revenue'}
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                      ₱{monthlyRevenuePHP.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      (₱{annualRevenuePHP.toLocaleString()} / taon)
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-indigo-950 text-white space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                      {lang === 'tl' ? 'Tantiyang Gross Margin:' : 'Estimated Gross Margin:'}
                    </span>
                    <span className="text-2xl font-bold font-mono text-amber-400">{marginPct}%</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lang === 'tl'
                      ? 'Konklusyon ng Depensa: Kahit sa pinakamababang ₱50-100 fee, nananatiling sapat ang kita para masalo ang gastos sa AI at magpatakbo ng pilot schools.'
                      : 'Defense Takeaway: The AI check cost ($0.40-$1.00 per student per month) is significantly smaller than the institutional seat license.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: INFOGRAPHICS & MIND MAP FROM ATTACHMENTS */}
      {subTab === 'infographics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'tl' ? 'Mga Grapiko at Mind Map ng KwentoHabi' : 'Project Visual Assets & Infographics'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'tl'
                  ? 'Mga opisyal na diagram mula sa BMC presentation ng UST Group 5.'
                  : 'Diagrams and architectural schematics submitted with the Technopreneurship portfolio.'}
              </p>
            </div>

            {/* Traditional vs KwentoHabi Comparison Infographic */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-800">
                {lang === 'tl'
                  ? 'Tradisyonal na Feedback laban sa Pinabilis na Proseso ng KwentoHabi'
                  : 'Traditional Feedback Bottleneck vs. KwentoHabi Automated Process'}
              </h4>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-50">
                <img
                  src="/assets/aistudio/Paghahambing_ng_Feedback_sa_Pagsusulat_74cd43f3.png"
                  alt="Tradisyonal na Feedback laban sa Pinabilis na Proseso ng KwentoHabi"
                  className="w-full h-auto object-contain max-h-[600px]"
                />
              </div>
            </div>

            {/* Mind Map */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">
                {lang === 'tl'
                  ? 'NotebookLM Mind Map: Pag-uugnay ng mga Bloke ng BMC'
                  : 'NotebookLM Mind Map: Interconnection of BMC Building Blocks'}
              </h4>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-50">
                <img
                  src="/assets/aistudio/NotebookLM_Mind_Map__1__9033682e.png"
                  alt="NotebookLM Mind Map"
                  className="w-full h-auto object-contain max-h-[600px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
