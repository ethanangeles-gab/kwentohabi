import React, { useState } from "react";
import type { Chapter, SessionUser, StoryWorkspace } from "../types";
import { useDraft } from "../utils/client";

type Props = {
  story: StoryWorkspace;
  user: SessionUser;
  users: SessionUser[];
  action: (kind: string, payload: any) => Promise<StoryWorkspace>;
  onRunCheck: () => Promise<void>;
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
  const [draft, setDraft] = useDraft(prefix, {
    title: "",
    text: "",
    chapterId: "",
    baseText: "",
  });
  const [notes, setNotes] = useDraft<Record<string, string>>(
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
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
          <p className="card text-slate-500">
            {t(
              "Wala pang kabanata. Simulan ang iyong kuwento.",
              "No chapters yet. Start your story.",
            )}
          </p>
        )}
        {story.chapters.map((ch) => (
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
                    setDraft({
                      chapterId: ch.id,
                      text: ch.text,
                      title: ch.title,
                      baseText: ch.text,
                    })
                  }
                >
                  {t("I-edit sa ibaba", "Edit below")}
                </button>
              )}
            </div>
            <h4 className="font-bold">{ch.title}</h4>
            {highlight(ch)}
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
            className="card space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await send(
                draft.chapterId ? "chapter-edit" : "chapter-add",
                {
                  title:
                    draft.title ||
                    `${t("Kabanata", "Chapter")} ${story.chapters.length + 1}`,
                  text: draft.text,
                  chapterId: draft.chapterId,
                  baseText: draft.baseText,
                },
              );
              if (ok)
                setDraft({ title: "", text: "", chapterId: "", baseText: "" });
            }}
          >
            <h3 className="font-bold text-lg">
              {draft.chapterId
                ? t("Baguhin ang iyong kabanata", "Revise your chapter")
                : t("Magdagdag ng kabanata", "Add a chapter")}
            </h3>
            <p className="text-xs text-slate-500">
              {t("May-akda", "Writing as")}: {user.name} ·{" "}
              {t(
                "Ang draft ay iniingatan sa browser habang nagsusulat.",
                "Drafts are retained in this browser while you write.",
              )}
            </p>
            <label className="field">
              {t("Pamagat ng kabanata", "Chapter title")}
              <input
                value={draft.title}
                maxLength={200}
                disabled={Boolean(draft.chapterId)}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="field">
              {t("Teksto ng kabanata", "Chapter text")}
              <textarea
                aria-label={t("Teksto ng kabanata", "Chapter text")}
                rows={8}
                required
                maxLength={50000}
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              />
            </label>
            <p className="text-xs text-slate-500">
              {t(
                "Pagkatapos mag-save, patakbuhin ang continuity check. Manwal ang mga rebisyon.",
                "After saving, run the continuity check. Manuscript revisions are manual.",
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn" disabled={saving || !draft.text.trim()}>
                {t("I-save ang kabanata", "Save chapter")}
              </button>
              {draft.chapterId && (
                <button
                  type="button"
                  className="btn-light"
                  onClick={() =>
                    setDraft({
                      title: "",
                      text: "",
                      chapterId: "",
                      baseText: "",
                    })
                  }
                >
                  {t("Kanselahin ang pag-edit", "Cancel edit")}
                </button>
              )}
            </div>
          </form>
        )}
      </section>
      <aside className="space-y-4 min-w-0 xl:sticky xl:top-4">
        <div className="card bg-slate-900 text-white space-y-3">
          <h3 className="font-bold text-lg">
            {t("Pagsusuri ng continuity", "Continuity review")}
          </h3>
          <p className="text-sm text-slate-300">
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
            className="btn bg-amber-500 text-slate-950 w-full"
            onClick={onRunCheck}
            disabled={checking || saving || story.chapters.length === 0}
          >
            {checking
              ? t("Sinusuri…", "Checking…")
              : t("Suriin ang kasalukuyang draft", "Check current draft")}
          </button>
          <p className="text-xs text-slate-300">
            {t(
              "Maaaring may hindi matukoy na salungatan o sensitibong nilalaman. Kailangan ang pagrepaso ng guro.",
              "Undetected conflicts or sensitive passages may remain. Teacher review is required.",
            )}
          </p>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
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
                            "I-save muna ang tala ng bawat may-akda (10 karakter o higit). Ang pasya ay hindi awtomatikong nagbabago ng kuwento.",
                            "Each author must save a note of at least 10 characters first. Decisions do not automatically change the manuscript.",
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
                                  ![
                                    currentConflict.a.author,
                                    currentConflict.b.author,
                                  ].every(
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
    </div>
  );
}
