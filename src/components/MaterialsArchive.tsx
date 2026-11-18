import React, { useState } from "react";
import type { StoryWorkspace, RubricStandard, Evaluation } from "../types";
import { Dialog } from "./Dialog";
import { api, useDraft } from "../utils/client";
type Props = {
  story: StoryWorkspace;
  rubrics: RubricStandard[];
  teacher: boolean;
  action: (kind: string, payload: any) => Promise<StoryWorkspace>;
  refresh: () => Promise<void>;
  lang: "tl" | "en";
};
export function MaterialsArchive({
  story,
  rubrics,
  teacher,
  action,
  refresh,
  lang,
}: Props) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const active = rubrics.find((r) => r.id === story.selectedRubricId);
  const validEval =
    evaluation &&
    evaluation.revision === story.revision &&
    evaluation.rubricId === story.selectedRubricId;
  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/evaluate", {
        storyId: story.id,
        version: story.version,
        lang,
      });
      if (
        !result.evaluation ||
        !Array.isArray(result.evaluation.criteria) ||
        result.evaluation.rubricId !== story.selectedRubricId
      )
        throw Error(
          "The server returned invalid evaluation feedback. Retry the evaluation.",
        );
      setEvaluation(result.evaluation);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <h3 className="font-serif text-xl font-bold">
            {t(
              "Mga pamantayan at modelong teksto",
              "Teacher rubrics and reference texts",
            )}
          </h3>
          {teacher && (
            <button className="btn" onClick={() => setShow(true)}>
              {t("Magdagdag ng materyal", "Add material")}
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600">
          {t(
            "Ginagamit ang buong pamantayan, timbang, at modelong teksto sa AI feedback. Ang mga sample na pamantayan ay halimbawa lamang; beripikahin bago gamitin sa pagmamarka. Pribado sa paaralang ito ang archive.",
            "AI feedback receives complete criteria, weights, and reference text. Sample rubrics are illustrative; verify them before assessment. This archive is private to this school.",
          )}
        </p>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="grid xl:grid-cols-2 gap-5 items-start">
        <div className="space-y-4">
          {rubrics.map((r) => (
            <article
              key={r.id}
              className={`card space-y-3 ${r.id === story.selectedRubricId ? "ring-2 ring-indigo-400" : ""}`}
            >
              <h4 className="font-bold">{r.title}</h4>
              <p className="text-xs text-slate-500">
                {r.author} · {r.category}
              </p>
              {r.criteria.map((c, i) => (
                <div key={i} className="text-sm">
                  <p className="font-semibold">
                    {c.name} · {c.weight}%
                  </p>
                  <p className="text-slate-600">{c.description}</p>
                </div>
              ))}
              {r.exemplarText && (
                <details>
                  <summary className="cursor-pointer text-sm font-semibold">
                    {t("Basahin ang modelong teksto", "Read reference text")}
                  </summary>
                  <p className="story-prose text-sm mt-3">{r.exemplarText}</p>
                </details>
              )}
              {r.source && (
                <p className="text-xs text-slate-500">
                  {t("Pinagmulan / pahintulot", "Source / permission")}:{" "}
                  {r.source} · {r.license}
                </p>
              )}
              {teacher && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-light"
                    disabled={busy || r.id === story.selectedRubricId}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await action("rubric", { rubricId: r.id });
                        setEvaluation(null);
                      } catch (e: any) {
                        setError(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {r.id === story.selectedRubricId
                      ? t(
                          "Nakatakda sa kuwentong ito",
                          "Assigned to this story",
                        )
                      : t("Itakda sa kuwentong ito", "Assign to this story")}
                  </button>
                  {r.attested && (
                    <button
                      className="btn-light"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await api(`/api/rubrics/${r.id}`, {}, "DELETE");
                          await refresh();
                        } catch (e: any) {
                          setError(e.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {t("Bawiin ang materyal", "Withdraw material")}
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
        <section className="card space-y-4">
          <h3 className="font-serif text-xl font-bold">
            {t("Pormatibong feedback", "Formative rubric feedback")}
          </h3>
          <p className="text-sm text-slate-600">
            {t(
              "Ang guro ang nagbibigay ng huling marka. Kapag hindi available ang AI, walang awtomatikong score: mga gabay sa pagbasa lamang ang ibibigay.",
              "The teacher assigns the final grade. When AI is unavailable, feedback provides reading prompts without automated scores.",
            )}
          </p>
          <p className="font-semibold text-sm">
            {active?.title ||
              t("Walang nakatakdang pamantayan", "No assigned rubric")}
          </p>
          <button
            className="btn"
            disabled={busy || !active || !story.chapters.length}
            onClick={run}
          >
            {busy
              ? t("Sinusuri…", "Evaluating…")
              : t("Bumuo ng feedback", "Generate feedback")}
          </button>
          {evaluation && !validEval && (
            <p className="notice">
              {t(
                "Luma na ang feedback. Suriin muli ang kasalukuyang draft.",
                "Feedback is outdated. Evaluate the current draft again.",
              )}
            </p>
          )}
          {validEval && (
            <div className="space-y-4">
              <p className="notice">{evaluation.notice}</p>
              {evaluation.criteria.map((c, i) => (
                <article
                  key={i}
                  className="border border-slate-200 rounded-lg p-3 space-y-2"
                >
                  <h4 className="font-bold text-sm">
                    {c.name} ·{" "}
                    {c.score === null
                      ? t("Guro ang magmamarka", "Teacher assessment required")
                      : `${c.score} / ${c.weight}`}
                  </h4>
                  <p className="text-sm text-slate-600">{c.feedback}</p>
                  {c.evidence.map((e, j) => (
                    <blockquote
                      key={j}
                      className="font-serif text-sm border-l-2 pl-3"
                    >
                      {e.chapterId}: “{e.quote}”
                    </blockquote>
                  ))}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      {show && (
        <MaterialDialog
          lang={lang}
          onClose={() => setShow(false)}
          onSave={async (body) => {
            await api("/api/rubrics", body);
            await refresh();
            setShow(false);
          }}
        />
      )}
    </div>
  );
}
const defaultCriteria = () => [{ name: "", description: "", weight: 100 }];
function MaterialDialog({
  lang,
  onClose,
  onSave,
}: {
  lang: "tl" | "en";
  onClose: () => void;
  onSave: (body: any) => Promise<void>;
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [draft, setDraft] = useDraft("kwentohabi-teacher-material-draft", {
    title: "",
    category: "Teacher reference",
    source: "",
    license: "",
    exemplarText: "",
    attested: false,
    criteria: defaultCriteria(),
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const total = draft.criteria.reduce((n, c) => n + c.weight, 0);
  const update = (i: number, key: string, value: any) =>
    setDraft({
      ...draft,
      criteria: draft.criteria.map((c, j) =>
        j === i ? { ...c, [key]: value } : c,
      ),
    });
  return (
    <Dialog
      title={t("Magdagdag ng pamantayan", "Add teacher material")}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (
            !Number.isFinite(total) ||
            Math.abs(total - 100) > 0.001 ||
            draft.criteria.some(
              (c) => !c.name.trim() || !c.description.trim() || c.weight <= 0,
            )
          ) {
            setError(
              t(
                "Kumpletuhin ang bawat pamantayan. Dapat 100 ang kabuuang timbang.",
                "Complete each criterion. Weights must total 100.",
              ),
            );
            return;
          }
          setBusy(true);
          try {
            await onSave(structuredClone(draft));
            setDraft({
              title: "",
              category: "Teacher reference",
              source: "",
              license: "",
              exemplarText: "",
              attested: false,
              criteria: defaultCriteria(),
            });
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {(
          [
            ["title", t("Pamagat", "Title")],
            ["category", t("Kategorya", "Category")],
            ["source", t("Pinagmulan o may-akda", "Source or original author")],
            ["license", t("Lisensya o pahintulot", "License or permission")],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="field">
            {label}
            <input
              required
              maxLength={200}
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="field">
          {t(
            "Mag-import ng modelong teksto (.txt, hanggang 200 KB)",
            "Import reference text (.txt, up to 200 KB)",
          )}
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                !file.name.toLowerCase().endsWith(".txt") ||
                file.size > 200000
              ) {
                setError(
                  t(
                    "Gumamit ng .txt file na hanggang 200 KB.",
                    "Choose a .txt file up to 200 KB.",
                  ),
                );
                return;
              }
              const text = await file.text();
              if (text.length > 50000) {
                setError(
                  t(
                    "Hanggang 50,000 karakter lamang.",
                    "Maximum 50,000 characters.",
                  ),
                );
                return;
              }
              setDraft({ ...draft, exemplarText: text });
              setError("");
            }}
          />
        </label>
        <p className="text-xs text-slate-500">
          {t(
            "Para sa PDF/DOCX, i-paste ang piniling teksto sa ibaba. Suriin muna ang imported na nilalaman.",
            "For PDF/DOCX, paste selected text below. Review imported content before saving.",
          )}
        </p>
        <label className="field">
          {t("Modelong teksto (opsyonal)", "Reference text (optional)")}
          <textarea
            aria-label={t(
              "Modelong teksto (opsyonal)",
              "Reference text (optional)",
            )}
            rows={5}
            maxLength={50000}
            value={draft.exemplarText}
            onChange={(e) =>
              setDraft({ ...draft, exemplarText: e.target.value })
            }
          />
        </label>
        <fieldset className="space-y-3">
          <legend className="font-bold mb-2">
            {t("Pamantayan at timbang", "Criteria and weights")} · {total}%
          </legend>
          {draft.criteria.map((c, i) => (
            <div
              key={i}
              className="p-3 border border-slate-200 rounded-lg space-y-2"
            >
              <label className="field">
                {t("Pangalan ng pamantayan", "Criterion name")}
                <input
                  required
                  maxLength={200}
                  value={c.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                />
              </label>
              <label className="field">
                {t("Paglalarawan", "Description")}
                <textarea
                  aria-label={`${t("Paglalarawan", "Description")} ${i + 1}`}
                  required
                  maxLength={3000}
                  value={c.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                />
              </label>
              <label className="field">
                {t("Timbang (%)", "Weight (%)")}
                <input
                  type="number"
                  required
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={Number.isNaN(c.weight) ? "" : c.weight}
                  onChange={(e) =>
                    update(
                      i,
                      "weight",
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="btn-light"
                disabled={draft.criteria.length === 1}
                onClick={() =>
                  setDraft({
                    ...draft,
                    criteria: draft.criteria.filter((_, j) => j !== i),
                  })
                }
              >
                {t("Alisin ang pamantayan", "Remove criterion")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-light"
            disabled={draft.criteria.length >= 20}
            onClick={() =>
              setDraft({
                ...draft,
                criteria: [
                  ...draft.criteria,
                  { name: "", description: "", weight: 0 },
                ],
              })
            }
          >
            {t("Magdagdag ng pamantayan", "Add criterion")}
          </button>
        </fieldset>
        <label className="flex gap-2 items-start text-sm">
          <input
            type="checkbox"
            required
            checked={draft.attested}
            onChange={(e) => setDraft({ ...draft, attested: e.target.checked })}
          />
          {t(
            "Sarili kong gawa ito, may pahintulot ako, o pinapahintulutan ng lisensya ang paggamit. Mananatili ito sa pribadong archive ng paaralan.",
            "I own this material, have permission, or its license allows this use. It will remain in this school’s private archive.",
          )}
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="btn" disabled={busy}>
          {t("I-save ang materyal", "Save material")}
        </button>
      </form>
    </Dialog>
  );
}
