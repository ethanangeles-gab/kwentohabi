import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { SessionUser, StoryWorkspace, RubricStandard } from "./types";
import { api, ApiError, useDraft, clearAccountDrafts } from "./utils/client";
import { Dialog } from "./components/Dialog";
import { BrandLogo } from "./components/BrandLogo";
import { RegistrationForm } from "./components/RegistrationForm";
import { ClassroomHome } from "./components/ClassroomHome";
import { PrivacyNotice } from "./components/PrivacyNotice";
import {
  BookOpen,
  PencilLine,
  ClipboardCheck,
  Library,
  House,
  Menu,
} from "lucide-react";
import { ProfileMenu } from "./components/ProfileMenu";
import { useTheme } from "./utils/theme";
import { ACCOUNT_IDENTIFIER_MAX_LENGTH } from "./utils/accountIdentifier";
import { StudentCanvas } from "./components/StudentCanvas";
import { StoryWiki } from "./components/StoryWiki";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { MaterialsArchive } from "./components/MaterialsArchive";
const BmcAndDefense = lazy(() =>
  import("./components/BmcAndDefense").then((m) => ({
    default: m.BmcAndDefense,
  })),
);
type Workspace = {
  school: string;
  user: SessionUser;
  users: SessionUser[];
  stories: StoryWorkspace[];
  rubrics: RubricStandard[];
  usage: { remaining: number; limit: number; month: string };
};
type Tab = "hub" | "canvas" | "wiki" | "teacher" | "archive" | "bmc";

