import React, { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, HelpCircle, Edit3, Check, RefreshCw, Send, ArrowRight, User, ShieldAlert, MessageSquare } from 'lucide-react';
import { AUTHORS } from '../data/initialData';
import { Chapter, Contradiction, Resolution, SafetyFlag } from '../types';

interface StudentCanvasProps {
  chapters: Chapter[];
  onUpdateChapter: (id: string, text: string) => void;
  onAddChapter: (authorId: string, title: string, text: string) => void;
  contradictions: Contradiction[];
  resolutions: Record<string, Resolution>;
  onResolve: (key: string, res: Resolution) => void;
  safetyFlags: SafetyFlag[];
  onRunCheck: () => Promise<void>;
  isChecking: boolean;
  checkMethod: string;
  lang: 'tl' | 'en';
}

export const StudentCanvas: React.FC<StudentCanvasProps> = ({
  chapters,
  onUpdateChapter,
  onAddChapter,
  contradictions,
  resolutions,
  onResolve,
  safetyFlags,
  onRunCheck,
  isChecking,
  checkMethod,
  lang,
}) => {
  // Editing state
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Add chapter state
  const [newAuthor, setNewAuthor] = useState('maria');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Perspective notes state per contradiction key: { [key]: { authorA: text, authorB: text } }
  const [notes, setNotes] = useState<Record<string, Record<string, string>>>({});
  // Merging options open state: { [key]: boolean }
  const [mergingKeys, setMergingKeys] = useState<Record<string, boolean>>({});
  // Selected merge choice: { [key]: 'a' | 'b' }
  const [mergeChoices, setMergeChoices] = useState<Record<string, 'a' | 'b'>>({});

  const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

  const startEdit = (ch: Chapter) => {
    setEditingChapterId(ch.id);
    setEditText(ch.text);
  };

  const saveEdit = (id: string) => {
    onUpdateChapter(id, editText);
    setEditingChapterId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const defaultTitle = newTitle.trim() || `${lang === 'tl' ? 'Kabanata' : 'Chapter'} ${chapters.length + 1}`;
    onAddChapter(newAuthor, defaultTitle, newContent.trim());
    setNewTitle('');
    setNewContent('');
  };

  const getStatus = (key: string) => {
    const res = resolutions[key];
    if (!res) return 'open';
    return res.type;
  };

  const handleNoteChange = (key: string, authorId: string, val: string) => {
    setNotes(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [authorId]: val,
      },
    }));
  };

  const addStarter = (key: string, authorId: string, starter: string) => {
    const cur = notes[key]?.[authorId] || '';
    const updated = cur ? `${cur} ${starter}` : starter;
    handleNoteChange(key, authorId, updated);
  };

  const isReadyForResolution = (c: Contradiction) => {
    const keyNotes = notes[c.key] || {};
    const noteA = (keyNotes[c.a.author] || '').trim();
    const noteB = (keyNotes[c.b.author] || '').trim();
    return noteA.length >= 10 && noteB.length >= 10;
  };

  // Helper to render formatted story text with highlighted phrases
  const renderStoryText = (ch: Chapter) => {
    let html = ch.text;

    // Check contradictions referencing this chapter
    contradictions.forEach(c => {
      const isResolved = getStatus(c.key) !== 'open' && getStatus(c.key) !== 'teacher';
      const quote = c.a.chapter === ch.id ? c.a.quote : c.b.chapter === ch.id ? c.b.quote : null;
      if (quote && html.includes(quote)) {
        const cls = isResolved ? 'hl-resolved' : 'hl-contradiction';
        html = html.replace(quote, `<mark class="${cls}" title="${c.subject}: ${c.attribute}">${quote}</mark>`);
      }
    });

    // Check safety flags
    safetyFlags.forEach(f => {
      if (f.chapter === ch.id && html.includes(f.quote)) {
        const cls = f.category === 'distress' ? 'hl-distress' : 'hl-flagged';
        html = html.replace(f.quote, `<mark class="${cls}" title="${f.category}: ${f.reason}">${f.quote}</mark>`);
      }
    });

    return <div className="font-serif text-slate-800 text-base sm:text-lg leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const openCount = contradictions.filter(c => getStatus(c.key) === 'open' || getStatus(c.key) === 'teacher').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Story Chapters & Add Chapter (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold font-serif text-slate-900">
              {lang === 'tl' ? 'Ang Salaysay ng Klase' : 'Shared Class Narrative'}
            </h2>
            <p className="text-xs text-slate-500">
              {chapters.length} {lang === 'tl' ? 'kabanata mula sa magkakaibang may-akda' : 'chapters across co-authors'} · {chapters.reduce((sum, c) => sum + wordCount(c.text), 0)} {lang === 'tl' ? 'salita' : 'words'}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="inline-flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span>{lang === 'tl' ? 'Salungat' : 'Conflict'}</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{lang === 'tl' ? 'Nalutas' : 'Resolved'}</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>{lang === 'tl' ? 'Guro' : 'Teacher'}</span>
            </span>
          </div>
        </div>

        {/* Chapter Cards */}
        {chapters.map((ch, idx) => {
          const author = AUTHORS[ch.authorId] || AUTHORS.maria;
          const isEditing = editingChapterId === ch.id;
          const activeCollisions = contradictions.filter(
            c => (getStatus(c.key) === 'open' || getStatus(c.key) === 'teacher') && (c.a.chapter === ch.id || c.b.chapter === ch.id)
          );
          const hasFlag = safetyFlags.some(f => f.chapter === ch.id);

          return (
            <article
              key={ch.id}
              className={`bg-white rounded-xl border transition-shadow shadow-xs p-5 relative overflow-hidden ${
                activeCollisions.length > 0 ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              {/* Left Author Color Accent Bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: author.avatarColor }}
              />

              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs"
                    style={{ backgroundColor: author.avatarColor }}
                  >
                    {author.firstName[0]}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-900">{author.name}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {new Date(ch.at).toLocaleDateString()} · {wordCount(ch.text)} {lang === 'tl' ? 'salita' : 'words'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {activeCollisions.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                      {lang === 'tl' ? 'May Naka-pause na Thread' : 'Thread Paused'}
                    </span>
                  )}
                  <button
                    onClick={() => isEditing ? saveEdit(ch.id) : startEdit(ch)}
                    className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <Check className="w-3 h-3 mr-1 text-emerald-600" />
                        {lang === 'tl' ? 'I-save' : 'Save'}
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3 mr-1" />
                        {lang === 'tl' ? 'I-edit' : 'Edit'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-bold text-base text-slate-900 mb-3">{ch.title}</h3>

              {/* Content or Edit Box */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={6}
                    className="w-full text-base font-serif p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingChapterId(null)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                    >
                      {lang === 'tl' ? 'Kanselahin' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => saveEdit(ch.id)}
                      className="px-3 py-1 text-xs bg-slate-900 text-white rounded hover:bg-slate-800"
                    >
                      {lang === 'tl' ? 'I-save ang Pagbabago' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                renderStoryText(ch)
              )}

              {/* Safety notice if flagged */}
              {hasFlag && (
                <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">
                      {lang === 'tl' ? 'Paalala sa Nilalaman:' : 'Content Notice:'}
                    </span>{' '}
                    {lang === 'tl'
                      ? 'Ang bahaging may pulang tuldok ay naipasa sa guro para sa pagsusuri. Hindi ito binura upang mapanatili ang iyong orihinal na boses.'
                      : 'The underlined section is queued for teacher pedagogical review. It has NOT been deleted.'}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {/* Add Chapter Form */}
        <form onSubmit={handleAddSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{lang === 'tl' ? 'Magdagdag ng Bagong Kabanata' : 'Add Next Chapter'}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {lang === 'tl' ? 'Patuloy na paghabi ng salaysay' : 'Weaving into the shared canon'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                {lang === 'tl' ? 'Manunulat (Writing As)' : 'Author'}
              </label>
              <select
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {Object.values(AUTHORS).map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                {lang === 'tl' ? 'Pamagat ng Kabanata' : 'Chapter Title'}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`${lang === 'tl' ? 'Kabanata' : 'Chapter'} ${chapters.length + 1}: ...`}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {lang === 'tl' ? 'Teksto ng Kabanata' : 'Chapter Text'}
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={5}
              placeholder={
                lang === 'tl'
                  ? 'Isulat dito ang susunod na bahagi ng kuwento. Tiyaking sumusunod sa mga naitatag na detalye ng iyong mga kamag-aral...'
                  : 'Write the next passage of the story. The AI will cross-reference peer facts in real time...'
              }
              className="w-full text-base font-serif p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
              <span>{wordCount(newContent)} {lang === 'tl' ? 'salita' : 'words'}</span>
              <span className="italic">
                {lang === 'tl'
                  ? 'Estilong Socratic: Nagtatanong ang AI, hindi nag-a-auto-rewrite.'
                  : 'Socratic style: The AI flags and asks; it never rewrites.'}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>{lang === 'tl' ? 'Isumite ang Kabanata' : 'Submit Chapter'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: Collision & Resolution Center (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Real-Time Check Trigger Box */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <h3 className="font-bold text-base tracking-tight">
                {lang === 'tl' ? 'AI Continuity & Collision Engine' : 'AI Continuity & Collision Engine'}
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
              {checkMethod === 'gemini' ? 'Gemini 3.8 Flash' : 'Semantic Engine'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {lang === 'tl'
              ? 'Tinitingnan ng engine kung saan nagkakasalungat ang mga detalye ng magkakaibang may-akda (tulad ng kulay ng mata, tahanan, pamilya) at ginagabayan sila sa magalang na paglutas.'
              : 'Scans chapters across co-authors, builds the living story wiki, and flags narrative contradictions for respectful resolution.'}
          </p>

          <button
            onClick={onRunCheck}
            disabled={isChecking}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-sm disabled:opacity-75 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>
              {isChecking
                ? (lang === 'tl' ? 'Sinusuri ang salaysay gamit ang Gemini...' : 'Checking narrative with Gemini...')
                : (lang === 'tl' ? 'Suriin ang Continuity ng Kuwento' : 'Run Live Continuity Check')}
            </span>
          </button>
        </div>

        {/* Collisions / Contradictions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>
                {lang === 'tl' ? 'Mga Natukoy na Salungatan' : 'Detected Contradictions'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 ml-1">
                {openCount} {lang === 'tl' ? 'nakabukas' : 'open'}
              </span>
            </h3>
          </div>

          {contradictions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">
                {lang === 'tl' ? 'Walang natukoy na salungatan' : 'No cross-author contradictions'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'tl'
                  ? 'Tugma ang lahat ng naitatag na katotohanan sa bawat kabanata.'
                  : 'All character and world details align across co-authors.'}
              </p>
            </div>
          ) : (
            contradictions.map((c, i) => {
              const status = getStatus(c.key);
              const authorA = AUTHORS[c.a.author] || AUTHORS.maria;
              const authorB = AUTHORS[c.b.author] || AUTHORS.jose;
              const isResolved = status !== 'open' && status !== 'teacher';
              const isMerging = mergingKeys[c.key];
              const resolution = resolutions[c.key];

              return (
                <div
                  key={c.key}
                  className={`bg-white rounded-xl border p-4 shadow-2xs space-y-3 transition-all ${
                    isResolved ? 'border-emerald-200 bg-emerald-50/20' : 'border-amber-200'
                  }`}
                >
                  {/* Contradiction Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      {c.subject} · {c.attribute}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        status === 'open'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : status === 'teacher'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {status === 'open'
                        ? (lang === 'tl' ? 'Naka-pause' : 'Open Conflict')
                        : status === 'teacher'
                        ? (lang === 'tl' ? 'Hawak ng Guro' : 'With Teacher')
                        : (lang === 'tl' ? 'Nalutas na' : 'Resolved')}
                    </span>
                  </div>

                  {/* Side-by-Side Author Passages */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Version A */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: authorA.avatarColor }}
                        />
                        <span className="font-semibold text-slate-800">{authorA.firstName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({c.a.chapter})</span>
                      </div>
                      <p className="font-serif italic text-slate-700 leading-snug">"{c.a.quote}"</p>
                      <div className="mt-1 font-bold text-amber-700">
                        {lang === 'tl' ? 'Itinatag:' : 'Value:'} {c.a.value}
                      </div>
                    </div>

                    {/* Version B */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: authorB.avatarColor }}
                        />
                        <span className="font-semibold text-slate-800">{authorB.firstName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({c.b.chapter})</span>
                      </div>
                      <p className="font-serif italic text-slate-700 leading-snug">"{c.b.quote}"</p>
                      <div className="mt-1 font-bold text-amber-700">
                        {lang === 'tl' ? 'Itinatag:' : 'Value:'} {c.b.value}
                      </div>
                    </div>
                  </div>

                  {/* If Resolved, show resolution banner */}
                  {isResolved ? (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'tl' ? 'Kasunduan ng May-Akda:' : 'Authors Agreement:'}</span>
                      </div>
                      <p className="leading-relaxed">{resolution.summary}</p>
                    </div>
                  ) : (
                    /* Active Human Loop Step 1 & Step 2 */
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="text-xs text-slate-600 font-medium">
                        <span className="font-bold text-slate-900">
                          {lang === 'tl' ? 'Hakbang 1: Pagsulat ng Perspective Note' : 'Step 1: Write Perspective Notes'}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {lang === 'tl'
                            ? 'Bago magdesisyon, kilalanin muna ang pananaw ng kamag-aral gamit ang AI sentence starters.'
                            : 'Acknowledge peer perspective with respectful starters before selecting resolution.'}
                        </p>
                      </div>

                      {/* Perspective Notes Input Box A */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">
                            {authorA.name} ({lang === 'tl' ? 'Panig ni' : 'Perspective of'} {authorA.firstName})
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={notes[c.key]?.[authorA.id] || ''}
                          onChange={(e) => handleNoteChange(c.key, authorA.id, e.target.value)}
                          placeholder={
                            lang === 'tl'
                              ? `Naunawaan ko na isinulat ni ${authorB.firstName} ang...`
                              : `I see that ${authorB.firstName} wrote...`
                          }
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => addStarter(c.key, authorA.id, `Naunawaan ko na isinulat ni ${authorB.firstName} ang "${c.b.value}".`)}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          >
                            + "Naunawaan ko na..."
                          </button>
                          <button
                            type="button"
                            onClick={() => addStarter(c.key, authorA.id, `Naisip ko ang "${c.a.value}" dahil sa tagpuan kung saan...`)}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          >
                            + "Naisip ko dahil..."
                          </button>
                        </div>
                      </div>

                      {/* Perspective Notes Input Box B */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">
                            {authorB.name} ({lang === 'tl' ? 'Panig ni' : 'Perspective of'} {authorB.firstName})
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={notes[c.key]?.[authorB.id] || ''}
                          onChange={(e) => handleNoteChange(c.key, authorB.id, e.target.value)}
                          placeholder={
                            lang === 'tl'
                              ? `Nakita ko ang itinatag ni ${authorA.firstName} na...`
                              : `I understand that ${authorA.firstName} established...`
                          }
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => addStarter(c.key, authorB.id, `I understand ${authorA.firstName}'s version of "${c.a.value}".`)}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          >
                            + "I understand..."
                          </button>
                          <button
                            type="button"
                            onClick={() => addStarter(c.key, authorB.id, `Maaari nating pagsamahin ito kung...`)}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          >
                            + "Maaari nating..."
                          </button>
                        </div>
                      </div>

                      {/* Step 2: Resolution Pathways */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {lang === 'tl' ? 'Hakbang 2: Puno ng Pagpapasya' : 'Step 2: Resolution Pathway'}
                          </span>
                          {!isReadyForResolution(c) && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {lang === 'tl' ? 'Magsulat ng maikling note muna' : 'Complete notes first'}
                            </span>
                          )}
                        </div>

                        {/* Merging Sub-form */}
                        {isMerging ? (
                          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 text-xs space-y-2">
                            <p className="font-semibold text-slate-800">
                              {lang === 'tl' ? 'Aling bersyon ang gagamitin bilang canon?' : 'Which version shall be canon?'}
                            </p>
                            <div className="space-y-1">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`merge-${i}`}
                                  checked={mergeChoices[c.key] !== 'b'}
                                  onChange={() => setMergeChoices(prev => ({ ...prev, [c.key]: 'a' }))}
                                  className="text-amber-600"
                                />
                                <span>
                                  {authorA.firstName}: <b>{c.a.value}</b>
                                </span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`merge-${i}`}
                                  checked={mergeChoices[c.key] === 'b'}
                                  onChange={() => setMergeChoices(prev => ({ ...prev, [c.key]: 'b' }))}
                                  className="text-amber-600"
                                />
                                <span>
                                  {authorB.firstName}: <b>{c.b.value}</b>
                                </span>
                              </label>
                            </div>
                            <div className="flex space-x-2 pt-1">
                              <button
                                onClick={() => {
                                  const choice = mergeChoices[c.key] === 'b' ? 'b' : 'a';
                                  const chosen = choice === 'a' ? c.a : c.b;
                                  const who = choice === 'a' ? authorA.firstName : authorB.firstName;
                                  const summary = `${authorA.firstName} at ${authorB.firstName} ay nagkasundong pagsamahin ang detalye sa "${chosen.value}" (bersyon ni ${who}).`;
                                  onResolve(c.key, {
                                    key: c.key,
                                    type: 'merged',
                                    summary,
                                    at: new Date().toISOString(),
                                    resolvedValue: chosen.value,
                                    sourceAuthor: who,
                                  });
                                  setMergingKeys(prev => ({ ...prev, [c.key]: false }));
                                }}
                                className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                              >
                                {lang === 'tl' ? 'Kumpirmahin ang Pagsasama' : 'Confirm Merge'}
                              </button>
                              <button
                                onClick={() => setMergingKeys(prev => ({ ...prev, [c.key]: false }))}
                                className="px-3 py-1 text-slate-600 text-xs hover:text-slate-800"
                              >
                                {lang === 'tl' ? 'Bumalik' : 'Back'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Three Option Buttons */
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                            {/* Option A: Merge */}
                            <button
                              disabled={!isReadyForResolution(c)}
                              onClick={() => setMergingKeys(prev => ({ ...prev, [c.key]: true }))}
                              className="px-2 py-1.5 text-xs font-semibold rounded border border-slate-300 hover:border-slate-800 hover:bg-slate-50 disabled:opacity-50 text-slate-800 transition-colors"
                              title="Unify fact into one canonical truth"
                            >
                              {lang === 'tl' ? 'A: Pagsamahin' : 'A: Merge'}
                            </button>

                            {/* Option B: Keep Intentional */}
                            <button
                              disabled={!isReadyForResolution(c)}
                              onClick={() => {
                                const summary = `${authorA.firstName} at ${authorB.firstName} ay piniling panatilihin ang dalawang pananaw bilang sinadyang literary device (e.g., Unreliable Narrator o magkaibang tsismis sa nayon). Hindi ito ituturing na error sa pagmamarka.`;
                                onResolve(c.key, {
                                  key: c.key,
                                  type: 'both',
                                  summary,
                                  at: new Date().toISOString(),
                                });
                              }}
                              className="px-2 py-1.5 text-xs font-semibold rounded border border-slate-300 hover:border-slate-800 hover:bg-slate-50 disabled:opacity-50 text-slate-800 transition-colors"
                              title="Keep both as artistic intentional choice"
                            >
                              {lang === 'tl' ? 'B: Sinadya' : 'B: Keep Intentional'}
                            </button>

                            {/* Option C: Ask Teacher */}
                            <button
                              disabled={!isReadyForResolution(c)}
                              onClick={() => {
                                const summary = `Ipinasa nina ${authorA.firstName} at ${authorB.firstName} ang pagpapasya sa guro para sa gabay.`;
                                onResolve(c.key, {
                                  key: c.key,
                                  type: 'teacher',
                                  summary,
                                  at: new Date().toISOString(),
                                });
                              }}
                              className="px-2 py-1.5 text-xs font-semibold rounded border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-800 transition-colors"
                              title="Ask teacher for intervention"
                            >
                              {lang === 'tl' ? 'C: Itanong sa Guro' : 'C: Ask Teacher'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
