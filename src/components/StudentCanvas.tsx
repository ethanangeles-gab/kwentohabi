import React, { useRef, useState } from "react";
import type {
  Chapter,
  ChapterRevision,
  SessionUser,
  StoryWorkspace,
} from "../types";
import { api, downloadFile, useDraft } from "../utils/client";
import {
  blankDraft,
  editChapter,
  newChapter,
  finishChapterSave,
  type WritingBuffers,
  type WritingDraft,
} from "../utils/writingDrafts";
import { Dialog } from "./Dialog";
import { Mayakda } from "./Mayakda";

type Props = {
  story: StoryWorkspace;
  user: SessionUser;
  users: SessionUser[];
  action: (kind: string, payload: any) => Promise<StoryWorkspace>;
  onRunCheck: (useAI?: boolean) => Promise<void>;
  checking: boolean;
  saving: boolean;
  lang: "tl" | "en";
};
export function StudentCanvas({
  story,
  user,
  users,
  action,
  onRunCheck,
  checking,
  saving,
  lang,
}: Props) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const prefix = `kwentohabi-draft:${user.id}:${story.id}`;
  let legacy = blankDraft();
  try {
    legacy = JSON.parse(localStorage.getItem(prefix) || "null") || legacy;
  } catch {}
  const [buffers, setBuffers, storage] = useDraft<WritingBuffers>(
    prefix + ":buffers",
    { activeKey: "new", buffers: { new: legacy } },
  );
  const draft = buffers.buffers[buffers.activeKey] || blankDraft();
  const history = useRef<
    Record<string, { past: WritingDraft[]; future: WritingDraft[] }>
  >({});
  const setDraft = (next: WritingDraft) => {
    const stack = (history.current[buffers.activeKey] ??= {
      past: [],
      future: [],
    });
    stack.past.push({ ...draft });
    if (stack.past.length > 30) stack.past.shift();
    stack.future = [];
    setBuffers((previous) => ({
      ...previous,
      buffers: { ...previous.buffers, [previous.activeKey]: next },
    }));
  };
  const moveHistory = (direction: "past" | "future") => {
    const stack = history.current[buffers.activeKey];
    const entry = stack?.[direction].pop();
    if (!entry) return;
    stack[direction === "past" ? "future" : "past"].push({ ...draft });
    setBuffers((previous) => ({
      ...previous,
      buffers: {
        ...previous.buffers,
        [previous.activeKey]: {
          ...draft,
          text: entry.text,
          title: entry.title,
        },
      },
    }));
  };
  const [useAI, setUseAI] = useState(true);
  const [focusMode, setFocusMode] = useState(false),
    [autoCheck, setAutoCheck] = useDraft(prefix + ":auto-check", true);
  const [versions, setVersions] = useState<ChapterRevision[] | null>(null),
    [historyChapter, setHistoryChapter] = useState<Chapter | null>(null),
    [discard, setDiscard] = useState(false);
  const [notes, setNotes, noteStorage] = useDraft<Record<string, string>>(
    prefix + ":notes",
    {},
  );
  const [selected, setSelected] = useState(story.contradictions[0]?.key || ""),
    [error, setError] = useState("");
  const currentConflict =
    story.contradictions.find((c) => c.key === selected) ||
    story.contradictions[0];
  const name = (id: string) => users.find((u) => u.id === id)?.name || id;
  const send = async (kind: string, payload: any) => {
    setError("");
    try {
      await action(kind, payload);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };
  const stale = story.checkedRevision !== story.revision;
  const highlight = (ch: Chapter) => {
    const ranges: { start: number; end: number; cls: string; title: string }[] =
      [];
    const add = (quote: string, cls: string, title: string) => {
      if (!quote) return;
      let index = ch.text.indexOf(quote);
      while (index !== -1) {
        ranges.push({ start: index, end: index + quote.length, cls, title });
        index = ch.text.indexOf(quote, index + quote.length);
      }
    };
    story.contradictions.forEach((c) => {
      const side =
        c.a.chapter === ch.id ? c.a : c.b.chapter === ch.id ? c.b : null;
      if (side)
        add(
          side.quote,
          story.resolutions[c.key] &&
            story.resolutions[c.key].type !== "teacher"
            ? "hl-resolved"
            : "hl-contradiction",
          `${c.subject}: ${c.attribute}`,
        );
    });
    story.safetyFlags
      .filter((f) => f.chapter === ch.id && f.decision !== "allow")
      .forEach((f) => add(f.quote, "hl-flagged", f.category));
    const boundaries = [
      ...new Set([
        0,
        ch.text.length,
        ...ranges.flatMap((r) => [r.start, r.end]),
      ]),
    ].sort((a, b) => a - b);
    return (
      <p className="story-prose">
        {boundaries.slice(0, -1).map((start, i) => {
          const end = boundaries[i + 1],
            matches = ranges.filter((r) => r.start <= start && r.end >= end),
            range = matches.find((r) => r.cls === "hl-flagged") || matches[0];
          return range ? (
            <mark key={start} className={range.cls} title={range.title}>
              {ch.text.slice(start, end)}
            </mark>
          ) : (
            <React.Fragment key={start}>
              {ch.text.slice(start, end)}
            </React.Fragment>
          );
        })}
      </p>
    );
  };
  return (
    <div
      className={
        focusMode
          ? "max-w-4xl mx-auto space-y-5"
          : "grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start"
      }
    >
      <section className="space-y-4 min-w-0">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-xl font-bold font-serif">
            {t("Mga kabanata", "Manuscript")}
          </h3>
          <span className="text-sm text-slate-500">
            {story.chapters.reduce(
              (n, c) => n + c.text.trim().split(/\s+/).filter(Boolean).length,
              0,
            )}{" "}
            {t("salita", "words")}
          </span>
        </div>
        {story.chapters.length === 0 && (
          <div className="mayakda-empty-state card">
            <Mayakda size={112} pose="notice" />
            <div>
              <p className="font-serif text-lg font-bold">
                {t("Wala pang kabanata", "No chapters yet")}
              </p>
              <p className="text-sm text-slate-600">
                {t(
                  "Simulan natin ang unang talata.",
                  "Let's weave the opening paragraph.",
                )}
              </p>
            </div>
          </div>
        )}
        {!focusMode &&
          story.chapters.map((ch) => (
            <article
              key={ch.id}
              id={`chapter-${ch.id}`}
              className="card space-y-3 min-w-0"
            >
              <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>
                  {name(ch.authorId)} ·{" "}
                  {new Date(ch.at).toLocaleDateString(
                    lang === "tl" ? "fil-PH" : "en-PH",
                    { timeZone: "Asia/Manila" },
                  )}
                </span>
                {ch.authorId === user.id && (
                  <button
                    className="underline"
                    onClick={() =>
                      setBuffers((previous) => editChapter(previous, ch))
                    }
                  >
                    {t("I-edit sa ibaba", "Edit below")}
                  </button>
                )}
                {(ch.authorId === user.id || user.role === "teacher") && (
                  <button
                    className="underline"
                    onClick={async () => {
                      setError("");
                      try {
                        const result = await api(
                          `/api/stories/${story.id}/chapters/${ch.id}/history`,
                        );
                        setHistoryChapter(ch);
                        setVersions(result.versions);
                      } catch (error: any) {
                        setError(error.message);
                      }
                    }}
                  >
                    {t("Mga naunang bersyon", "Version history")}
                  </button>
                )}
              </div>
              <h4 className="font-bold">{ch.title}</h4>
              {highlight(ch)}
              {ch.review && (
                <div className="notice">
                  <p className="font-semibold">
                    {ch.review.status === "rework"
                      ? t(
                          "Hiniling na rebisyon ng guro",
                          "Teacher requested a revision",
                        )
                      : t("Nirepaso ng guro", "Reviewed by your teacher")}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {ch.review.feedback}
                  </p>
                </div>
              )}
              {story.safetyFlags
                .filter((f) => f.chapter === ch.id)
                .map((f) => (
                  <div
                    key={f.key}
                    className={f.decision === "allow" ? "notice" : "error"}
                  >
                    <p className="font-semibold">
                      {f.decision === "allow"
                        ? t(
                            "Nirepaso at pinayagan ng guro",
                            "Reviewed and allowed by teacher",
                          )
                        : f.decision === "rework"
                          ? t(
                              "Kailangan ng rebisyon: repasuhin ang siping ito kasama ang guro.",
                              "Revision requested: review this passage with your teacher.",
                            )
                          : t(
                              "Naghihintay ng pagrepaso ng guro",
                              "Pending teacher review",
                            )}
                    </p>
                    <p className="mt-1 text-xs">
                      {t(
                        "Pahiwatig sa teksto; kailangan ang konteksto ng guro. Walang awtomatikong referral.",
                        "Text cue requiring teacher context. No automatic referral has been sent.",
                      )}
                    </p>
                  </div>
                ))}
            </article>
          ))}
        {user.role === "student" && (
          <form
            id="chapter-editor"
            className="card space-y-4 writing-surface"
            onSubmit={async (e) => {
              e.preventDefault();
              const snapshot = { ...draft },
                sourceKey = buffers.activeKey;
              setError("");
              try {
                const savedStory = await action(
                  snapshot.chapterId ? "chapter-edit" : "chapter-add",
                  {
                    title:
                      snapshot.title ||
                      `${t("Kabanata", "Chapter")} ${story.chapters.length + 1}`,
                    text: snapshot.text,
                    chapterId: snapshot.chapterId,
                    baseText: snapshot.baseText,
                    autoCheck,
                  },
                );
                const saved = snapshot.chapterId
                  ? savedStory.chapters.find(
                      (ch) => ch.id === snapshot.chapterId,
                    )
                  : savedStory.chapters.find(
                      (ch) =>
                        !story.chapters.some((old) => old.id === ch.id) &&
                        ch.authorId === user.id &&
                        ch.text === snapshot.text.trim(),
                    );
                if (!saved)
                  throw Error(
                    "The saved chapter could not be verified. Your draft is retained.",
                  );
                setBuffers((previous) =>
                  finishChapterSave(previous, sourceKey, snapshot, saved),
                );
              } catch (error: any) {
                setError(error.message);
              }
            }}
          >
            <h3 className="font-bold text-lg">
              {draft.chapterId
                ? t("Baguhin ang iyong kabanata", "Revise your chapter")
                : t("Magdagdag ng kabanata", "Add a chapter")}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-light"
                onClick={() => setFocusMode(!focusMode)}
              >
                {focusMode
                  ? t("Ipakita ang kuwento", "Show manuscript")
                  : t("Pokus sa pagsusulat", "Focus writing")}
              </button>
              <button
                type="button"
                className="btn-light"
                onClick={() => setBuffers((previous) => newChapter(previous))}
              >
                {t("Bagong draft", "New chapter draft")}
              </button>
              <button
                type="button"
                className="btn-light"
                disabled={!history.current[buffers.activeKey]?.past.length}
                onClick={() => moveHistory("past")}
              >
                {t("I-undo", "Undo")}
              </button>
              <button
                type="button"
                className="btn-light"
                disabled={!history.current[buffers.activeKey]?.future.length}
                onClick={() => moveHistory("future")}
              >
                {t("I-redo", "Redo")}
              </button>
            </div>
            <label className="field">
              {t("Mga iniingatang draft", "Retained drafts")}
              <select
                aria-label={t("Mga iniingatang draft", "Retained drafts")}
                value={buffers.activeKey}
                onChange={(e) =>
                  setBuffers((previous) => ({
                    ...previous,
                    activeKey: e.target.value,
                  }))
                }
              >
                {Object.entries(buffers.buffers).map(([key, value]) => (
                  <option key={key} value={key}>
                    {key === "new"
                      ? t("Bagong kabanata", "New chapter")
                      : value.title || key}{" "}
                    {value.text !== value.baseText ? "?" : ""}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-600">
              {t("May-akda", "Writing as")}: {user.name} ?{" "}
              {draft.text.trim().split(/\s+/).filter(Boolean).length}{" "}
              {t("salita", "words")}
            </p>
            <p
              role={storage.persisted ? "status" : "alert"}
              className={
                storage.persisted ? "text-xs text-emerald-800" : "error"
              }
            >
              {storage.persisted
                ? t(
                    "Awtomatikong iniingatan ang draft sa browser. I-save upang isumite sa guro.",
                    "Draft autosaved in this browser. Save chapter to submit it to your teacher.",
                  )
                : t(
                    "Hindi nai-save sa browser ang draft. Panatilihing bukas ang pahina at mag-save sa server o mag-download ng kopya.",
                    "Draft not saved locally. Keep this page open and save to the server or download a copy.",
                  )}
            </p>
            <label className="field">
              {t("Pamagat ng kabanata", "Chapter title")}
              <input
                value={draft.title}
                maxLength={200}
                disabled={story.status !== "active"}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="field">
              {t("Teksto ng kabanata", "Chapter text")}
              <textarea
                aria-label={t("Teksto ng kabanata", "Chapter text")}
                disabled={story.status !== "active"}
                rows={focusMode ? 18 : 10}
                required
                maxLength={50000}
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              />
            </label>
            <p className="text-xs text-slate-500">
              {t(
                "Sinusuri ng lokal na parser pagkatapos mag-save kung pinagana. Ikaw ang gumagawa ng rebisyon.",
                "The local parser checks after saving when enabled. You make every manuscript revision.",
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn"
                disabled={
                  saving || !draft.text.trim() || story.status !== "active"
                }
              >
                {t("I-save ang kabanata", "Save chapter")}
              </button>
              <button
                type="button"
                className="btn-light"
                onClick={() =>
                  downloadFile(
                    "kwentohabi-draft.txt",
                    `${draft.title}\n\n${draft.text}`,
                  )
                }
              >
                {t("I-download ang draft", "Download draft")}
              </button>
              <button
                type="button"
                className="btn-light"
                onClick={() => setDiscard(true)}
                disabled={saving || !draft.text}
              >
                {t("Itapon ang draft na ito", "Discard this draft")}
              </button>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoCheck}
                onChange={(e) => setAutoCheck(e.target.checked)}
              />
              {t(
                "Suriin ang continuity pagkatapos mag-save (lokal, walang AI quota).",
                "Check continuity automatically after saving (local, no AI allowance).",
              )}
            </label>
          </form>
        )}
      </section>
      <aside
        className={`space-y-4 min-w-0 xl:sticky xl:top-4 ${focusMode ? "hidden" : ""}`}
      >
        <div className="card continuity-review space-y-3">
          <div className="flex items-center gap-3">
            {checking && <Mayakda size={64} pose="notice" />}
            <h3 className="font-bold text-lg">
              {t("Pagsusuri ng continuity", "Continuity review")}
            </h3>
          </div>
          {checking && (
            <p className="text-sm text-amber-200" role="status">
              {t("May napansin ako—inaayos ang mga hibla…", "Mayakda is following the story threads…")}
            </p>
          )}
          <p className="text-sm review-hint">
            {story.checkMethod === "gemini"
              ? t("Huling pagsusuri: AI", "Last check: AI")
              : story.checkMethod === "unchecked"
                ? t("Wala pang pagsusuri", "Not yet checked")
                : t(
                    "Huling pagsusuri: limitadong lokal na parser",
                    "Last check: limited local parser",
                  )}
          </p>
          <button
            className="btn w-full"
            onClick={() => onRunCheck(useAI)}
            disabled={checking || saving || story.chapters.length === 0}
          >
            {checking
              ? t("Sinusuri…", "Checking…")
              : t("Suriin ang kasalukuyang draft", "Check current draft")}
          </button>
          <p className="text-xs review-hint">
            {t(
              "Maaaring may hindi matukoy na salungatan o sensitibong nilalaman. Kailangan ang pagrepaso ng guro.",
              "Undetected conflicts or sensitive passages may remain. Teacher review is required.",
            )}
          </p>
        </div>
        {story.coverage?.truncated && (
          <p role="status" className="notice">
            {t(
              "Hindi kumpleto ang pagsusuri dahil nilimitahan ang ebidensya. Repasuhin ang buong kuwento kasama ang guro.",
              story.coverage.notice,
            )}
          </p>
        )}
        {!noteStorage.persisted && (
          <p role="alert" className="error">
            {t(
              "Hindi naitatabi sa browser ang tala. I-save ito sa server.",
              "Perspective draft not saved locally. Save your note to the server.",
            )}
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <label className="flex gap-2 text-sm items-start">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
          />
          {t(
            "Gamitin ang opsyonal na AI sa manual check kung pinahihintulutan.",
            "Use optional AI for manual checks when authorized.",
          )}
        </label>
        <div className="card space-y-4">
          <h3 className="text-lg font-bold">
            {t("Talakayin ang mga detalye", "Discuss conflicting details")}
          </h3>
          {story.contradictions.length === 0 ? (
            <p className="text-sm text-slate-600">
              {t(
                "Walang natukoy na salungatan. Hindi ito patunay na tama ang lahat ng detalye.",
                "No conflicts detected. This does not establish that every detail is consistent.",
              )}
            </p>
          ) : (
            <>
              <label className="field">
                {t("Piliing salungatan", "Choose conflict")}
                <select
                  value={currentConflict?.key}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {story.contradictions.map((c, i) => (
                    <option key={c.key} value={c.key}>
                      {i + 1}. {c.subject} · {c.attribute} ·{" "}
                      {story.resolutions[c.key]
                        ? t("May pasya", "Decision recorded")
                        : t("Bukas", "Open")}
                    </option>
                  ))}
                </select>
              </label>
              {currentConflict && (
                <div className="space-y-4" key={currentConflict.key}>
                  <h4 className="font-bold">
                    {currentConflict.subject}: {currentConflict.attribute}
                  </h4>
                  {[currentConflict.a, currentConflict.b].map((side, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-slate-50 p-3 space-y-2 border border-slate-200"
                    >
                      <p className="text-sm font-semibold">
                        {name(side.author)} ·{" "}
                        <a
                          href={`#chapter-${side.chapter}`}
                          className="underline"
                        >
                          {side.chapter}
                        </a>{" "}
                        · {side.value}
                      </p>
                      <blockquote className="text-sm font-serif">
                        “{side.quote}”
                      </blockquote>
                    </div>
                  ))}
                  <p className="text-sm text-slate-600">
                    {t(
                      "May paliwanag ba sa panahon, pananaw, o sinadyang pagkakaiba? Talakayin muna ang ebidensya.",
                      "Could time, perspective, or an intentional difference explain this? Discuss the evidence first.",
                    )}
                  </p>
                  {[
                    ...new Set([
                      currentConflict.a.author,
                      currentConflict.b.author,
                    ]),
                  ].map((id) => (
                    <div key={id} className="space-y-2">
                      <label className="field">
                        {name(id)} · {t("Tala ng pananaw", "Perspective note")}
                        <textarea
                          aria-label={`${name(id)} - ${t("Tala ng pananaw", "Perspective note")}`}
                          rows={3}
                          maxLength={5000}
                          readOnly={id !== user.id || user.role !== "student"}
                          value={
                            id === user.id
                              ? (notes[currentConflict.key] ??
                                story.notes[currentConflict.key]?.[id] ??
                                "")
                              : story.notes[currentConflict.key]?.[id] || ""
                          }
                          placeholder={t(
                            "Nauunawaan ko ang iyong bersyon. Sa aking kabanata…",
                            "I understand your version. In my chapter…",
                          )}
                          onChange={(e) =>
                            setNotes({
                              ...notes,
                              [currentConflict.key]: e.target.value,
                            })
                          }
                        />
                      </label>
                      {id === user.id && user.role === "student" && (
                        <button
                          className="btn-light"
                          disabled={saving}
                          onClick={() =>
                            send("note", {
                              key: currentConflict.key,
                              text:
                                notes[currentConflict.key] ??
                                story.notes[currentConflict.key]?.[id] ??
                                "",
                            })
                          }
                        >
                          {t("I-save ang aking tala", "Save my note")}
                        </button>
                      )}
                    </div>
                  ))}
                  {story.resolutions[currentConflict.key]?.type ===
                    "teacher-decided" && (
                    <p className="badge">
                      {t(
                        "Naka-lock ang pasya ng guro. Guro lamang ang maaaring magbukas muli.",
                        "Teacher decision locked. Only the teacher can reopen it.",
                      )}
                    </p>
                  )}
                  {story.resolutions[currentConflict.key] && (
                    <p className="notice">
                      {story.resolutions[currentConflict.key].outcome === "both"
                        ? t(
                            "Sinadyang panatilihin ang dalawang bersyon.",
                            "Both versions intentionally retained.",
                          )
                        : story.resolutions[currentConflict.key].type ===
                            "teacher"
                          ? t(
                              "Humiling ng gabay ng guro.",
                              "Teacher guidance requested.",
                            )
                          : t(
                              "Naitala ang pasya. Manwal na baguhin ang mga sipi upang umayon dito.",
                              "Decision recorded. Manually revise the passages to align them.",
                            )}
                    </p>
                  )}
                  {user.role === "student" &&
                    [
                      currentConflict.a.author,
                      currentConflict.b.author,
                    ].includes(user.id) && (
                      <>
                        <p className="text-xs text-slate-500">
                          {t(
                            "I-save ang sariling tala upang humingi ng gabay. Kailangan ang dalawang tala upang magkasundo. Guro lamang ang maaaring magbukas muli ng kanyang pasya.",
                            "Save your own note to ask the teacher. Adopting versions needs both notes. Teacher decisions stay locked until the teacher reopens them.",
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(["a", "b", "both", "teacher"] as const).map(
                            (choice) => (
                              <button
                                key={choice}
                                className="btn-light"
                                disabled={
                                  saving ||
                                  stale ||
                                  story.status !== "active" ||
                                  story.resolutions[currentConflict.key]
                                    ?.type === "teacher-decided" ||
                                  !(
                                    choice === "teacher"
                                      ? [user.id]
                                      : [
                                          currentConflict.a.author,
                                          currentConflict.b.author,
                                        ]
                                  ).every(
                                    (id) =>
                                      (
                                        story.notes[currentConflict.key]?.[
                                          id
                                        ] || ""
                                      ).trim().length >= 10,
                                  )
                                }
                                onClick={() =>
                                  send("resolve", {
                                    key: currentConflict.key,
                                    choice,
                                  })
                                }
                              >
                                {choice === "a"
                                  ? t("Piliin A", "Adopt A")
                                  : choice === "b"
                                    ? t("Piliin B", "Adopt B")
                                    : choice === "both"
                                      ? t("Parehong sinadya", "Keep both")
                                      : t("Gabay ng guro", "Ask teacher")}
                              </button>
                            ),
                          )}
                        </div>
                      </>
                    )}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
      {discard && (
        <Dialog
          title={t("Itapon ang draft na ito?", "Discard this draft?")}
          onClose={() => setDiscard(false)}
        >
          <p className="mb-4">
            {t(
              "Ang kasalukuyang buffer lamang ang aalisin. Mananatili ang mga na-save na kabanata at ibang draft.",
              "Only this buffer will be cleared. Saved chapters and other drafts remain.",
            )}
          </p>
          <button
            className="btn"
            onClick={() => {
              setBuffers((previous) => {
                const retained = { ...previous.buffers };
                delete retained[previous.activeKey];
                retained.new ??= blankDraft();
                return { activeKey: "new", buffers: retained };
              });
              setDiscard(false);
            }}
          >
            {t("Itapon ang draft", "Discard draft")}
          </button>
        </Dialog>
      )}
      {versions && historyChapter && (
        <Dialog
          title={`${t("Mga bersyon", "Version history")}: ${historyChapter.title}`}
          onClose={() => setVersions(null)}
        >
          <p className="text-sm text-slate-600 mb-4">
            {t(
              "Mananatili ang hanggang 20 na bersyon bawat kabanata sa nakatakdang limitasyon ng archive. Ang pagbawi ay bagong draft muna.",
              "Up to 20 saved versions per chapter within the archive size limit. Restoring first creates a draft.",
            )}
          </p>
          {versions.length === 0 && (
            <p>
              {t("Wala pang naitalang pagbabago.", "No saved revisions yet.")}
            </p>
          )}
          {versions.map((item) => (
            <article key={item.revisionId} className="border-b py-3 space-y-2">
              <p className="text-xs">
                {new Date(item.savedAt).toLocaleString(
                  lang === "tl" ? "fil-PH" : "en-PH",
                )}
              </p>
              <p className="story-prose text-sm">{item.text}</p>
              {historyChapter.authorId === user.id && (
                <button
                  className="btn-light"
                  onClick={() => {
                    setBuffers((previous) => {
                      const selected = editChapter(previous, historyChapter);
                      const key = `restore:${item.revisionId}:${Date.now()}`;
                      return {
                        ...selected,
                        activeKey: key,
                        buffers: {
                          ...selected.buffers,
                          [key]: {
                            title: item.title,
                            text: item.text,
                            chapterId: historyChapter.id,
                            baseText: historyChapter.text,
                          },
                        },
                      };
                    });
                    setVersions(null);
                  }}
                >
                  {t(
                    "Gawing draft ang bersyong ito",
                    "Restore this version as a draft",
                  )}
                </button>
              )}
            </article>
          ))}
        </Dialog>
      )}
    </div>
  );
}
