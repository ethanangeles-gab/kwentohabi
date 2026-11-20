import React, { useState } from "react";
import {
  BookOpen,
  PencilLine,
  ClipboardCheck,
  ArrowRight,
  LockKeyhole,
  Users,
  Sparkles,
} from "lucide-react";
import type { SessionUser, StoryWorkspace } from "../types";
import { useDraft } from "../utils/client";
type Props = {
  user: SessionUser;
  school: string;
  stories: StoryWorkspace[];
  users: SessionUser[];
  lang: "tl" | "en";
  onOpen: (id: string, tab: "canvas" | "teacher" | "wiki") => void;
  onNew: () => void;
  onDemo: () => Promise<void>;
};
export function ClassroomHome({
  user,
  school,
  stories,
  users,
  lang,
  onOpen,
  onNew,
  onDemo,
}: Props) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en),
    teacher = user.role === "teacher";
  const [classId, setClassId] = useState("all"),
    [showArchived, setShowArchived] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [onboarded, setOnboarded] = useDraft(
    `kwentohabi-onboarded:${user.id}`,
    false,
  );
  const visible = stories.filter(
    (s) =>
      (classId === "all" || s.classId === classId) &&
      (showArchived || s.status !== "archived"),
  );
  const active = visible.filter((s) => s.status === "active"),
    pending = active.reduce(
      (n, s) => n + s.chapters.filter((ch) => !ch.review).length,
      0,
    ),
    requests = active.reduce(
      (n, s) =>
        n +
        Object.values(s.resolutions).filter((r) => r.type === "teacher").length,
      0,
    );
  const ownChapters = visible
      .flatMap((s) => s.chapters)
      .filter((ch) => ch.authorId === user.id),
    tasks = visible.reduce(
      (n, s) =>
        n +
        s.chapters.filter(
          (ch) => ch.authorId === user.id && ch.review?.status === "rework",
        ).length +
        s.safetyFlags.filter(
          (f) => f.author === user.id && f.decision === "rework",
        ).length,
      0,
    );
  const latest = [...visible].sort((a, b) =>
    (b.logs[0]?.at || b.chapters.at(-1)?.at || "").localeCompare(
      a.logs[0]?.at || a.chapters.at(-1)?.at || "",
    ),
  )[0];
  const next = teacher
    ? active.find(
        (s) =>
          s.chapters.some((ch) => !ch.review) ||
          Object.values(s.resolutions).some((r) => r.type === "teacher"),
      ) || latest
    : latest;
  const recent = visible
    .flatMap((story) => story.logs.map((log) => ({ ...log, story })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);
  return (
    <section className="space-y-7">
      <div className="welcome-panel">
        <div className="space-y-4 max-w-2xl">
          <p className="eyebrow">
            {school} /{" "}
            {teacher
              ? t("Espasyo ng guro", "Teacher workspace")
              : t("Espasyo ng manunulat", "Student workspace")}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
            {teacher
              ? t("Gabay sa bawat bagong kuwento.", "Guide the next chapter.")
              : t(
                  "Ituloy ang kuwentong ikaw ang naghahabi.",
                  "Your next chapter starts here.",
                )}
          </h2>
          <p className="text-slate-600 max-w-xl leading-relaxed">
            {teacher
              ? t(
                  "Unahin ang mga kabanatang rerepasuhin, pakinggan ang magkakaibang pananaw, at magbigay ng malinaw na susunod na hakbang.",
                  "Review submissions, hear different perspectives, and give each writer a clear next step.",
                )
              : t(
                  "Isulat ang iyong ideya, balikan ang mundo ng kuwento, at gamitin ang feedback bilang gabay sa sariling rebisyon.",
                  "Write your ideas, revisit your story world, and use feedback to guide your own revisions.",
                )}
          </p>
          <div className="flex flex-wrap gap-3">
            {next ? (
              <button
                className="btn"
                onClick={() => onOpen(next.id, teacher ? "teacher" : "canvas")}
              >
                {teacher ? (
                  <ClipboardCheck size={18} />
                ) : (
                  <PencilLine size={18} />
                )}
                <span>
                  {teacher
                    ? t("Repasuhin ang mga kabanata", "Review submissions")
                    : t("Ituloy ang pagsusulat", "Continue writing")}
                </span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn" onClick={onNew}>
                <PencilLine size={18} />
                {t("Simulan ang kuwento", "Start a story")}
              </button>
            )}
            <button className="btn-light" onClick={onNew}>
              {teacher
                ? t("Lumikha ng gawain", "Create an assignment")
                : t("Bagong pribadong kuwento", "New private story")}
            </button>
          </div>
        </div>
        <div className="loom-motif" aria-hidden="true">
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
      {!onboarded && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-xl font-bold">
              {t("Tatlong hakbang para makapagsimula", "A simple way to begin")}
            </h3>
            <button className="btn-light" onClick={() => setOnboarded(true)}>
              {t("Naintindihan ko", "Got it")}
            </button>
          </div>
          <ol className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
            <li>
              <b>
                01 ·{" "}
                {teacher
                  ? t("Ihanda ang gawain", "Set the assignment")
                  : t("Piliin ang kuwento", "Choose your story")}
              </b>
              <p className="mt-1">
                {teacher
                  ? t(
                      "Itakda ang mga kasapi, panuto, sanggunian at takdang araw.",
                      "Choose members, instructions, references, and a due date.",
                    )
                  : t(
                      "Pribado ang indibidwal; nakikita ng pangkat ang pinagsamang kuwento.",
                      "Individual work stays private; group work is shared with assigned members.",
                    )}
              </p>
            </li>
            <li>
              <b>
                02 ·{" "}
                {teacher
                  ? t("Basahin ang ebidensya", "Read the evidence")
                  : t("Isulat at i-save", "Write and save")}
              </b>
              <p className="mt-1">
                {teacher
                  ? t(
                      "Balikan ang sipi at tala ng mag-aaral bago magpasya.",
                      "Read the passage and student notes before deciding.",
                    )
                  : t(
                      "Awtomatikong iniingatan sa browser ang draft. I-save upang maisumite.",
                      "Drafts autosave in this browser. Save your chapter to submit it.",
                    )}
              </p>
            </li>
            <li>
              <b>
                03 ·{" "}
                {teacher
                  ? t("Magbigay ng susunod na hakbang", "Give the next step")
                  : t("Talakayin at baguhin", "Discuss and revise")}
              </b>
              <p className="mt-1">
                {teacher
                  ? t(
                      "Ikaw ang nagbibigay ng feedback at huling marka; mungkahi lamang ang AI.",
                      "You give feedback and final grades; AI provides suggestions.",
                    )
                  : t(
                      "Magtanong sa guro kung kailangan; ikaw pa rin ang gumagawa ng rebisyon.",
                      "Ask the teacher when you need help; every revision remains yours.",
                    )}
              </p>
            </li>
          </ol>
        </div>
      )}
      <div className="grid sm:grid-cols-3 gap-4">
        {(teacher
          ? [
              [
                t("Aktibong gawain", "Active assignments"),
                active.length,
                BookOpen,
              ],
              [
                t("Kabanatang rerepasuhin", "Chapters awaiting review"),
                pending,
                ClipboardCheck,
              ],
              [
                t("Humihingi ng gabay", "Requests for guidance"),
                requests,
                Users,
              ],
            ]
          : [
              [t("Aking mga kuwento", "My stories"), visible.length, BookOpen],
              [
                t("Aking na-save na kabanata", "My saved chapters"),
                ownChapters.length,
                PencilLine,
              ],
              [
                t("Hiniling na rebisyon", "Revision tasks"),
                tasks,
                ClipboardCheck,
              ],
            ]
        ).map(([label, value, Icon]: any) => (
          <div key={label} className="card flex gap-4 items-center">
            <span className="stat-icon">
              <Icon size={21} />
            </span>
            <div>
              <p className="text-3xl font-semibold">{value}</p>
              <p className="text-sm text-slate-600">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            {teacher
              ? t("Gawain at pakikilahok", "Assignments & participation")
              : t("Nakatalaga sa iyo", "Assigned to you")}
          </p>
          <h3 className="font-serif text-2xl font-bold">
            {teacher
              ? t("Mga gawain ng klase", "Classroom assignments")
              : t("Ang aking mga kuwento", "My story shelf")}
          </h3>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          {teacher && (
            <label className="field">
              {t("Klase", "Class")}
              <select
                aria-label={t("Filter ng klase", "Filter by class")}
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="all">
                  {t("Lahat ng klase", "All assigned classes")}
                </option>
                {user.classIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex gap-2 items-center text-sm min-h-11">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            {t("Isama ang naka-archive", "Include archived")}
          </label>
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visible.map((story) => {
          const submitted = new Set(story.chapters.map((ch) => ch.authorId))
            .size;
          return (
            <article key={story.id} className="card story-card space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="badge">
                  {story.mode === "individual" ? (
                    <LockKeyhole size={13} />
                  ) : (
                    <Users size={13} />
                  )}{" "}
                  {story.mode === "individual"
                    ? t("Pribado", "Private")
                    : t("Pangkat", "Shared group")}
                </span>
                <span className="badge">
                  {story.status === "active"
                    ? t("Aktibo", "Active")
                    : story.status === "closed"
                      ? t("Sarado", "Closed")
                      : t("Naka-archive", "Archived")}
                </span>
                {story.isDemo && (
                  <span className="badge">
                    {t("Kathang-isip na sample", "Fictional example")}
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-serif text-xl font-bold leading-snug">
                  {story.title}
                </h4>
                <p className="text-xs text-slate-600 mt-2">
                  {story.gradeLevel}
                </p>
              </div>
              <p className="text-sm text-slate-600">
                {story.chapters.length}{" "}
                {t("na-save na kabanata", "saved chapters")} ·{" "}
                {story.dueAt
                  ? `${t("Takda", "Due")}: ${story.dueAt}`
                  : t("Walang nakatakdang araw", "No due date set")}
              </p>
              <div>
                <div className="flex justify-between gap-2 text-xs text-slate-600 mb-2">
                  <span>
                    {t("Mga kasaping may kabanata", "Members with a chapter")}
                  </span>
                  <span>
                    {submitted}/{story.memberIds.length}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={t(
                    "Pakikilahok sa pagsusumite",
                    "Submission participation",
                  )}
                  aria-valuemin={0}
                  aria-valuemax={story.memberIds.length}
                  aria-valuenow={submitted}
                  className="h-1.5 bg-slate-100 rounded"
                >
                  <div
                    className="h-full rounded progress-fill"
                    style={{
                      width: `${(submitted / Math.max(1, story.memberIds.length)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <button
                className="btn-light w-full"
                onClick={() => onOpen(story.id, teacher ? "teacher" : "canvas")}
              >
                {teacher ? (
                  <ClipboardCheck size={16} />
                ) : (
                  <PencilLine size={16} />
                )}{" "}
                {teacher
                  ? t("Buksan ang pagrepaso", "Open review")
                  : t("Buksan ang pagsusulat", "Open writing canvas")}
                <ArrowRight size={15} />
              </button>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <p className="card text-slate-600">
          {t(
            "Walang gawain sa filter na ito.",
            "No assignments match these filters.",
          )}
        </p>
      )}
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
        <section className="card space-y-4">
          <h3 className="font-serif text-xl font-bold">
            {t("Kamakailang gawain", "Recent activity")}
          </h3>
          {recent.length ? (
            recent.map((log) => (
              <button
                className="activity-row"
                key={log.id}
                onClick={() =>
                  onOpen(log.story.id, teacher ? "teacher" : "canvas")
                }
              >
                <span>
                  <span className="font-semibold block">{log.story.title}</span>
                  <span className="text-sm text-slate-600">
                    {log.type} ·{" "}
                    {new Date(log.at).toLocaleDateString(
                      lang === "tl" ? "fil-PH" : "en-PH",
                      { timeZone: "Asia/Manila" },
                    )}
                  </span>
                </span>
                <ArrowRight size={16} />
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-600">
              {t(
                "Lilitaw rito ang mga pagsusumite, pagrepaso at talakayan.",
                "Submissions, reviews, and discussions will appear here.",
              )}
            </p>
          )}
          <p className="text-xs text-slate-600">
            {t(
              "Mga tala ng gawain ito, hindi sukatan ng kalidad ng pagkatuto.",
              "Workflow records do not measure learning quality.",
            )}
          </p>
        </section>
        <section className="card bg-slate-50 space-y-4">
          <span className="badge">
            <Sparkles size={13} />
            {t("Gabayan ang unang paggamit", "Guided first use")}
          </span>
          <h3 className="font-serif text-2xl font-bold">Ang Huling Habi</h3>
          <p className="text-sm text-slate-600">
            {t(
              "Isang orihinal at kathang-isip na kuwento tungkol kay Amihan, Lola Sabel at mga alaala ng pamayanan. Subukan ang wiki, continuity, talakayan at pagrepaso sa iisang halimbawa.",
              "An original fictional story about Amihan, Lola Sabel, and community memories. Explore the wiki, continuity, discussion, and teacher review in one example.",
            )}
          </p>
          {teacher ? (
            <button
              className="btn-light"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await onDemo();
                } catch (error: any) {
                  setError(error.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("Buksan ang kathang-isip na demo", "Open fictional demo")}
              <ArrowRight size={15} />
            </button>
          ) : (
            <p className="text-sm text-slate-600">
              {t(
                "Maaaring idagdag ng guro ang halimbawang ito sa sample class.",
                "Your teacher can add this example to the sample class.",
              )}
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
