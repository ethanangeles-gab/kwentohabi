import React, { useState } from "react";
import { AssignmentTools, ChapterReviewPanel } from "./AssignmentTools";
import { ClassRoster } from "./AccountControls";
import type { SessionUser, StoryWorkspace } from "../types";
import { extractStoryTimeline } from "../utils/timelineAnalysis";
import { analyzeChapterSentiment } from "../utils/sentimentAnalysis";
type Props = {
  story: StoryWorkspace;
  users: SessionUser[];
  action: (kind: string, payload: any) => Promise<StoryWorkspace>;
  lang: "tl" | "en";
  refresh: () => Promise<void>;
};
export function TeacherDashboard({
  story,
  users,
  action,
  lang,
  refresh,
}: Props) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const send = async (kind: string, payload: any) => {
    setBusy(true);
    setError("");
    try {
      await action(kind, payload);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const [studentFilter, setStudentFilter] = useState("all"),
    [from, setFrom] = useState(""),
    [until, setUntil] = useState("");
  const included = (chapterId: string) => {
    const ch = story.chapters.find((c) => c.id === chapterId);
    if (!ch) return false;
    const day = new Date(ch.at).toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });
    return (
      (studentFilter === "all" || ch.authorId === studentFilter) &&
      (!from || day >= from) &&
      (!until || day <= until)
    );
  };
  const filteredChapters = story.chapters.filter((ch) => included(ch.id));
  const stale = story.checkedRevision !== story.revision;
  const name = (id: string) => users.find((u) => u.id === id)?.name || id;
  const now = new Date(),
    start = new Date(now.getTime() - 7 * 86400000);
  const period = story.contributions.filter(
    (c) => new Date(c.at) >= start && new Date(c.at) <= now,
  );
  const totals = story.memberIds.map((id) => ({
    id,
    words: period
      .filter((c) => c.authorId === id)
      .reduce((n, c) => n + c.wordsAdded, 0),
    edits: period.filter((c) => c.authorId === id).length,
  }));
  const max = Math.max(1, ...totals.map((c) => c.words));
  const { events } = extractStoryTimeline(story.chapters);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <p className="eyebrow">
            {t("Guro ang gumagabay", "Teacher-led review")}
          </p>
          <h3 className="font-serif text-xl font-bold">
            {t("Mga kailangang aksyunan", "Your review queue")}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="btn-light"
            href={`/api/stories/${story.id}/export?format=json`}
            download
          >
            {t("I-export ang buong tala", "Export review history")}
          </a>
          <a
            className="btn-light"
            href={`/api/stories/${story.id}/export?format=csv`}
            download
          >
            {t("I-export ang CSV", "Export CSV")}
          </a>
        </div>
      </div>
      <div className="card grid sm:grid-cols-3 gap-4">
        <label className="field">
          {t("Mag-aaral", "Student")}
          <select
            aria-label={t("Filter ng mag-aaral", "Filter by student")}
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
          >
            <option value="all">
              {t("Lahat ng kasapi", "All story members")}
            </option>
            {users
              .filter((u) => story.memberIds.includes(u.id))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          {t("Mula sa petsa ng pagsusumite", "Submitted from")}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="field">
          {t("Hanggang petsa", "Submitted until")}
          <input
            type="date"
            min={from}
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </label>
      </div>
      <ChapterReviewPanel
        story={story}
        chapters={filteredChapters}
        action={action}
        lang={lang}
        teacherId={users.find((u) => u.role === "teacher")?.id || "teacher"}
      />

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <section className="card space-y-4">
        <h3 className="font-serif text-xl font-bold">
          {t("Pamantayan at pagrepaso", "Content policy and review")}
        </h3>
        <label className="field max-w-md">
          {t("Antas ng nilalaman", "Content level")}
          <select
            disabled={busy}
            value={story.contentLevel}
            onChange={(e) => send("policy", { contentLevel: e.target.value })}
          >
            <option value="strict">
              {t("Mahigpit · Junior high", "Strict · Junior high")}
            </option>
            <option value="moderate">
              {t("Katamtaman · Senior high", "Moderate · Senior high")}
            </option>
            <option value="literature">
              {t("Pag-aaral ng panitikan", "Literature study")}
            </option>
          </select>
        </label>
        <p className="text-sm text-slate-600">
          {t(
            "Laging ipinaparepaso ang natukoy na mataas na panganib sa lahat ng antas. Ang mga sipi ay hindi awtomatikong binubura. Ang pahiwatig sa kathang-isip ay hindi diagnosis.",
            "Detected high-risk cues require review at every level. Passages are never automatically deleted. Fictional cues are not a diagnosis.",
          )}
        </p>
      </section>
      <div className="grid xl:grid-cols-2 gap-5 items-start">
        <section className="card space-y-4">
          <h3 className="font-serif text-xl font-bold">
            {t("Talakayang maaaring gabayan", "Discussions needing guidance")}
          </h3>
          {story.contradictions
            .filter(
              (c) =>
                (!story.resolutions[c.key] ||
                  story.resolutions[c.key].type === "teacher") &&
                (included(c.a.chapter) || included(c.b.chapter)),
            )
            .map((c) => (
              <article
                key={c.key}
                className="border border-indigo-200 rounded-lg p-4 space-y-3"
              >
                <h4 className="font-bold">
                  {c.subject}: {c.attribute}
                </h4>
                {[c.a, c.b].map((side, i) => (
                  <div key={i} className="text-sm space-y-1">
                    <p>
                      <b>
                        {i === 0 ? "A" : "B"}. {name(side.author)}
                      </b>{" "}
                      · {side.chapter} · {side.value}
                    </p>
                    <blockquote className="font-serif">
                      “{side.quote}”
                    </blockquote>
                    <p className="bg-slate-50 p-2 rounded">
                      {story.resolutions[c.key]?.notes?.[side.author] ||
                        story.notes[c.key]?.[side.author] ||
                        t("Walang tala", "No note")}
                    </p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  {(["a", "b", "both"] as const).map((choice) => (
                    <button
                      key={choice}
                      className="btn-light"
                      disabled={busy || stale}
                      onClick={() => send("arbitrate", { key: c.key, choice })}
                    >
                      {choice === "both"
                        ? t("Panatilihin pareho", "Keep both")
                        : choice === "a"
                          ? t("Piliin A", "Adopt A")
                          : t("Piliin B", "Adopt B")}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          {!story.contradictions.some(
            (c) => story.resolutions[c.key]?.type === "teacher",
          ) && (
            <p className="text-sm text-slate-500">
              {t("Walang nakabinbing kahilingan.", "No pending escalations.")}
            </p>
          )}
        </section>
        <section className="card space-y-4">
          <h3 className="font-serif text-xl font-bold">
            {t(
              "Mga siping kailangang repasuhin",
              "Passages for teacher review",
            )}
          </h3>
          {story.safetyFlags
            .filter((f) => included(f.chapter))
            .map((f) => (
              <article
                key={f.key}
                className="border border-rose-200 rounded-lg p-4 space-y-3"
              >
                <p className="text-sm font-bold">
                  {name(f.author)} · {f.chapter} · {f.category}
                </p>
                <blockquote className="font-serif text-sm">
                  “{f.quote}”
                </blockquote>
                <p className="text-xs text-slate-500">
                  {t(
                    "Kailangan ang konteksto at pagrepaso ng guro. Walang naipadalang referral; kung kailangan, sundin ang proseso ng paaralan sa labas ng app.",
                    "Teacher context and review required. No referral has been sent; if needed, follow your school’s process outside this app.",
                  )}
                </p>
                <p className="text-sm font-semibold">
                  {f.decision === "allow"
                    ? t("Nirepaso: pinayagan", "Reviewed: allowed")
                    : f.decision === "rework"
                      ? t("Humiling ng rebisyon", "Revision requested")
                      : t("Naghihintay ng pagrepaso", "Pending review")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-light"
                    disabled={busy || stale}
                    onClick={() =>
                      send("moderate", { key: f.key, decision: "allow" })
                    }
                  >
                    {t("Payagan sa konteksto", "Allow in context")}
                  </button>
                  <button
                    className="btn-light"
                    disabled={busy || stale}
                    onClick={() =>
                      send("moderate", { key: f.key, decision: "rework" })
                    }
                  >
                    {t("Humiling ng rebisyon", "Request revision")}
                  </button>
                </div>
              </article>
            ))}
          {!story.safetyFlags.length && (
            <p className="text-sm text-slate-500">
              {t(
                "Walang natukoy na pahiwatig. Kailangan pa rin ang pagbabasa ng guro.",
                "No cues detected. Teacher reading is still required.",
              )}
            </p>
          )}
        </section>
      </div>
      {story.contradictions.some(
        (c) => story.resolutions[c.key]?.type === "teacher-decided",
      ) && (
        <section className="card space-y-3">
          <h3 className="font-serif text-xl font-bold">
            {t("Naka-lock na pasya ng guro", "Locked teacher decisions")}
          </h3>
          {story.contradictions
            .filter((c) => story.resolutions[c.key]?.type === "teacher-decided")
            .map((c) => (
              <article key={c.key} className="border-b pb-3 space-y-2">
                <h4 className="font-semibold">
                  {c.subject}: {c.attribute}
                </h4>
                <p className="text-sm">{story.resolutions[c.key].summary}</p>
                <button
                  className="btn-light"
                  disabled={busy}
                  onClick={() => send("reopen", { key: c.key })}
                >
                  {t("Buksan muli ang talakayan", "Reopen discussion")}
                </button>
              </article>
            ))}
        </section>
      )}
      <AssignmentTools story={story} action={action} lang={lang} />
      <section className="card space-y-4">
        <h3 className="font-serif text-xl font-bold">
          {t(
            "Mga naitalang kontribusyon · huling 7 araw",
            "Recorded contributions · last 7 days",
          )}
        </h3>
        <p className="text-xs text-slate-500">
          {start.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })} –{" "}
          {now.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })} ·{" "}
          {story.title} ·{" "}
          {t(
            "Dagdag na bilang ng salita sa bawat save; hindi sukatan ng kalidad. Hindi kasama ang lumang sample data.",
            "Positive word-count changes per save; not a measure of quality. Historical sample text is excluded.",
          )}
        </p>
        {totals.map((c) => (
          <div
            key={c.id}
            className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 items-center"
          >
            <p className="font-semibold text-sm break-words">{name(c.id)}</p>
            <div className="min-w-0">
              <div className="flex flex-wrap justify-between text-xs text-slate-500 mb-1">
                <span>
                  {c.edits} {t("save", "saves")}
                </span>
                <span>
                  {c.words} {t("idinagdag na salita", "words added")}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded">
                <div
                  className="progress-fill h-full rounded"
                  style={{ width: `${(c.words / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </section>
      <section className="card space-y-4">
        <h3 className="font-serif text-xl font-bold">
          {t("Mga pahiwatig ng oras at tono", "Timeline and tone cues")}
        </h3>
        <p className="text-xs text-slate-500">
          {t(
            "Mga pagtatantya mula sa teksto, hindi awtomatikong marka o tiyak na kronolohiya.",
            "Text-based heuristics, not grades or an established chronology.",
          )}
        </p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {events.map((event, i) => {
            const tone = analyzeChapterSentiment(story.chapters[i], i);
            return (
              <article
                key={event.id}
                className="p-3 bg-slate-50 rounded-lg text-sm space-y-2"
              >
                <h4 className="font-semibold">{event.eventTitle}</h4>
                <p>
                  {event.keyQuote
                    ? t(
                        "May pahiwatig ng oras sa sipi",
                        "Time cue in the passage",
                      )
                    : t("Hindi tiyak ang oras", "Time unknown")}
                </p>
                {event.keyQuote && (
                  <p className="font-serif">“{event.keyQuote}”</p>
                )}
                <p>
                  {t("Mga bahagdan ng leksikal na tono", "Lexical tone shares")}
                  : {t("Pag-asa", "Joy/hope")} {tone.toneBreakdown.joyHope}%,{" "}
                  {t("Neutral", "Neutral")} {tone.toneBreakdown.calmPeace}%,{" "}
                  {t("Lungkot", "Sadness")} {tone.toneBreakdown.sadnessLonging}
                  %, {t("Takot/alitan", "Fear/conflict")}{" "}
                  {tone.toneBreakdown.fearConflict}%
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="card space-y-4">
        <h3 className="font-serif text-xl font-bold">
          {t("Talaan ng gawain sa kuwentong ito", "Story activity log")}
        </h3>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {story.logs.map((l) => (
            <article
              key={l.id}
              className="border-b border-slate-100 pb-3 text-sm"
            >
              <p className="font-semibold">
                {l.type} ·{" "}
                {new Date(l.at).toLocaleString(
                  lang === "tl" ? "fil-PH" : "en-PH",
                  { timeZone: "Asia/Manila" },
                )}
              </p>
              <p className="text-slate-600">{l.text}</p>
              {l.discussion && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">
                    {t(
                      "Ebidensya at mga tala",
                      "Evidence and perspective notes",
                    )}{" "}
                    · {t("rebisyon", "revision")} {l.discussion.revision}
                  </summary>
                  {[l.discussion.conflict.a, l.discussion.conflict.b].map(
                    (side, i) => (
                      <div key={i} className="mt-2 bg-slate-50 p-2 rounded">
                        <p className="font-semibold">
                          {name(side.author)} · {side.chapter}
                        </p>
                        <blockquote className="font-serif">
                          “{side.quote}”
                        </blockquote>
                        <p>{l.discussion!.notes[side.author]}</p>
                      </div>
                    ),
                  )}
                </details>
              )}
            </article>
          ))}
        </div>
      </section>
      <details className="card">
        <summary className="font-semibold cursor-pointer">
          {t("Mga na-save na rubric report", "Saved rubric feedback history")} (
          {Object.keys(story.evaluations || {}).length})
        </summary>
        <div className="mt-4 space-y-3">
          {Object.values(story.evaluations || {})
            .sort((a, b) =>
              (b.generatedAt || "").localeCompare(a.generatedAt || ""),
            )
            .map((evaluation, i) => (
              <article key={i} className="border-b pb-3 text-sm space-y-2">
                <p className="font-semibold">
                  {name(evaluation.generatedBy || "")} ·{" "}
                  {t("rebisyon", "revision")} {evaluation.revision} ·{" "}
                  {evaluation.revision === story.revision
                    ? t("Kasalukuyan", "Current")
                    : t("Luma na", "Outdated")}
                </p>
                <p>{evaluation.notice}</p>
                {evaluation.criteria.map((c, j) => (
                  <p key={j}>
                    <b>{c.name}</b>: {c.feedback}
                  </p>
                ))}
              </article>
            ))}
        </div>
      </details>
      <details>
        <summary className="btn-light w-fit mb-3">
          {t(
            "Pamahalaan ang mga account ng klase",
            "Manage classroom accounts",
          )}
        </summary>
        <ClassRoster
          users={users}
          classId={story.classId}
          refresh={refresh}
          lang={lang}
        />
      </details>
    </div>
  );
}
