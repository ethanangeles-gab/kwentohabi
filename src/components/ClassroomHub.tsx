import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Clock, 
  Heart, 
  ShieldCheck, 
  Layers, 
  BarChart2, 
  GraduationCap, 
  Compass, 
  Flame 
} from 'lucide-react';
import { AUTHORS } from '../data/initialData';
import { Chapter, Contradiction, Resolution } from '../types';

interface StoryItem {
  id: string;
  title: string;
  genre: string;
  gradeLevel: string;
  description: string;
  chapters: Chapter[];
}

interface ClassroomHubProps {
  stories: StoryItem[];
  selectedStoryId: string;
  onSelectStory: (id: string) => void;
  onOpenCanvas: (storyId: string) => void;
  onOpenTeacherView: () => void;
  onNewStory: () => void;
  contradictions: Contradiction[];
  resolutions: Record<string, Resolution>;
  lang: 'tl' | 'en';
}

export const ClassroomHub: React.FC<ClassroomHubProps> = ({
  stories,
  selectedStoryId,
  onSelectStory,
  onOpenCanvas,
  onOpenTeacherView,
  onNewStory,
  contradictions,
  resolutions,
  lang,
}) => {
  const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

  // Aggregate stats across all stories
  const totalStories = stories.length;
  const totalChapters = stories.reduce((sum, s) => sum + s.chapters.length, 0);
  const totalWords = stories.reduce(
    (sum, s) => sum + s.chapters.reduce((cSum, c) => cSum + wordCount(c.text), 0),
    0
  );

  // Unique authors across all stories
  const authorSet = new Set<string>();
  stories.forEach(s => s.chapters.forEach(c => authorSet.add(c.authorId)));
  const totalAuthors = authorSet.size;

  const openCollisions = contradictions.filter(
    c => !resolutions[c.key] || resolutions[c.key].type === 'teacher'
  ).length;
  const resolvedCollisions = contradictions.length - openCollisions;

  return (
    <div className="space-y-8">
      {/* HERO / CLASSROOM WELCOME BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Background Weave Motif */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none bg-habi-pattern" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 flex items-center space-x-1.5 shadow-xs">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>University of Santo Tomas · CICS 4-ISB</span>
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Grade 9 - Seksyon Mabini & Rizal Pilot Cohort
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight text-white leading-tight">
            {lang === 'tl'
              ? 'Maligayang Pagdating sa KwentoHabi'
              : 'Welcome to KwentoHabi Classroom Hub'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {lang === 'tl'
              ? 'Ang AI-powered platform na sumusuri ng real-time narrative consistency, nagtuturo ng magalang na paglutas ng salungatan, at nagbibigay ng indibidwal na feedback sa bawat mag-aaral kahit sa malalaking klase.'
              : 'Empowering teachers to deliver individualized structural feedback on collaborative creative writing while minors practice respectful disagreement in a safe, teacher-controlled space.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onOpenCanvas(selectedStoryId)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{lang === 'tl' ? 'Pumasok sa Aktibong Kuwento' : 'Open Active Story Canvas'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onNewStory}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition-all border border-white/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'tl' ? 'Lumikha ng Bagong Kuwento' : 'New Story World'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* NATIONAL CONTEXT & VALUE PROPOSITION CALLOUT (From BMC & Slide 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Pambansang Konteksto' : 'National Challenge'}</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">91%</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {lang === 'tl'
              ? 'ng mga 10-taong gulang na Pilipino ay hindi nakauunawa ng tamang teksto (World Bank / UNESCO); PISA 2022 reading rank 77 of 81.'
              : 'of Filipino 10-year-olds struggle to comprehend age-appropriate text (World Bank/UNESCO); PH ranked 77th of 81 in PISA reading.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Hamon sa Silid-Aralan' : 'Classroom Bottleneck'}</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">30+ : 1</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {lang === 'tl'
              ? 'Imposibleng magbigay ang iisang guro ng detalyadong feedback sa mahabang sulatin ng bawat bata o matukoy ang ambag sa group work.'
              : 'No single teacher can give individualized structural feedback to 30+ students or easily track who contributed what in group assignments.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Ang Solusyon ng KwentoHabi' : 'KwentoHabi Moat'}</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">Cross-Author</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {lang === 'tl'
              ? 'Semantic reconciliation engine: sinusubaybayan ang facts kada may-akda at ginagabayan ang magalang na paglutas ng salungatan.'
              : 'Persistent multi-author semantic fact checking that turns continuity errors into collaborative peacemaking exercises.'}
          </p>
        </div>
      </div>

      {/* LIVE STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {lang === 'tl' ? 'Kuwentong Binubuo' : 'Active Story Worlds'}
          </span>
          <div className="text-2xl font-black font-mono text-slate-900">{totalStories}</div>
          <span className="text-[10px] text-indigo-600 font-medium">In Progress</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {lang === 'tl' ? 'Kabuuang Kabanata' : 'Total Chapters'}
          </span>
          <div className="text-2xl font-black font-mono text-slate-900">{totalChapters}</div>
          <span className="text-[10px] text-slate-500 font-medium">{lang === 'tl' ? 'Naihabi' : 'Woven'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {lang === 'tl' ? 'Kabuuang Salita' : 'Total Words'}
          </span>
          <div className="text-2xl font-black font-mono text-slate-900">{totalWords.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 font-medium">{lang === 'tl' ? 'Naitalang Salita' : 'Recorded'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {lang === 'tl' ? 'Aktibong Manunulat' : 'Student Authors'}
          </span>
          <div className="text-2xl font-black font-mono text-indigo-600">{totalAuthors}</div>
          <span className="text-[10px] text-slate-500 font-medium">{lang === 'tl' ? 'May Ambag' : 'Contributing'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {lang === 'tl' ? 'Bukas na Salungat' : 'Open Conflicts'}
          </span>
          <div className="text-2xl font-black font-mono text-amber-500">{openCollisions}</div>
          <span className="text-[10px] text-amber-700 font-medium">{lang === 'tl' ? 'Naka-pause' : 'Paused Threads'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {lang === 'tl' ? 'Nalutas na Salungat' : 'Resolved Conflicts'}
          </span>
          <div className="text-2xl font-black font-mono text-emerald-600">{resolvedCollisions}</div>
          <span className="text-[10px] text-emerald-700 font-medium">{lang === 'tl' ? 'Kasunduan' : 'Harmonized'}</span>
        </div>
      </div>

      {/* SECTION: STORIES CURRENTLY BEING WORKED ON */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-700" />
              <span>{lang === 'tl' ? 'Mga Kuwentong Kasalukuyang Isinusulat' : 'Stories Currently Being Worked On'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'tl'
                ? 'Pumili ng mundo ng kuwento upang makibahagi sa pagsusulat o suriin ang continuity ng grupo.'
                : 'Select an active collaborative world to write, resolve collisions, or inspect group narrative metrics.'}
            </p>
          </div>

          <button
            onClick={onNewStory}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'tl' ? 'Lumikha ng Bagong Kuwento' : 'Create New Story'}</span>
          </button>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map(story => {
            const isSelected = story.id === selectedStoryId;
            const storyWords = story.chapters.reduce((sum, c) => sum + wordCount(c.text), 0);
            
            // Authors collaborating in this story
            const storyAuthors = Array.from(new Set(story.chapters.map(c => c.authorId)))
              .map(id => AUTHORS[id])
              .filter(Boolean);

            const lastChapter = story.chapters[story.chapters.length - 1];

            return (
              <div
                key={story.id}
                className={`bg-white rounded-2xl border p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                  isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200'
                }`}
              >
                {/* Top status & tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {story.genre}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {story.gradeLevel}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {story.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {story.description}
                  </p>
                </div>

                {/* Excerpt from latest chapter */}
                {lastChapter && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span className="font-semibold uppercase tracking-wider">
                        {lang === 'tl' ? 'Pinakahuling Bahagi' : 'Latest Passage'} ({lastChapter.title})
                      </span>
                      <span>{new Date(lastChapter.at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-serif italic text-slate-700 line-clamp-2">
                      "{lastChapter.text}"
                    </p>
                  </div>
                )}

                {/* Contributing Authors */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {lang === 'tl' ? 'Mga Nag-aambag na Mag-aaral:' : 'Collaborating Authors:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {storyAuthors.map(a => (
                      <span
                        key={a.id}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: a.avatarColor }}
                        />
                        <span>{a.firstName}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Story Footer & Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
                    <span>{story.chapters.length} {lang === 'tl' ? 'kabanata' : 'chs'}</span>
                    <span>·</span>
                    <span>{storyWords} {lang === 'tl' ? 'salita' : 'words'}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        onSelectStory(story.id);
                        onOpenCanvas(story.id);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <span>{lang === 'tl' ? 'Buksan ang Kuwento' : 'Open Canvas'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create New Story Card Prompt */}
          <div
            onClick={onNewStory}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3 min-h-[260px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">
                {lang === 'tl' ? 'Mag-set up ng Bagong Grupo o Kuwento' : 'Start a New Story World'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {lang === 'tl'
                  ? 'Lumikha ng bagong collaborative canvas para sa isa pang writing group o seksyon sa klase.'
                  : 'Spin up a fresh narrative space with custom rubrics and co-author assignment.'}
              </p>
            </div>
            <span className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
              + {lang === 'tl' ? 'Lumikha Ngayon' : 'Create Now'}
            </span>
          </div>
        </div>
      </section>

      {/* QUICK WORKFLOW GUIDE (Four Steps of KwentoHabi) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-lg font-bold font-serif text-slate-900">
          {lang === 'tl' ? 'Paano Gumagana ang KwentoHabi sa Silid-Aralan' : 'How KwentoHabi Works in Your Classroom'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-blue-700 text-xs uppercase tracking-wider block">1. Shared World</span>
            <p className="font-semibold text-slate-900">Kolaboratibong Pagsulat</p>
            <p className="text-slate-600">Nagsusulat ang 3-6 mag-aaral ng magkakasunod na kabanata sa iisang mundo ng kuwento.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-amber-700 text-xs uppercase tracking-wider block">2. Fact Extraction</span>
            <p className="font-semibold text-slate-900">Living Story Wiki</p>
            <p className="text-slate-600">Awtomatikong itinatala ng AI ang mga naitatag na katotohanan (tauhan, kulay, lugar, relasyon) kada may-akda.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-rose-700 text-xs uppercase tracking-wider block">3. Collision Alert</span>
            <p className="font-semibold text-slate-900">Socratic Pausing</p>
            <p className="text-slate-600">Kung sinalungat ni Student B si Student A, hihinto ang partikular na thread nang hindi nag-a-auto-rewrite.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-700 text-xs uppercase tracking-wider block">4. Respect & Peace</span>
            <p className="font-semibold text-slate-900">Perspective Notes</p>
            <p className="text-slate-600">Kinikilala ng mga bata ang pananaw ng isa't isa bago pumili: Pagsamahin, Sinadya, o Itanong sa Guro (SDG 16).</p>
          </div>
        </div>
      </section>
    </div>
  );
};