export default function App() {
  const { theme, chooseTheme, persisted: themePersisted } = useTheme();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false),
    [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [loginRole, setLoginRole] = useState<"" | "teacher" | "student">("");
  const [lang, setLang] = useDraft<"tl" | "en">("kwentohabi-language", "tl");
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [tab, setTab] = useState<Tab>("hub"),
    [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  const [checkingId, setCheckingId] = useState(""),
    [connected, setConnected] = useState(false);
  const [showNew, setShowNew] = useState(false),
    [credentials, setCredentials] = useState<
      { username: string; password: string }[]
    >([]);
  const [hasKey, setHasKey] = useState(false);
  const [showHelp, setShowHelp] = useState(false),
    [clearDrafts, setClearDrafts] = useState(false);
  const userRef = useRef(workspace?.user.id);
  userRef.current = workspace?.user.id;
  const actionLock = useRef(false),
    readSequence = useRef(0);
  const current =
    workspace?.stories.find((s) => s.id === selectedId) ||
    workspace?.stories[0];
  const currentRef = useRef(current);
  currentRef.current = current;
  const refresh = async () => {
    const sequence = ++readSequence.current;
    try {
      const next = await api<Workspace>("/api/workspace");
      if (
        !next.user?.id ||
        !Array.isArray(next.stories) ||
        !Array.isArray(next.users) ||
        !Array.isArray(next.rubrics) ||
        !next.usage
      )
        throw Error("Invalid workspace response. Refresh to retry.");
      if (sequence !== readSequence.current) return;
      setWorkspace((previous) =>
        previous?.user.id === next.user.id
          ? {
              ...next,
              stories: next.stories.map((story) => {
                const saved = previous.stories.find((s) => s.id === story.id);
                return saved && saved.version > story.version ? saved : story;
              }),
            }
          : next,
      );
      setConnected(true);
    } catch (e: any) {
      setConnected(false);
      if (
        e instanceof ApiError &&
        e.status === 401 &&
        sequence === readSequence.current
      )
        setWorkspace(null);
      throw e;
    }
  };
  useEffect(() => {
    api("/api/health")
      .then((h) => {
        setNeedsSetup(h.needsSetup);
        setHasKey(h.hasGeminiApiKey);
        return h.needsSetup ? undefined : refresh();
      })
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!workspace) return;
    const timer = setInterval(() => {
      if (!actionLock.current) refresh().catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [workspace?.user.id]);
  useEffect(() => {
    document.documentElement.lang = lang === "tl" ? "fil" : "en";
  }, [lang]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.getElementById("workspace-title")?.focus();
  }, [tab, selectedId]);
  const applyStory = (story: StoryWorkspace, userId = userRef.current) =>
    setWorkspace((w) =>
      w && w.user.id === userId
        ? {
            ...w,
            stories: w.stories.map((s) =>
              s.id === story.id && story.version >= s.version ? story : s,
            ),
          }
        : w,
    );
  const action = async (kind: string, payload: unknown) => {
    if (actionLock.current)
      throw Error(
        t(
          "May kasalukuyang sine-save. Subukan muli.",
          "A save is in progress. Retry in a moment.",
        ),
      );
    const origin = currentRef.current!,
      originUser = userRef.current;
    actionLock.current = true;
    readSequence.current++;
    setSaving(true);
    setError("");
    try {
      const story = await api<StoryWorkspace>(
        `/api/stories/${origin.id}/actions`,
        { action: kind, payload, version: origin.version },
      );
      if (
        story.id !== origin.id ||
        !Number.isInteger(story.version) ||
        !Array.isArray(story.chapters)
      )
        throw Error(
          "The server returned an invalid save response. Your draft is retained; refresh before retrying.",
        );
      applyStory(story, originUser);
      setNotice(t("Nai-save sa server.", "Saved to server."));
      return story;
    } catch (e: any) {
      setError(e.message);
      await refresh().catch(() => {});
      throw e;
    } finally {
      actionLock.current = false;
      setSaving(false);
    }
  };
  const runCheck = async (useAI = true) => {
    const origin = currentRef.current!,
      originUser = userRef.current;
    if (checkingId || actionLock.current) return;
    setCheckingId(origin.id);
    setError("");
    setNotice("");
    try {
      const result = await api("/api/gemini/analyze", {
        storyId: origin.id,
        version: origin.version,
        lang,
        useAI,
      });
      if (
        result.story?.id !== origin.id ||
        !Number.isInteger(result.story.version) ||
        !Array.isArray(result.story.facts) ||
        !Array.isArray(result.story.contradictions) ||
        !Array.isArray(result.story.safetyFlags) ||
        !result.usage
      )
        throw Error(
          "The server returned an invalid analysis response. Previous evidence is retained; retry the check.",
        );
      if (originUser !== userRef.current) return;
      readSequence.current++;
      applyStory(result.story, originUser);
      setWorkspace((w) => (w ? { ...w, usage: result.usage } : w));
      setNotice(
        t(
          "Natapos ang pagsusuri. Kailangan pa rin ang pagrepaso ng guro. Limitado ang lokal na parser.",
          result.notice,
        ),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCheckingId("");
      refresh().catch(() => {});
    }
  };
  const chooseStory = (id: string) => {
    setSelectedId(id);
    setNotice("");
    setError("");
  };
  const signOut = async () => {
    try {
      await api("/api/logout", {});
      if (clearDrafts && workspace)
        try {
          clearAccountDrafts(workspace.user.id);
        } catch {
          setError(
            t(
              "Hindi nalinis ang lokal na draft. Linisin ang browser storage bago ipagamit ang device.",
              "Local drafts could not be cleared. Clear browser storage before sharing this device.",
            ),
          );
        }
      readSequence.current++;
      setWorkspace(null);
      setLoginRole("");
      setTab("hub");
      setSelectedId("");
    } catch (e: any) {
      setError(e.message);
    }
  };
  if (loading)
    return (
      <main className="max-w-lg mx-auto p-8" role="status">
        {t("Binubuksan ang KwentoHabi…", "Opening KwentoHabi…")}
      </main>
    );
  if (!workspace)
    return (
      <div className="min-h-screen auth-shell p-4 sm:p-10">
        <div className="max-w-md mx-auto card space-y-5">
          <h1 className="login-brand">
            <BrandLogo />
          </h1>
          <p className="eyebrow">
            {needsSetup
              ? t(
                  "Para sa administrador ng paaralan",
                  "For school administrators",
                )
              : t("Para sa iyong klase", "For your classroom")}
          </p>
          <p className="text-sm text-slate-600">
            {t(
              "Ikaw ang sumusulat. Guro ang gumagabay. Tinutulungan ka ng ebidensya na maghabi ng malinaw na kuwento.",
              "Students write. Teachers guide. Evidence helps every story hold together.",
            )}
          </p>
          {authView === "register" && !needsSetup ? (
            <RegistrationForm
              lang={lang}
              initialRole={loginRole}
              onBack={() => {
                setAuthView("login");
                setError("");
              }}
              onRegistered={async (user) => {
                setSaving(true);
                setAuthView("login");
                setLoginRole(user.role);
                setError("");
                setNotice(
                  t(
                    "Maligayang pagdating! Nagawa na ang iyong account.",
                    "Welcome! Your account is ready.",
                  ),
                );
                try {
                  await refresh();
                } catch (e: any) {
                  setError(
                    t(
                      "Nagawa ang account. Mag-sign in upang magpatuloy. ",
                      "Your account was created. Sign in to continue. ",
                    ) + e.message,
                  );
                } finally {
                  setSaving(false);
                }
              }}
            />
          ) : (
            <>
              <p>
                {needsSetup
                  ? t(
                      "Ihanda ang pribadong workspace ng paaralan.",
                      "Set up your private school workspace.",
                    )
                  : t(
                      "Mag-sign in sa account ng iyong klase.",
                      "Sign in to your classroom account.",
                    )}
              </p>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  setError("");
                  setSaving(true);
                  try {
                    const result = await api(
                      needsSetup ? "/api/setup" : "/api/login",
                      {
                        school: data.get("school"),
                        username: data.get("username"),
                        password: data.get("password"),
                        ...(!needsSetup ? { role: loginRole } : {}),
                      },
                    );
                    if (result.accounts) setCredentials(result.accounts);
                    setNeedsSetup(false);
                    await refresh();
                  } catch (e: any) {
                    setError(e.message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {needsSetup && (
                  <label className="field">
                    {t("Paaralan", "School")}
                    <input name="school" required maxLength={200} />
                  </label>
                )}
                {!needsSetup && (
                  <div className="space-y-2">
                    <label className="field">
                      {t("Mag-sign in bilang", "Sign in as")}
                      <select
                        name="role"
                        value={loginRole}
                        required
                        disabled={saving}
                        aria-describedby="login-role-help"
                        onChange={(event) => {
                          setLoginRole(
                            event.target.value as "" | "teacher" | "student",
                          );
                          setError("");
                        }}
                      >
                        <option value="" disabled>
                          {t("Pumili ng tungkulin", "Choose a role")}
                        </option>
                        <option value="teacher">{t("Guro", "Teacher")}</option>
                        <option value="student">
                          {t("Mag-aaral", "Student")}
                        </option>
                      </select>
                    </label>
                    <p id="login-role-help" className="text-sm text-slate-500">
                      {loginRole === "teacher"
                        ? t(
                            "Gamitin ang iyong account bilang guro.",
                            "Use your teacher account.",
                          )
                        : loginRole === "student"
                          ? t(
                              "Gamitin ang account na ibinigay ng iyong guro.",
                              "Use the student account provided by your teacher.",
                            )
                          : t(
                              "Piliin ang uri ng account bago mag-sign in.",
                              "Select your account type before signing in.",
                            )}
                    </p>
                  </div>
                )}
                <label className="field">
                  {needsSetup
                    ? t("Username / Email ng guro", "Teacher username / Email")
                    : "Username / Email"}
                  <input
                    name="username"
                    autoComplete="username"
                    required
                    maxLength={ACCOUNT_IDENTIFIER_MAX_LENGTH}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>
                <label className="field">
                  {t("Password", "Password")}
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={needsSetup ? 12 : 1}
                    maxLength={128}
                    autoComplete={
                      needsSetup ? "new-password" : "current-password"
                    }
                  />
                </label>
                {needsSetup && (
                  <p className="text-sm text-slate-500">
                    {t(
                      "Hindi bababa sa 12 karakter. Bubuo ng magkakahiwalay na account para sa mga sample na mag-aaral.",
                      "Use at least 12 characters. Separate sample student accounts will be generated.",
                    )}
                  </p>
                )}
                <button
                  className="btn w-full"
                  disabled={saving || (!needsSetup && !loginRole)}
                >
                  {needsSetup
                    ? t("Ihanda ang paaralan", "Set up school")
                    : t("Mag-sign in", "Sign in")}
                </button>
              </form>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              {!needsSetup && (
                <div className="space-y-2 text-center">
                  <p className="text-sm text-slate-600">
                    {t("Wala ka pang account?", "Don't have an account yet?")}
                  </p>
                  <button
                    type="button"
                    className="btn-light w-full"
                    disabled={saving}
                    onClick={() => {
                      setAuthView("register");
                      setError("");
                      setNotice("");
                    }}
                  >
                    {t("Gumawa ng account", "Create account")}
                  </button>
                </div>
              )}
              <PrivacyNotice lang={lang} compact />
            </>
          )}
        </div>
      </div>
    );
  const teacher = workspace.user.role === "teacher";
  const tabs: [Tab, string][] = [
    ["hub", t("Silid-aralan", "Classroom")],
    ["canvas", t("Pagsusulat", "Writing canvas")],
    ["wiki", t("Wiki ng kuwento", "Story wiki")],
    ...(teacher
      ? [["teacher", t("Gabay ng guro", "Teacher review")] as [Tab, string]]
      : []),
    ["archive", t("Mga materyales", "Materials")],
  ];
  return (
    <div className="min-h-screen app-shell pb-12">
      <header className="bg-white border-b border-slate-200">
        <div className="habi-thread-bar" />
        <div className="workspace-width py-4 space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="header-brand">
                <BrandLogo compact />
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="btn-light"
                onClick={() => setLang(lang === "tl" ? "en" : "tl")}
              >
                {lang === "tl" ? "English" : "Filipino"}
              </button>
              <ProfileMenu
                user={workspace.user}
                school={workspace.school}
                lang={lang}
                theme={theme}
                onThemeChange={chooseTheme}
                themePersisted={themePersisted}
                clearDrafts={clearDrafts}
                onClearDrafts={setClearDrafts}
                onSignOut={signOut}
                onSaved={(user) => {
                  readSequence.current++;
                  setWorkspace((value) =>
                    value?.user.id === user.id
                      ? {
                          ...value,
                          user,
                          users: value.users.map((entry) =>
                            entry.id === user.id
                              ? { ...entry, name: user.name }
                              : entry,
                          ),
                        }
                      : value,
                  );
                }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {workspace.school} · {workspace.user.name} ·{" "}
            {teacher ? t("Guro", "Teacher") : t("Mag-aaral", "Student")}
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="field flex-1 min-w-0 sm:max-w-2xl">
              {t("Aktibong kuwento", "Active story")}
              <select
                aria-label={t("Aktibong kuwento", "Active story")}
                value={current?.id || ""}
                onChange={(e) => chooseStory(e.target.value)}
              >
                {workspace.stories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} · {s.gradeLevel} ·{" "}
                    {s.mode === "individual"
                      ? t("Pribado", "Private")
                      : t("Pangkat", "Group")}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn" onClick={() => setShowNew(true)}>
              {t("Bagong kuwento", "New story")}
            </button>
          </div>
          <nav
            aria-label={t("Pangunahing nabigasyon", "Main navigation")}
            className="flex flex-wrap gap-2 workspace-nav"
          >
            {tabs.map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? "btn" : "btn-light"}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => {
                  setTab(id);
                  setError("");
                }}
              >
                {id === "hub" ? (
                  <House size={16} />
                ) : id === "canvas" ? (
                  <PencilLine size={16} />
                ) : id === "wiki" ? (
                  <BookOpen size={16} />
                ) : id === "teacher" ? (
                  <ClipboardCheck size={16} />
                ) : (
                  <Library size={16} />
                )}
                {label}
              </button>
            ))}
            <details className="relative">
              <summary className="btn-light cursor-pointer">
                <Menu size={16} />
                {t("Tulong at proyekto", "Help & project")}
              </summary>
              <div className="secondary-menu">
                <button
                  className="btn-light"
                  onClick={(e) => {
                    setTab("bmc");
                    setError("");
                    e.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  BMC & Q&A
                </button>
                <button
                  className="btn-light"
                  onClick={(e) => {
                    setShowHelp(true);
                    e.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  {t("Gabay sa paggamit", "How to use KwentoHabi")}
                </button>
                <PrivacyNotice lang={lang} />
              </div>
            </details>
          </nav>
        </div>
      </header>
      <main className="workspace-width py-6 space-y-5">
        <div
          className="flex flex-wrap gap-2 justify-between text-xs text-slate-600"
          role="status"
        >
          <span>
            {saving
              ? t("Sine-save…", "Saving…")
              : connected
                ? t(
                    "Konektado sa server · sinusuri ang update bawat 5 segundo",
                    "Server connected · checks for updates every 5 seconds",
                  )
                : t(
                    "Walang koneksyon sa server. Suriin ang status ng draft bago umalis.",
                    "Disconnected. Check the local draft status before leaving.",
                  )}
          </span>
          <span>
            {hasKey
              ? t("Naka-configure ang AI", "AI configured")
              : t("Limitadong lokal na parser", "Limited local parser")}{" "}
            · {workspace.usage.remaining}/{workspace.usage.limit}{" "}
            {t(
              "natitirang pagsusuri ngayong buwan",
              "checks remaining this month",
            )}
          </span>
          <button
            className="underline"
            onClick={() => refresh().catch((e) => setError(e.message))}
          >
            {t("I-refresh", "Refresh")}
          </button>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {workspace.user.role === "student" &&
          ["pending", "declined"].includes(
            workspace.user.consentStatus || "",
          ) && (
            <p className="notice">
              {t(
                "Hindi aktibo ang tala ng pahintulot ng paaralan. Lokal lamang ang pagsusuri hanggang maitala ang angkop na pasya.",
                "School authorization is not active. Checks stay local until the school records an appropriate decision.",
              )}
            </p>
          )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        {current && tab !== "hub" && tab !== "bmc" && (
          <>
            <div>
              <h2
                id="workspace-title"
                tabIndex={-1}
                className="text-2xl font-serif font-bold outline-none"
              >
                {current.title}
              </h2>
              <p className="text-sm text-slate-500">
                {current.gradeLevel} ·{" "}
                {current.mode === "individual"
                  ? t(
                      "Pribadong indibidwal na gawain",
                      "Private individual writing",
                    )
                  : t("Pinagsamang kuwento", "Shared writing")}{" "}
                · {current.memberIds.length} {t("kasapi", "members")}
              </p>
            </div>
            {current.instructions && (
              <details className="card">
                <summary className="font-semibold cursor-pointer">
                  {t("Panuto ng gawain", "Assignment instructions")} ·{" "}
                  {current.dueAt
                    ? `${t("Takda", "Due")}: ${current.dueAt}`
                    : t("Walang takdang araw", "No due date set")}
                </summary>
                <p className="mt-3 text-sm whitespace-pre-wrap">
                  {current.instructions}
                </p>
              </details>
            )}
            {current.status !== "active" && (
              <p className="notice">
                {t(
                  "Read-only ang gawaing ito. Maaaring buksan muli ng guro.",
                  "This assignment is read-only. Your teacher can reopen it.",
                )}
              </p>
            )}
            {current.isDemo && (
              <p className="badge w-fit">
                {t(
                  "Kathang-isip na halimbawa; hindi tunay na student data o pananaliksik.",
                  "Fictional example; not real student records or research data.",
                )}
              </p>
            )}
            {current.checkedRevision !== current.revision && (
              <p className="notice">
                {t(
                  "Hindi pa nasusuri ang kasalukuyang draft o pamantayan. Patakbuhin ang continuity check. Ang dating ebidensya ay para sa sanggunian lamang.",
                  "Current draft or policy is unchecked. Run a continuity check. Previous evidence is shown for reference only.",
                )}
              </p>
            )}
          </>
        )}
        {tab === "hub" && (
          <ClassroomHome
            user={workspace.user}
            users={workspace.users}
            stories={workspace.stories}
            school={workspace.school}
            lang={lang}
            onNew={() => setShowNew(true)}
            onOpen={(id, target) => {
              chooseStory(id);
              setTab(target);
            }}
            onDemo={async () => {
              const story = await api<StoryWorkspace>("/api/demo-story", {});
              await refresh();
              chooseStory(story.id);
              setTab("canvas");
            }}
          />
        )}
        {current && tab === "canvas" && (
          <StudentCanvas
            key={`${workspace.user.id}:${current.id}`}
            story={current}
            user={workspace.user}
            users={workspace.users}
            action={action}
            onRunCheck={runCheck}
            checking={checkingId === current.id}
            saving={saving}
            lang={lang}
          />
        )}
        {current && tab === "wiki" && (
          <StoryWiki
            story={current}
            user={workspace.user}
            users={workspace.users}
            action={action}
            facts={current.facts}
            contradictions={current.contradictions}
            resolutions={current.resolutions}
            storySummary={current.summary}
            lang={lang}
          />
        )}
        {current && tab === "teacher" && teacher && (
          <TeacherDashboard
            key={current.id}
            story={current}
            users={workspace.users}
            action={action}
            refresh={refresh}
            lang={lang}
          />
        )}
        {current && tab === "archive" && (
          <MaterialsArchive
            userId={workspace.user.id}
            key={current.id}
            story={current}
            rubrics={workspace.rubrics}
            teacher={teacher}
            action={action}
            refresh={refresh}
            lang={lang}
          />
        )}
        {tab === "bmc" && (
          <Suspense
            fallback={<p role="status">{t("Binubuksan…", "Loading…")}</p>}
          >
            <BmcAndDefense lang={lang} />
          </Suspense>
        )}
      </main>
      {showHelp && (
        <Dialog
          title={t("Gabay sa paggamit", "How to use KwentoHabi")}
          onClose={() => setShowHelp(false)}
        >
          <div className="space-y-4 text-sm">
            <p>
              {t(
                "Piliin ang nakatalagang kuwento. Isulat at i-save ang sariling kabanata; magkahiwalay ang mga bagong draft at rebisyon.",
                "Choose your assigned story. Write and save your own chapter; new drafts and revisions use separate buffers.",
              )}
            </p>
            <p>
              {t(
                "Lokal at limitado ang awtomatikong check pagkatapos mag-save. Opsyonal ang AI at may buwanang quota. Maaaring may maling flag o hindi matukoy na detalye.",
                "Automatic after-save checks use a limited local parser. AI is optional and has a monthly allowance. Flags can be wrong and details can be missed.",
              )}
            </p>
            <p>
              {t(
                "Mag-save ng sariling tala upang humingi ng gabay. Guro lamang ang maaaring magbukas muli ng kanyang pasya. Manwal ang rebisyon; guro ang nagbibigay ng huling marka.",
                "Save your own note to ask for help. Only the teacher can reopen a teacher decision. Revisions remain manual; the teacher assigns final grades.",
              )}
            </p>
            <PrivacyNotice lang={lang} />
          </div>
        </Dialog>
      )}
      {credentials.length > 0 && (
        <Dialog
          title={t(
            "Mga account ng sample na klase",
            "Sample classroom accounts",
          )}
          onClose={() => setCredentials([])}
        >
          <p className="mb-4 text-sm">
            {t(
              "Itabi ang mga password na ito bago isara. Ipinapakita nang isang beses lamang. Ibahagi nang pribado sa tamang mag-aaral.",
              "Save these passwords before closing. They are shown only once. Share privately with the assigned student.",
            )}
          </p>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((c) => (
                  <tr key={c.username}>
                    <td>{c.username}</td>
                    <td className="font-mono select-all p-2">{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Dialog>
      )}
      {showNew && (
        <NewStoryDialog
          user={workspace.user}
          users={workspace.users}
          lang={lang}
          onClose={() => setShowNew(false)}
          onCreate={async (body) => {
            const story = await api<StoryWorkspace>("/api/stories", body);
            await refresh();
            chooseStory(story.id);
            setShowNew(false);
            setTab("canvas");
          }}
        />
      )}
    </div>
  );
}
function NewStoryDialog({
  user,
  users,
  lang,
  onClose,
  onCreate,
}: {
  user: SessionUser;
  users: SessionUser[];
  lang: "tl" | "en";
  onClose: () => void;
  onCreate: (body: any) => Promise<void>;
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [classId, setClassId] = useState(user.classIds[0]),
    [mode, setMode] = useState(
      user.role === "teacher" ? "shared" : "individual",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title={t("Bagong kuwento", "New story")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          setBusy(true);
          try {
            await onCreate({
              title: d.get("title"),
              genre: d.get("genre"),
              classId,
              mode,
              memberIds: d.getAll("members"),
              instructions: d.get("instructions") || "",
              dueAt: d.get("dueAt") || "",
            });
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          {t("Pamagat", "Title")}
          <input name="title" required maxLength={200} />
        </label>
        <label className="field">
          {t("Tema", "Genre")}
          <input name="genre" maxLength={200} />
        </label>
        <label className="field">
          {t("Klase", "Class")}
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {user.classIds.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
        </label>
        <label className="field">
          {t("Uri ng gawain", "Writing mode")}
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            {user.role === "teacher" && (
              <option value="shared">{t("Pangkat", "Shared group")}</option>
            )}
            <option value="individual">
              {t("Pribadong indibidwal", "Private individual")}
            </option>
          </select>
        </label>
        {user.role === "teacher" && (
          <>
            <label className="field">
              {t("Panuto ng gawain", "Assignment instructions")}
              <textarea
                aria-label={t("Panuto ng gawain", "Assignment instructions")}
                name="instructions"
                rows={3}
                maxLength={5000}
              />
            </label>
            <label className="field">
              {t("Takdang araw (Manila)", "Due date (Manila)")}
              <input type="date" name="dueAt" />
            </label>
          </>
        )}
        {user.role === "teacher" && (
          <fieldset className="space-y-2" key={classId + mode}>
            <legend className="font-semibold mb-2">
              {t("Mga kasapi", "Student members")}
            </legend>
            {users
              .filter(
                (u) => u.role === "student" && u.classIds.includes(classId),
              )
              .map((u) => (
                <label key={u.id} className="flex gap-2 items-center">
                  <input
                    type={mode === "individual" ? "radio" : "checkbox"}
                    name="members"
                    value={u.id}
                  />
                  {u.name}
                </label>
              ))}
          </fieldset>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="btn" disabled={busy}>
          {t("Lumikha", "Create story")}
        </button>
      </form>
    </Dialog>
  );
}
