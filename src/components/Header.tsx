import React from 'react';
import { Sparkles, BookOpen, GitMerge, ShieldCheck, FileSpreadsheet, Award, Globe, Plus, Cpu, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  lang: 'tl' | 'en';
  onToggleLang: () => void;
  stories: Array<{ id: string; title: string; genre: string }>;
  selectedStoryId: string;
  onSelectStory: (id: string) => void;
  onNewStory: () => void;
  aiStatus: {
    ready: boolean;
    hasKey: boolean;
  };
  openCollisionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onToggleLang,
  stories,
  selectedStoryId,
  onSelectStory,
  onNewStory,
  aiStatus,
  openCollisionsCount
}) => {
  const currentStory = stories.find(s => s.id === selectedStoryId) || stories[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Filipino Habi Weaving Pattern Top Ribbon */}
      <div className="habi-thread-bar w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div 
            onClick={() => onSelectTab('hub')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-800 to-amber-700 flex items-center justify-center text-white shadow-md font-bold tracking-tight text-xl ring-2 ring-amber-400/40 group-hover:scale-105 transition-transform">
              KH
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-serif">
                  Kwento<span className="text-amber-600">Habi</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  UST 4-ISB · Group 5
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                {lang === 'tl'
                  ? 'AI Platform para sa Real-Time Narrative Feedback at Plot Consistency'
                  : 'AI Platform for Real-Time Narrative Feedback & Plot Consistency'}
              </p>
            </div>
          </div>

          {/* Story Selector */}
          <div className="flex items-center space-x-2">
            <div className="hidden lg:flex items-center bg-slate-100/90 rounded-lg p-1 border border-slate-200">
              <span className="text-xs font-medium text-slate-600 px-2">
                {lang === 'tl' ? 'Kuwento:' : 'Story:'}
              </span>
              <select
                aria-label={lang === 'tl' ? 'Pumili ng Kuwento' : 'Select Story'}
                value={selectedStoryId}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    onNewStory();
                  } else {
                    onSelectStory(e.target.value);
                  }
                }}
                className="text-xs font-semibold bg-white text-slate-800 rounded px-2.5 py-1 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              >
                {stories.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
                <option value="__new__">+ {lang === 'tl' ? 'Bagong Kuwento...' : 'New Story...'}</option>
              </select>
            </div>

            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              title={lang === 'tl' ? 'Palitan sa Ingles' : 'Switch to Tagalog'}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'tl' ? 'Filipino (PH)' : 'English'}</span>
            </button>

            {/* AI Status Badge */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                aiStatus.hasKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <Cpu className="w-3 h-3 text-emerald-600" />
              <span>{aiStatus.hasKey ? 'Gemini 3.8 Flash' : 'Semantic Engine'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar space-x-1 py-1 border-t border-slate-100">
          <button
            onClick={() => onSelectTab('hub')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'hub'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Hub ng Klase & Kuwento' : 'Classroom Hub & Stories'}</span>
          </button>

          <button
            onClick={() => onSelectTab('canvas')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'canvas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Pagsulat ng Mag-aaral' : 'Student Story Canvas'}</span>
            {openCollisionsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                currentTab === 'canvas' ? 'bg-amber-400 text-slate-950' : 'bg-amber-500 text-white'
              }`}>
                {openCollisionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('wiki')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'wiki'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Story Wiki & Collision Engine' : 'Story Wiki & Collision Engine'}</span>
          </button>

          <button
            onClick={() => onSelectTab('teacher')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'teacher'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Paningin ng Guro' : 'Teacher Dashboard'}</span>
          </button>

          <button
            onClick={() => onSelectTab('archive')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'archive'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Materyales at Rubrics' : 'Materials & Rubrics'}</span>
          </button>

          <button
            onClick={() => onSelectTab('bmc')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              currentTab === 'bmc'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{lang === 'tl' ? 'BMC at Title Defense (66 Q&A)' : 'BMC & Defense Center (66 Q&A)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
