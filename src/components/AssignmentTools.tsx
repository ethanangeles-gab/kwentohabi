import React, { useState } from "react";
import type { Chapter, StoryWorkspace } from "../types";
import { useDraft } from "../utils/client";
type Action = (kind: string, payload: any) => Promise<StoryWorkspace>;
export function AssignmentTools({
  story,
  action,
  lang,
}: {
  story: StoryWorkspace;
  action: Action;
  lang: "tl" | "en";
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [draft, setDraft] = useState({
      instructions: story.instructions || "",
      dueAt: story.dueAt || "",
      status: story.status || "active",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <details className="card">
      <summary className="font-semibold cursor-pointer">
        {t(
          "Gawain, takdang araw at pag-archive",
          "Assignment, due date & archive",
        )}
      </summary>
      <form
        className="space-y-4 mt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await action("assignment", draft);
          } catch (error: any) {
            setError(error.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          {t("Panuto ng gawain", "Assignment instructions")}
          <textarea
            aria-label={t("Panuto ng gawain", "Assignment instructions")}
            rows={4}
            maxLength={5000}
            value={draft.instructions}
            onChange={(e) =>
              setDraft({ ...draft, instructions: e.target.value })
            }
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="field">
            {t("Takdang araw (Manila)", "Due date (Manila)")}
            <input
              type="date"
              value={draft.dueAt}
              onChange={(e) => setDraft({ ...draft, dueAt: e.target.value })}
            />
          </label>
          <label className="field">
            {t("Kalagayan ng gawain", "Assignment status")}
            <select
              aria-label={t("Kalagayan ng gawain", "Assignment status")}
              value={draft.status}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  status: e.target.value as typeof draft.status,
                })
              }
            >
              <option value="active">{t("Aktibo", "Active")}</option>
              <option value="closed">
                {t("Sarado · read-only", "Closed · read-only")}
              </option>
              <option value="archived">
                {t("Naka-archive · read-only", "Archived · read-only")}
              </option>
            </select>
          </label>
        </div>
        <p className="text-xs text-slate-600">
          {t(
            "Ang pag-archive ay hindi pagbura. Maaaring buksan muli ng guro; mananatili ang mga na-save na tala.",
            "Archiving does not delete records. Teachers can reopen the assignment; saved records remain.",
          )}
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn" disabled={busy}>
          {t("I-save ang gawain", "Save assignment")}
        </button>
      </form>
    </details>
  );
}
export function ChapterReviewPanel({
  story,
  chapters,
  action,
  lang,
  teacherId,
}: {
  story: StoryWorkspace;
  chapters: Chapter[];
  action: Action;
  lang: "tl" | "en";
  teacherId: string;
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [drafts, setDrafts, storage] = useDraft<
    Record<string, { feedback: string; status: "reviewed" | "rework" }>
  >(`kwentohabi-draft:${teacherId}:${story.id}:teacher-feedback`, {});
  const chapter = chapters.find((ch) => ch.id === selected) || chapters[0],
    draft = chapter
      ? drafts[chapter.id] || {
          feedback: chapter.review?.feedback || "",
          status: chapter.review?.status || "reviewed",
        }
      : null;
  return (
    <section id="chapter-review" className="card space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <h3 className="font-serif text-xl font-bold">
          {t("Pagsusuri at feedback sa kabanata", "Chapter review & feedback")}
        </h3>
        <span className="badge">
          {chapters.filter((ch) => !ch.review).length}{" "}
          {t("naghihintay", "pending")} ·{" "}
          {chapters.filter((ch) => ch.review).length}{" "}
          {t("nirepaso", "reviewed")}
        </span>
      </div>
      {!chapter ? (
        <p className="text-sm text-slate-600">
          {t(
            "Walang kabanata sa filter na ito.",
            "No chapters match these filters.",
          )}
        </p>
      ) : (
        <>
          <label className="field">
            {t("Kabanatang rerepasuhin", "Chapter to review")}
            <select
              aria-label={t("Kabanatang rerepasuhin", "Chapter to review")}
              value={chapter.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {chapters.map((ch) => (
                <option value={ch.id} key={ch.id}>
                  {ch.title} ·{" "}
                  {ch.review
                    ? t("Nirepaso", "Reviewed")
                    : t("Naghihintay", "Pending")}
                </option>
              ))}
            </select>
          </label>
          <details>
            <summary className="font-semibold text-sm cursor-pointer">
              {t("Basahin ang orihinal na kabanata", "Read original chapter")}
            </summary>
            <p className="story-prose mt-3">{chapter.text}</p>
          </details>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await action("review-chapter", {
                  chapterId: chapter.id,
                  baseText: chapter.text,
                  ...draft,
                });
              } catch (error: any) {
                setError(error.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              {t("Feedback ng guro", "Teacher feedback")}
              <textarea
                aria-label={t("Feedback ng guro", "Teacher feedback")}
                required
                maxLength={5000}
                rows={4}
                value={draft!.feedback}
                onChange={(e) =>
                  setDrafts({
                    ...drafts,
                    [chapter.id]: { ...draft!, feedback: e.target.value },
                  })
                }
              />
            </label>
            <label className="field">
              {t("Pasya sa kabanata", "Chapter review outcome")}
              <select
                aria-label={t("Pasya sa kabanata", "Chapter review outcome")}
                value={draft!.status}
                onChange={(e) =>
                  setDrafts({
                    ...drafts,
                    [chapter.id]: {
                      ...draft!,
                      status: e.target.value as "reviewed" | "rework",
                    },
                  })
                }
              >
                <option value="reviewed">{t("Nirepaso", "Reviewed")}</option>
                <option value="rework">
                  {t("Kailangan ng rebisyon", "Revision requested")}
                </option>
              </select>
            </label>
            {!storage.persisted && (
              <p role="alert" className="error">
                {t(
                  "Hindi naitatabi sa browser ang feedback draft. I-save bago umalis.",
                  "Feedback draft not saved locally. Save before leaving.",
                )}
              </p>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="btn" disabled={busy}>
              {t("I-save ang feedback", "Save teacher feedback")}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
