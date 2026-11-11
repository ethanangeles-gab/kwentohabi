import React, { useState } from 'react';
import { Award, Plus, Upload, Check, BookOpen, FileText, Sparkles, Scale, Info, CheckCircle2 } from 'lucide-react';
import { INITIAL_RUBRICS } from '../data/initialData';
import { RubricStandard, Chapter } from '../types';

interface MaterialsArchiveProps {
  rubrics: RubricStandard[];
  onAddRubric: (rubric: RubricStandard) => void;
  selectedRubricId: string;
  onSelectRubric: (id: string) => void;
  chapters: Chapter[];
  lang: 'tl' | 'en';
}

export const MaterialsArchive: React.FC<MaterialsArchiveProps> = ({
  rubrics,
  onAddRubric,
  selectedRubricId,
  onSelectRubric,
  chapters,
  lang,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Junior High School');
  const [newAuthor, setNewAuthor] = useState('Guro / Curriculum Lead');
  const [criteriaList, setCriteriaList] = useState([
    { name: 'Kaisahan ng Banghay (Plot Consistency)', description: 'No contradictions across student chapters', weight: 35 },
    { name: 'Pagsunod sa Tagpuan at Tauhan', description: 'Respects peers’ established facts and settings', weight: 35 },
    { name: 'Estilo at Gramatika', description: 'Vivid imagery and expressive storytelling', weight: 30 },
  ]);

  const [testEvaluation, setTestEvaluation] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const activeRubric = rubrics.find(r => r.id === selectedRubricId) || rubrics[0];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRubric: RubricStandard = {
      id: `rubric-${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      category: newCategory,
      criteria: criteriaList,
    };

    onAddRubric(newRubric);
    onSelectRubric(newRubric.id);
    setShowAddModal(false);
    setNewTitle('');
  };

  const runBenchmarkReport = () => {
    setEvaluating(true);
    setTimeout(() => {
      setTestEvaluation({
        overallScore: 89,
        maxScore: 100,
        criteriaScores: [
          { name: activeRubric.criteria[0]?.name || 'Plot Consistency', score: 26, max: 30, feedback: 'Napanatili ang pangunahing banghay ngunit may 3 salungatan na nalutas gamit ang perspective notes.' },
          { name: activeRubric.criteria[1]?.name || 'Characterization', score: 23, max: 25, feedback: 'Matatag ang pagkakabuo kay Lia; kitang-kita ang emosyonal na lalim sa bawat kabanata.' },
          { name: activeRubric.criteria[2]?.name || 'Setting & Atmosphere', score: 18, max: 20, feedback: 'Matingkad ang larawan ng baybayin ng Batangas at mga bangka.' },
          { name: activeRubric.criteria[3]?.name || 'Cross-Author Respect', score: 22, max: 25, feedback: 'Maagap na nagkasundo ang mga mag-aaral sa pamamagitan ng paghabi ng magkaibang pananaw.' }
        ],
        teacherRecommendation: 'Ipagpatuloy ang pagtuturo ng pananaw ng tagapagsalaysay (Point of View). Magaling ang pagkakaugnay ng kabanata 1 hanggang 3.'
      });
      setEvaluating(false);
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* HEADER EXPLANATION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
              Phase 1: Ingestion
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-900">
              {lang === 'tl' ? 'Materyales at Rubrics Archive' : 'Materials & Rubrics Archive'}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {lang === 'tl'
              ? 'Paano ito naiiba sa DepEd Learning Resource Portal? Ang LR Portal ay nag-iimbak lamang ng babasahin. Ang KwentoHabi ay ginagawang aktibong pamantayan (active reference standards) ang mga ito na ginagamit ng AI sa pag-evaluate at pagmamarka.'
              : 'DepEd LR Portal stores static files; KwentoHabi parses uploaded rubrics and exemplars into active semantic vectors to benchmark student drafts.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'tl' ? 'Mag-upload ng Bagong Rubric' : 'Upload New Rubric'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Rubric List & Selected Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              {lang === 'tl' ? 'Mga Pamantayang Naka-ingest sa AI' : 'Active Benchmark Rubrics'}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {rubrics.map(r => (
                <div
                  key={r.id}
                  onClick={() => onSelectRubric(r.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedRubricId === r.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900">{r.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{lang === 'tl' ? 'Nag-upload:' : 'Source:'} {r.author}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.criteria.map((c, idx) => (
                      <span key={idx} className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                        {c.name} ({c.weight}%)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Rubric Criteria Inspector */}
          {activeRubric && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                    {lang === 'tl' ? 'Aktibong Pamantayan ng AI' : 'Active Rubric Spec'}
                  </span>
                  <h4 className="text-lg font-bold font-serif text-slate-900">{activeRubric.title}</h4>
                </div>
                <span className="text-xs text-slate-400">Total Weight: 100%</span>
              </div>

              <div className="space-y-3">
                {activeRubric.criteria.map((c, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{c.name}</span>
                      <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{c.weight}%</span>
                    </div>
                    <p className="text-slate-600">{c.description}</p>
                  </div>
                ))}
              </div>

              {activeRubric.exemplarText && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    {lang === 'tl' ? 'Modelong Teksto (Model Narrative Exemplar):' : 'Model Narrative Exemplar:'}
                  </span>
                  <p className="font-serif text-xs italic text-slate-700 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                    "{activeRubric.exemplarText}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Evaluation Simulator based on Rubric (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{lang === 'tl' ? 'Suriin ang Kuwento Gamit ang Rubric' : 'AI Rubric Evaluator'}</span>
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'tl'
                ? 'Susuriin ng AI ang kasalukuyang kuwento ng klase laban sa napiling rubric at bubuo ng grading report na magagamit ng guro sa pagmamarka.'
                : 'Runs AI benchmark against the active rubric criteria, providing formative scoring and pedagogical notes.'}
            </p>

            <button
              onClick={runBenchmarkReport}
              disabled={evaluating}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Scale className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
              <span>
                {evaluating
                  ? (lang === 'tl' ? 'Binibilang ang marka...' : 'Evaluating against rubric...')
                  : (lang === 'tl' ? 'Simulan ang Rubric Evaluation' : 'Generate Rubric Evaluation')}
              </span>
            </button>

            {testEvaluation && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-900">
                    {lang === 'tl' ? 'Pangkalahatang Marka (Class Score):' : 'Overall Benchmark Score:'}
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    {testEvaluation.overallScore} / {testEvaluation.maxScore}
                  </div>
                </div>

                <div className="space-y-2">
                  {testEvaluation.criteriaScores.map((cs: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{cs.name}</span>
                        <span className="text-indigo-700 font-mono">{cs.score} / {cs.max}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{cs.feedback}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">{lang === 'tl' ? 'Rekomendasyon sa Guro:' : 'Teacher Recommendation:'}</span>{' '}
                  {testEvaluation.teacherRecommendation}
                </div>
              </div>
            )}
          </div>

          {/* Legal and Upload Rights Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
            <div className="flex items-center space-x-1.5 font-bold text-slate-700">
              <Info className="w-4 h-4 text-slate-500" />
              <span>{lang === 'tl' ? 'Pangangalaga sa Karapatang-Sipi (IP Rights)' : 'Copyright & Attestation'}</span>
            </div>
            <p className="leading-relaxed">
              {lang === 'tl'
                ? 'Ang bawat materyal na ina-upload ay may attestation na ito ay sariling gawa ng guro, may permiso, o nasa public domain. Nananatiling school-scoped ang mga materyales upang maprotektahan ang privacy.'
                : 'Uploads default to private & school-scoped under RA 10173 and IP Code of the Philippines. Fast takedown policy protects institutional compliance.'}
            </p>
          </div>
        </div>
      </div>

      {/* ADD RUBRIC MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold font-serif text-lg text-slate-900">
              {lang === 'tl' ? 'Mag-upload ng Bagong Rubric / Pamantayan' : 'Add New Rubric Standard'}
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'tl' ? 'Pamagat ng Rubric' : 'Rubric Title'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Hal. Baitang 9 Pagsulat ng Maikling Kwento"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'tl' ? 'Kategorya / Antas' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Junior High School">Junior High School</option>
                    <option value="Senior High School">Senior High School</option>
                    <option value="College Creative Writing">College Creative Writing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'tl' ? 'Guro / Tagalikha' : 'Author'}
                  </label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <span className="block font-semibold text-slate-700 mb-1">
                  {lang === 'tl' ? 'Pamantayan (Criteria & Weights)' : 'Criteria & Weights'}
                </span>
                <div className="space-y-2">
                  {criteriaList.map((c, i) => (
                    <div key={i} className="flex space-x-2">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const updated = [...criteriaList];
                          updated[i].name = e.target.value;
                          setCriteriaList(updated);
                        }}
                        className="flex-1 p-1.5 border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="number"
                        value={c.weight}
                        onChange={(e) => {
                          const updated = [...criteriaList];
                          updated[i].weight = Number(e.target.value);
                          setCriteriaList(updated);
                        }}
                        className="w-16 p-1.5 border border-slate-300 rounded text-xs text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  {lang === 'tl' ? 'Kanselahin' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  {lang === 'tl' ? 'I-save at I-ingest sa AI' : 'Save & Ingest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
