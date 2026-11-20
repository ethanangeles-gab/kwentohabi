import React, { useEffect, useRef, useState } from "react";
import type { SessionUser, StoryWorkspace, RubricStandard } from "./types";
import { api, ApiError, useDraft, clearAccountDrafts } from "./utils/client";
import { Dialog } from "./components/Dialog";
import { BrandLogo } from "./components/BrandLogo";
import { Mayakda } from "./components/Mayakda";
import { StoryDoodles } from "./components/StoryDoodles";
import { RegistrationForm, RequiredMark } from "./components/RegistrationForm";
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
import { classLabel } from "./utils/classes";
import { StudentCanvas } from "./components/StudentCanvas";
import { StoryWiki } from "./components/StoryWiki";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { MaterialsArchive } from "./components/MaterialsArchive";
import { TeacherGuidance } from "./components/TeacherGuidance";
import { StudentGuidance } from "./components/StudentGuidance";
type Workspace = {
  school: string;
  user: SessionUser;
  users: SessionUser[];
  stories: StoryWorkspace[];
  rubrics: RubricStandard[];
  usage: { remaining: number; limit: number; month: string };
};
type Tab = "hub" | "canvas" | "wiki" | "teacher" | "archive" | "guidance";

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
    [helpOpen, setHelpOpen] = useState(false),
    [clearDrafts, setClearDrafts] = useState(false);
  const helpRoot = useRef<HTMLDivElement>(null),
    helpTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!helpOpen) return;
    const position = () => {
      const trigger = helpTrigger.current;
      if (trigger)
        helpRoot.current?.style.setProperty(
          "--help-menu-top",
          `${trigger.getBoundingClientRect().bottom + 8}px`,
        );
    };
    position();
    const outside = (event: PointerEvent) => {
      if (!helpRoot.current?.contains(event.target as Node)) setHelpOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHelpOpen(false);
        helpTrigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [helpOpen]);
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
      setHelpOpen(false);
      setTab("hub");
      setSelectedId("");
    } catch (e: any) {
      setError(e.message);
    }
  };
  if (loading)
    return (
      <main
        className="max-w-lg mx-auto p-8 flex flex-col items-center gap-3 text-center"
        role="status"
      >
        <Mayakda pose="weave" size={110} interactive={false} />
        {t("Binubuksan ang KwentoHabi…", "Opening KwentoHabi…")}
      </main>
    );
  if (!workspace)
    return (
      <div className="min-h-screen auth-shell p-4 sm:p-8">
        <div className="auth-card">
          <section className="auth-story">
            <div className="habi-thread-bar auth-story-bar" />
            <h1 className="auth-story-logo">
              <BrandLogo />
            </h1>
            <p className="auth-story-eyebrow">
              {t(
                "KwentoHabi · Pagsusulat sa klase",
                "KwentoHabi · Classroom writing",
              )}
            </p>
            <p className="auth-story-title">
              {t(
                "Sama-samang hinahabi ang mga kuwento.",
                "Stories are woven together.",
              )}
            </p>
            <p className="auth-story-lede">
              {t(
                "Isang workspace ng paaralan para sa pagsusulat, gabay ng guro, at maingat na rebisyon.",
                "A school workspace for writing, teacher guidance, and thoughtful revision.",
              )}
            </p>
            <ul className="auth-story-chips">
              <li>
                {t("Feedback na may ebidensya", "Evidence-linked feedback")}
              </li>
              <li>{t("Nirerepaso ng guro", "Teacher reviewed")}</li>
            </ul>
            <div className="auth-mascot">
              <p className="auth-mascot-bubble">
                {t("Kumusta! Ako si Mayakda.", "Hi! I'm Mayakda.")}
              </p>
              <Mayakda
                pose="nest"
                size={150}
                lang={lang}
                interactive={authView === "register"}
              />
            </div>
          </section>
          <section className="auth-form space-y-5">
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
                <div className="space-y-1">
                  <p className="eyebrow">
                    {needsSetup
                      ? t(
                          "Para sa administrador ng paaralan",
                          "For school administrators",
                        )
                      : t("Account ng klase", "Classroom account")}
                  </p>
                  <h2 className="font-serif text-2xl font-bold">
                    {needsSetup
                      ? t("Ihanda ang paaralan", "Set up your school")
                      : t("Maligayang pagbabalik", "Welcome back")}
                  </h2>
                </div>
                <p className="text-slate-600">
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
                      <span>
                        {t("Paaralan", "School")} <RequiredMark />
                      </span>
                      <input name="school" required maxLength={200} />
                    </label>
                  )}
                  {!needsSetup && (
                    <div className="space-y-2">
                      <label className="field">
                        <span>
                          {t("Mag-sign in bilang", "Sign in as")}{" "}
                          <RequiredMark />
                        </span>
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
                          <option value="teacher">
                            {t("Guro", "Teacher")}
                          </option>
                          <option value="student">
                            {t("Mag-aaral", "Student")}
                          </option>
                        </select>
                      </label>
                      <p
                        id="login-role-help"
                        className="text-sm text-slate-500"
                      >
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
                    <span>
                      {needsSetup
                        ? t(
                            "Username / Email ng guro",
                            "Teacher username / Email",
                          )
                        : "Username / Email"}{" "}
                      <RequiredMark />
                    </span>
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
                    <span>
                      {t("Password", "Password")} <RequiredMark />
                    </span>
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
                <div className="text-center">
                  <PrivacyNotice lang={lang} compact />
                </div>
              </>
            )}
          </section>
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
      <StoryDoodles />
      <header className="bg-white border-b border-slate-200">
        <div className="habi-thread-bar" />
        <div className="workspace-width workspace-header">
          <h1 className="header-brand shrink-0">
            <BrandLogo compact />
          </h1>
          <div className="min-w-0 header-context">
            <p className="eyebrow">{t("Paaralan", "School")}</p>
            <p className="font-serif text-lg sm:text-xl font-bold leading-tight">
              {workspace.school || t("Walang pangalan", "Unnamed school")}
            </p>
            <p className="text-xs text-slate-600">
              {workspace.user.name} ·{" "}
              {teacher ? t("Guro", "Teacher") : t("Mag-aaral", "Student")}
            </p>
          </div>
          <div className="header-profile">
            <ProfileMenu
              user={workspace.user}
              school={workspace.school}
              lang={lang}
              onLangChange={setLang}
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
              onSchoolSaved={(school) => {
                readSequence.current++;
                setWorkspace((value) => (value ? { ...value, school } : value));
              }}
            />
          </div>
          <div className="header-stories flex flex-wrap gap-3 items-end">
            <label className="field w-full sm:flex-1 min-w-0 sm:max-w-2xl">
              {t("Aktibong kuwento", "Active story")}
              <select
                aria-label={t("Aktibong kuwento", "Active story")}
                value={current?.id || ""}
                disabled={!workspace.stories.length}
                onChange={(e) => chooseStory(e.target.value)}
              >
                {!workspace.stories.length && (
                  <option value="">
                    {t("Wala ka pang kuwento", "No stories yet")}
                  </option>
                )}
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
            <div className="header-story-actions">
              <button className="btn" onClick={() => setShowNew(true)}>
                {t("Bagong kuwento", "New story")}
              </button>
              <figure className="header-companion">
                <Mayakda
                  pose="quiet"
                  size={80}
                  lang={lang}
                  speechPlacement="right"
                />
                <figcaption>
                  <span className="font-serif font-bold">Mayakda</span>
                  <span className="companion-description">
                    {t("Kasama sa kuwento", "Writing companion")}
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
          <nav
            aria-label={t("Pangunahing nabigasyon", "Main navigation")}
            className="flex flex-wrap gap-2 workspace-nav"
          >
            {tabs.map(([id, label]) => (
              <button
                key={id}
                className={tab === id && !helpOpen ? "btn" : "btn-light"}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => {
                  setHelpOpen(false);
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
            <div
              className="relative help-menu"
              ref={helpRoot}
              onBlur={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                )
                  setHelpOpen(false);
              }}
            >
              <button
                ref={helpTrigger}
                type="button"
                className={helpOpen || tab === "guidance" ? "btn" : "btn-light"}
                aria-expanded={helpOpen}
                aria-controls="help-menu"
                aria-current={tab === "guidance" ? "page" : undefined}
                onClick={() => setHelpOpen(!helpOpen)}
              >
                <Menu size={16} />
                {t("Tulong at proyekto", "Help & project")}
              </button>
              {helpOpen && (
                <div id="help-menu" className="secondary-menu">
                  <button
                    className="btn-light"
                    onClick={() => {
                      helpTrigger.current?.focus();
                      setHelpOpen(false);
                      setShowHelp(true);
                    }}
                  >
                    {t("Gabay sa paggamit", "How to use KwentoHabi")}
                  </button>
                  <button
                    className={tab === "guidance" ? "btn" : "btn-light"}
                    onClick={() => {
                      setHelpOpen(false);
                      setTab("guidance");
                      setError("");
                    }}
                  >
                    {teacher
                      ? t("Patnubay para sa guro", "Teacher's guidance")
                      : t("Patnubay para sa mag-aaral", "Student's guidance")}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="workspace-width py-6 space-y-5">
        <div
          className="flex flex-wrap gap-2 justify-between text-xs text-slate-600"
          role="status"
        >
          <span className="inline-flex items-center gap-1.5">
            {saving && (
              <Mayakda
                pose="weave"
                size={20}
                className="-my-1"
                interactive={false}
              />
            )}
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
        {current && tab !== "hub" && tab !== "guidance" && (
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
        {!current && tab !== "hub" && tab !== "guidance" && (
          <section className="card empty-story flex flex-col items-center text-center gap-4 py-10">
            <Mayakda pose="nest" size={120} lang={lang} />
            <h2
              id="workspace-title"
              tabIndex={-1}
              className="font-serif text-2xl font-bold outline-none"
            >
              {t("Wala ka pang kuwento", "You don't have a story yet")}
            </h2>
            <p className="text-slate-600 max-w-lg">
              {teacher
                ? t(
                    "Gumawa ng bagong kuwento para sa iyong klase. Dito lalabas ang pagsusulat, wiki, gabay ng guro at mga materyales nito.",
                    "Create a new story for your class. Its writing, wiki, teacher review and materials will appear here.",
                  )
                : t(
                    "Gumawa ng sariling kuwento o hintayin ang gawaing itatalaga ng iyong guro. Dito lalabas ang pagsusulat, wiki at mga materyales nito.",
                    "Start your own story or wait for an assignment from your teacher. Its writing, wiki and materials will appear here.",
                  )}
            </p>
            <button className="btn" onClick={() => setShowNew(true)}>
              <PencilLine size={16} />
              {t("Bagong kuwento", "New story")}
            </button>
          </section>
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
        {tab === "guidance" &&
          (teacher ? (
            <TeacherGuidance lang={lang} />
          ) : (
            <StudentGuidance lang={lang} />
          ))}
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
          onCreate={async (bodies) => {
            let first: StoryWorkspace | undefined,
              created = 0;
            try {
              for (const body of bodies) {
                const story = await api<StoryWorkspace>("/api/stories", body);
                first ||= story;
                created++;
              }
            } catch (e: any) {
              if (!created) throw e;
              throw Error(
                t(
                  `${created} sa ${bodies.length} na kuwento ang nalikha bago nagkaproblema. Tingnan ang Silid-aralan bago subukang muli. `,
                  `${created} of ${bodies.length} stories were created before an error. Check the Classroom before retrying. `,
                ) + e.message,
              );
            } finally {
              if (first) await refresh().catch(() => {});
            }
            if (first) chooseStory(first.id);
            setShowNew(false);
            setTab(bodies.length > 1 ? "hub" : "canvas");
            if (bodies.length > 1)
              setNotice(
                t(
                  `Nalikha ang ${bodies.length} pribadong kuwento, isa para sa bawat napiling mag-aaral.`,
                  `Created ${bodies.length} private stories, one for each selected student.`,
                ),
              );
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
  onCreate: (bodies: any[]) => Promise<void>;
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const teacher = user.role === "teacher";
  const [classId, setClassId] = useState(user.classIds[0]),
    [mode, setMode] = useState(teacher ? "shared" : "individual"),
    [members, setMembers] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const students = users.filter(
    (u) => u.role === "student" && u.classIds.includes(classId),
  );
  const modes: [string, string][] = [
    ...(teacher
      ? [["shared", t("Pangkat", "Shared group")] as [string, string]]
      : []),
    ["individual", t("Pribadong indibidwal", "Private individual")],
  ];
  const wholeClass =
    students.length > 0 && students.every((u) => members.includes(u.id));
  const toggle = (id: string, on: boolean) =>
    setMembers((list) =>
      on ? [...new Set([...list, id])] : list.filter((m) => m !== id),
    );
  return (
    <Dialog title={t("Bagong kuwento", "New story")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const d = new FormData(e.currentTarget);
          const chosen = members.filter((id) =>
            students.some((u) => u.id === id),
          );
          if (teacher && !chosen.length) {
            setError(
              t(
                "Pumili ng kahit isang mag-aaral, o piliin ang buong klase.",
                "Select at least one student, or choose the whole class.",
              ),
            );
            return;
          }
          const base = {
            title: d.get("title"),
            genre: d.get("genre"),
            classId,
            mode,
            instructions: d.get("instructions") || "",
            dueAt: d.get("dueAt") || "",
          };
          const bodies = !teacher
            ? [{ ...base, memberIds: [] }]
            : mode === "individual"
              ? chosen.map((id) => ({ ...base, memberIds: [id] }))
              : [{ ...base, memberIds: chosen }];
          setBusy(true);
          setError("");
          try {
            await onCreate(bodies);
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
        {user.classIds.length > 1 ? (
          <label className="field">
            {t("Klase", "Class")}
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setMembers([]);
              }}
            >
              {user.classIds.map((id) => (
                <option key={id} value={id}>
                  {classLabel(id, lang)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="field">
            <span>{t("Klase", "Class")}</span>
            <p className="readonly-value">{classLabel(classId, lang)}</p>
          </div>
        )}
        {modes.length > 1 ? (
          <label className="field">
            {t("Uri ng gawain", "Writing mode")}
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {modes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="field">
            <span>{t("Uri ng gawain", "Writing mode")}</span>
            <p className="readonly-value">{modes[0][1]}</p>
            <span className="text-xs font-normal text-slate-500">
              {t(
                "Pribadong kuwento ang nagagawa ng mag-aaral. Ang guro ang gumagawa ng pangkatang gawain.",
                "Students create private stories. Group assignments are created by the teacher.",
              )}
            </span>
          </div>
        )}
        {teacher && (
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
            <fieldset className="space-y-2">
              <legend className="font-semibold mb-2">
                {t("Mga kasapi", "Student members")}
              </legend>
              {students.length ? (
                <>
                  <label className="flex gap-2 items-center font-semibold">
                    <input
                      type="checkbox"
                      checked={wholeClass}
                      ref={(input) => {
                        if (input)
                          input.indeterminate =
                            members.length > 0 && !wholeClass;
                      }}
                      onChange={(e) =>
                        setMembers(
                          e.target.checked ? students.map((u) => u.id) : [],
                        )
                      }
                    />
                    {t("Buong klase", "Whole class")} ({students.length})
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-2 pl-6 pr-2">
                    {students.map((u) => (
                      <label key={u.id} className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          name="members"
                          value={u.id}
                          checked={members.includes(u.id)}
                          onChange={(e) => toggle(u.id, e.target.checked)}
                        />
                        {u.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600" role="status">
                    {t(
                      `${members.length} sa ${students.length} mag-aaral ang napili.`,
                      `${members.length} of ${students.length} students selected.`,
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {mode === "individual"
                      ? t(
                          "Isang hiwalay na pribadong kuwento ang malilikha para sa bawat napiling mag-aaral.",
                          "A separate private story is created for each selected student.",
                        )
                      : t(
                          "Iisang kuwento ang pagtutulungan ng lahat ng napiling mag-aaral.",
                          "All selected students write one shared story together.",
                        )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  {t(
                    "Wala pang mag-aaral sa klaseng ito.",
                    "This class has no students yet.",
                  )}
                </p>
              )}
            </fieldset>
          </>
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
