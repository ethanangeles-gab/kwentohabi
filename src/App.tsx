import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudentCanvas } from './components/StudentCanvas';
import { StoryWiki } from './components/StoryWiki';
import { TeacherDashboard } from './components/TeacherDashboard';
import { MaterialsArchive } from './components/MaterialsArchive';
import { BmcAndDefense } from './components/BmcAndDefense';
import { 
  INITIAL_STORIES, 
  INITIAL_CONTRADICTIONS, 
  INITIAL_FLAGS, 
  INITIAL_RUBRICS,
  AUTHORS 
} from './data/initialData';
import { ClassroomHub } from './components/ClassroomHub';
import { Chapter, Contradiction, Resolution, SafetyFlag, StoryFact, ResolutionLogEntry, RubricStandard } from './types';

export default function App() {
  const [stories, setStories] = useState(INITIAL_STORIES);
  const [selectedStoryId, setSelectedStoryId] = useState(INITIAL_STORIES[0].id);
  const [currentTab, setCurrentTab] = useState<'hub' | 'canvas' | 'wiki' | 'teacher' | 'archive' | 'bmc'>('hub');
  const [lang, setLang] = useState<'tl' | 'en'>('tl');
  
  // Active story and chapters
  const currentStory = stories.find(s => s.id === selectedStoryId) || stories[0];
  const chapters = currentStory.chapters;

  // Contradictions and resolutions
  const [contradictions, setContradictions] = useState<Contradiction[]>(INITIAL_CONTRADICTIONS);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [safetyFlags, setSafetyFlags] = useState<SafetyFlag[]>(INITIAL_FLAGS);
  const [contentLevel, setContentLevel] = useState<'strict' | 'moderate' | 'literature'>('strict');
  
  // Story Wiki facts
  const [facts, setFacts] = useState<StoryFact[]>([
    { id: 'f1', subject: 'Lia', attribute: 'eye color', value: 'brown', authorId: 'maria', chapterId: 'c1', quote: "Lia's eyes were brown.", status: 'contested' },
    { id: 'f2', subject: 'Lia', attribute: 'eye color', value: 'green', authorId: 'jose', chapterId: 'c2', quote: "Lia's green eyes caught the light", status: 'contested' },
    { id: 'f3', subject: 'Lia', attribute: 'hometown', value: 'Batangas', authorId: 'maria', chapterId: 'c1', quote: "Lia lived in a small fishing village in Batangas.", status: 'contested' },
    { id: 'f4', subject: 'Lia', attribute: 'hometown', value: 'Quezon', authorId: 'jose', chapterId: 'c2', quote: "Lia lived in Quezon, where the road to the sea was long and dusty.", status: 'contested' },
    { id: 'f5', subject: 'Lia', attribute: 'siblings', value: 'two brothers', authorId: 'maria', chapterId: 'c1', quote: "Lia had two brothers who laughed at everything she said.", status: 'contested' },
    { id: 'f6', subject: 'Lia', attribute: 'siblings', value: 'only child', authorId: 'jose', chapterId: 'c2', quote: "Lia was an only child", status: 'contested' },
    { id: 'f7', subject: 'Father', attribute: 'possession', value: 'woven net', authorId: 'maria', chapterId: 'c1', quote: "she carried her father's net down to the shore", status: 'canon' },
    { id: 'f8', subject: 'Father', attribute: 'possession', value: 'woven hat', authorId: 'ana', chapterId: 'c3', quote: "She clutched her father's woven hat tightly", status: 'canon' },
  ]);
  const [storySummary, setStorySummary] = useState(
    'Si Lia ay isang batang lumalaki sa pamayanang mangingisda. Hinaharap ng kanyang komunidad ang mga hamon ng dagat, bagyo, at ugnayan ng pamilya.'
  );

  // Materials & Rubrics
  const [rubrics, setRubrics] = useState<RubricStandard[]>(INITIAL_RUBRICS);
  const [selectedRubricId, setSelectedRubricId] = useState(INITIAL_RUBRICS[0].id);

  // Resolution logs
  const [resolutionLogs, setResolutionLogs] = useState<ResolutionLogEntry[]>([
    {
      id: 'log-0',
      at: '2026-11-05T17:00:00+08:00',
      type: 'Ingestion Init',
      text: 'DepEd Grade 9-10 Creative Writing Competency Rubric ingested into KwentoHabi continuity engine.'
    }
  ]);

  // AI status & check progress
  const [isChecking, setIsChecking] = useState(false);
  const [checkMethod, setCheckMethod] = useState<'gemini' | 'semantic'>('gemini');
  const [aiStatus, setAiStatus] = useState({ ready: true, hasKey: true });

  // Modal for new story
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryGenre, setNewStoryGenre] = useState('');

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAiStatus({ ready: true, hasKey: Boolean(data.hasGeminiApiKey) });
        if (!data.hasGeminiApiKey) setCheckMethod('semantic');
      })
      .catch(() => {
        setAiStatus({ ready: true, hasKey: false });
        setCheckMethod('semantic');
      });
  }, []);

  // Update existing chapter
  const handleUpdateChapter = (chapterId: string, newText: string) => {
    setStories(prev => prev.map(s => {
      if (s.id !== selectedStoryId) return s;
      return {
        ...s,
        chapters: s.chapters.map(c => c.id === chapterId ? { ...c, text: newText } : c)
      };
    }));
  };

  // Add chapter to current story
  const handleAddChapter = (authorId: string, title: string, text: string) => {
    const newChap: Chapter = {
      id: `c_${Date.now()}`,
      authorId,
      title,
      text,
      at: new Date().toISOString()
    };

    setStories(prev => prev.map(s => {
      if (s.id !== selectedStoryId) return s;
      return {
        ...s,
        chapters: [...s.chapters, newChap]
      };
    }));

    // Add log
    const author = AUTHORS[authorId]?.name || authorId;
    setResolutionLogs(prev => [
      {
        id: `log-${Date.now()}`,
        at: new Date().toISOString(),
        type: 'New Chapter Added',
        text: `${author} added "${title}". Checking for narrative continuity...`
      },
      ...prev
    ]);
  };

  // Run Continuity Check via server endpoint
  const handleRunCheck = async () => {
    setIsChecking(true);
    try {
      const activeRubric = rubrics.find(r => r.id === selectedRubricId);
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapters,
          contentLevel,
          rubric: activeRubric?.title || 'DepEd Creative Writing Standards'
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        const result = data.data;

        if (Array.isArray(result.contradictions)) {
          setContradictions(result.contradictions);
        }
        if (Array.isArray(result.flags)) {
          setSafetyFlags(result.flags.map((f: any) => ({
            ...f,
            key: `${f.chapter}|${f.quote}`
          })));
        }
        if (Array.isArray(result.facts) && result.facts.length > 0) {
          setFacts(result.facts.map((f: any, idx: number) => ({
            id: `fact-${Date.now()}-${idx}`,
            subject: f.subject,
            attribute: f.attribute,
            value: f.value,
            authorId: f.author,
            chapterId: f.chapter,
            quote: f.quote,
            status: 'contested'
          })));
        }
        if (result.storyWikiSummary) {
          setStorySummary(result.storyWikiSummary);
        }

        setCheckMethod(data.via === 'gemini' ? 'gemini' : 'semantic');

        setResolutionLogs(prev => [
          {
            id: `log-${Date.now()}`,
            at: new Date().toISOString(),
            type: 'Continuity Checked',
            text: `Scanned ${chapters.length} chapters. Found ${result.contradictions?.length || 0} contradictions across authors.`
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Error during continuity check:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle student resolution
  const handleResolve = (key: string, res: Resolution) => {
    setResolutions(prev => ({ ...prev, [key]: res }));

    setResolutionLogs(prev => [
      {
        id: `log-${Date.now()}`,
        at: new Date().toISOString(),
        type: res.type === 'merged' ? 'Contradiction Merged' : res.type === 'both' ? 'Creative Intentionality' : 'Escalated to Teacher',
        text: res.summary
      },
      ...prev
    ]);
  };

  // Handle teacher arbitration decision
  const handleTeacherDecide = (key: string, choice: 'a' | 'b' | 'both') => {
    const c = contradictions.find(item => item.key === key);
    if (!c) return;

    const authorA = AUTHORS[c.a.author]?.firstName || c.a.author;
    const authorB = AUTHORS[c.b.author]?.firstName || c.b.author;

    let summary = '';
    let resolvedValue = '';

    if (choice === 'both') {
      summary = `Teacher decided: Keep both "${c.a.value}" and "${c.b.value}" as an intentional storytelling perspective shift.`;
    } else {
      const chosen = choice === 'a' ? c.a : c.b;
      const who = choice === 'a' ? authorA : authorB;
      resolvedValue = chosen.value;
      summary = `Teacher arbitrated: Adopted "${chosen.value}" (${who}'s version) as the canonical truth for ${c.subject}'s ${c.attribute}.`;
    }

    setResolutions(prev => ({
      ...prev,
      [key]: {
        key,
        type: 'teacher-decided',
        summary,
        at: new Date().toISOString(),
        resolvedValue
      }
    }));

    setResolutionLogs(prev => [
      {
        id: `log-${Date.now()}`,
        at: new Date().toISOString(),
        type: 'Teacher Arbitration',
        text: summary
      },
      ...prev
    ]);
  };

  // Handle teacher safety flag decision
  const handleDecideFlag = (key: string, decision: 'allow' | 'rework') => {
    setSafetyFlags(prev => prev.map(f => f.key === key ? { ...f, decision } : f));
    setResolutionLogs(prev => [
      {
        id: `log-${Date.now()}`,
        at: new Date().toISOString(),
        type: 'Safety Moderation',
        text: `Teacher marked flagged passage as: ${decision === 'allow' ? 'Allowed as literature study' : 'Requested student rework'}.`
      },
      ...prev
    ]);
  };

  // Handle new story world creation
  const handleCreateNewStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim()) return;

    const newStory = {
      id: `story-${Date.now()}`,
      title: newStoryTitle.trim(),
      genre: newStoryGenre.trim() || 'Mitolohiya at Pantasya',
      gradeLevel: 'Grade 9 - Seksyon Luna',
      description: 'Bagong mundong kuwento na binuo ng grupo ng mga mag-aaral.',
      chapters: [
        {
          id: `c_init_${Date.now()}`,
          authorId: 'maria',
          title: 'Kabanata 1: Ang Simula ng Paglalakbay',
          at: new Date().toISOString(),
          text: 'Sa lumang baryo ng San Isidro, natagpuan ng mga bata ang isang gintong susi sa ilalim ng ugat ng balete. Labing-dalawang taong gulang si Marco nang marinig niya ang bulong ng hangin.'
        }
      ]
    };

    setStories(prev => [...prev, newStory]);
    setSelectedStoryId(newStory.id);
    setShowNewStoryModal(false);
    setNewStoryTitle('');
    setNewStoryGenre('');
    setContradictions([]);
    setResolutions({});
  };

  const openCollisionsCount = contradictions.filter(
    c => !resolutions[c.key] || resolutions[c.key].type === 'teacher'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 bg-habi-pattern pb-16">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as any)}
        lang={lang}
        onToggleLang={() => setLang(l => l === 'tl' ? 'en' : 'tl')}
        stories={stories}
        selectedStoryId={selectedStoryId}
        onSelectStory={(id) => {
          setSelectedStoryId(id);
          // if switching to Makiling, set its corresponding contradictions
          if (id === 'story-makiling') {
            setContradictions([
              {
                key: 'samuel|age',
                subject: 'Samuel',
                attribute: 'age',
                a: { chapter: 'm1', value: '15 taong gulang', quote: 'Labing-limang taong gulang si Samuel', author: 'ethan' },
                b: { chapter: 'm2', value: '16 na taong gulang', quote: 'Labing-anim na taong gulang si Samuel', author: 'sophia' },
                explanation: 'Ethan stated Samuel is 15 years old, while Sophia wrote he is 16 years old in Chapter 2.'
              },
              {
                key: 'samuel|necklace',
                subject: 'Samuel',
                attribute: 'necklace material',
                a: { chapter: 'm1', value: 'tanso (bronze)', quote: 'lumang tanso na kwintas', author: 'ethan' },
                b: { chapter: 'm2', value: 'pilak (silver)', quote: 'kanyang pilak na kwintas', author: 'sophia' },
                explanation: 'Ethan described the necklace as bronze, but Sophia wrote silver.'
              }
            ]);
            setResolutions({});
          } else if (id === 'story-lia') {
            setContradictions(INITIAL_CONTRADICTIONS);
          }
        }}
        onNewStory={() => setShowNewStoryModal(true)}
        aiStatus={aiStatus}
        openCollisionsCount={openCollisionsCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {currentTab === 'hub' && (
          <ClassroomHub
            stories={stories}
            selectedStoryId={selectedStoryId}
            onSelectStory={(id) => {
              setSelectedStoryId(id);
              if (id === 'story-makiling') {
                setContradictions([
                  {
                    key: 'samuel|age',
                    subject: 'Samuel',
                    attribute: 'age',
                    a: { chapter: 'm1', value: '15 taong gulang', quote: 'Labing-limang taong gulang si Samuel', author: 'ethan' },
                    b: { chapter: 'm2', value: '16 na taong gulang', quote: 'Labing-anim na taong gulang si Samuel', author: 'sophia' },
                    explanation: 'Ethan stated Samuel is 15 years old, while Sophia wrote he is 16 years old in Chapter 2.'
                  },
                  {
                    key: 'samuel|necklace',
                    subject: 'Samuel',
                    attribute: 'necklace material',
                    a: { chapter: 'm1', value: 'tanso (bronze)', quote: 'lumang tanso na kwintas', author: 'ethan' },
                    b: { chapter: 'm2', value: 'pilak (silver)', quote: 'kanyang pilak na kwintas', author: 'sophia' },
                    explanation: 'Ethan described the necklace as bronze, but Sophia wrote silver.'
                  }
                ]);
                setResolutions({});
              } else if (id === 'story-lia') {
                setContradictions(INITIAL_CONTRADICTIONS);
              }
            }}
            onOpenCanvas={(storyId) => {
              setSelectedStoryId(storyId);
              if (storyId === 'story-makiling') {
                setContradictions([
                  {
                    key: 'samuel|age',
                    subject: 'Samuel',
                    attribute: 'age',
                    a: { chapter: 'm1', value: '15 taong gulang', quote: 'Labing-limang taong gulang si Samuel', author: 'ethan' },
                    b: { chapter: 'm2', value: '16 na taong gulang', quote: 'Labing-anim na taong gulang si Samuel', author: 'sophia' },
                    explanation: 'Ethan stated Samuel is 15 years old, while Sophia wrote he is 16 years old in Chapter 2.'
                  },
                  {
                    key: 'samuel|necklace',
                    subject: 'Samuel',
                    attribute: 'necklace material',
                    a: { chapter: 'm1', value: 'tanso (bronze)', quote: 'lumang tanso na kwintas', author: 'ethan' },
                    b: { chapter: 'm2', value: 'pilak (silver)', quote: 'kanyang pilak na kwintas', author: 'sophia' },
                    explanation: 'Ethan described the necklace as bronze, but Sophia wrote silver.'
                  }
                ]);
                setResolutions({});
              } else if (storyId === 'story-lia') {
                setContradictions(INITIAL_CONTRADICTIONS);
              }
              setCurrentTab('canvas');
            }}
            onOpenTeacherView={() => setCurrentTab('teacher')}
            onNewStory={() => setShowNewStoryModal(true)}
            contradictions={contradictions}
            resolutions={resolutions}
            lang={lang}
          />
        )}

        {currentTab === 'canvas' && (
          <StudentCanvas
            chapters={chapters}
            onUpdateChapter={handleUpdateChapter}
            onAddChapter={handleAddChapter}
            contradictions={contradictions}
            resolutions={resolutions}
            onResolve={handleResolve}
            safetyFlags={safetyFlags}
            onRunCheck={handleRunCheck}
            isChecking={isChecking}
            checkMethod={checkMethod}
            lang={lang}
          />
        )}

        {currentTab === 'wiki' && (
          <StoryWiki
            facts={facts}
            contradictions={contradictions}
            resolutions={resolutions}
            storySummary={storySummary}
            lang={lang}
          />
        )}

        {currentTab === 'teacher' && (
          <TeacherDashboard
            chapters={chapters}
            contradictions={contradictions}
            resolutions={resolutions}
            onTeacherDecide={handleTeacherDecide}
            safetyFlags={safetyFlags}
            onDecideFlag={handleDecideFlag}
            contentLevel={contentLevel}
            onChangeContentLevel={setContentLevel}
            resolutionLogs={resolutionLogs}
            lang={lang}
          />
        )}

        {currentTab === 'archive' && (
          <MaterialsArchive
            rubrics={rubrics}
            onAddRubric={(r) => setRubrics(prev => [...prev, r])}
            selectedRubricId={selectedRubricId}
            onSelectRubric={setSelectedRubricId}
            chapters={chapters}
            lang={lang}
          />
        )}

        {currentTab === 'bmc' && (
          <BmcAndDefense lang={lang} />
        )}
      </main>

      {/* Modal for Creating New Shared Story World */}
      {showNewStoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold font-serif text-lg text-slate-900">
              {lang === 'tl' ? 'Lumikha ng Bagong Mundo ng Kuwento' : 'Create New Collaborative Story World'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'tl'
                ? 'Mag-set up ng panibagong collaborative canvas kung saan maghahabi ng salaysay ang inyong grupo.'
                : 'Sets up a fresh shared narrative world for your student group.'}
            </p>

            <form onSubmit={handleCreateNewStory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'tl' ? 'Pamagat ng Kuwento' : 'Story Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Hal. Ang Misteryo sa Lumang Bahay-na-Bato"
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'tl' ? 'Genre / Tema' : 'Genre / Theme'}
                </label>
                <input
                  type="text"
                  placeholder="Hal. Kasaysayan, Hiwaga, Baybaying Pamayanan"
                  value={newStoryGenre}
                  onChange={(e) => setNewStoryGenre(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewStoryModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  {lang === 'tl' ? 'Kanselahin' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  {lang === 'tl' ? 'Lumikha ng Kuwento' : 'Create Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
