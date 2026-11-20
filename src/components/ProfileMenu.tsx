import React, { useEffect, useId, useRef, useState } from "react";
import { Moon, Sun, Settings, LogOut, Camera } from "lucide-react";
import type { SessionUser } from "../types";
import type { Theme } from "../utils/theme";
import { api } from "../utils/client";
import { Dialog } from "./Dialog";
import { PasswordControl } from "./AccountControls";
import { PrivacyNotice } from "./PrivacyNotice";

type Language = "tl" | "en";
export function Avatar({
  user,
  large = false,
}: {
  user: Pick<SessionUser, "name" | "avatarDataUrl">;
  large?: boolean;
}) {
  const initials = user.name
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toLocaleUpperCase();
  return (
    <span
      className={`account-avatar${large ? " account-avatar-large" : ""}`}
      aria-hidden="true"
    >
      {user.avatarDataUrl ? (
        <img src={user.avatarDataUrl} alt="" />
      ) : (
        initials || "KH"
      )}
    </span>
  );
}

export function ThemeToggle({
  theme,
  onChange,
  lang,
}: {
  theme: Theme;
  onChange: (value: Theme) => void;
  lang: Language;
}) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="btn-light theme-toggle"
      role="switch"
      aria-checked={dark}
      aria-label={lang === "tl" ? "Madilim na tema" : "Dark mode"}
      onClick={() => onChange(dark ? "light" : "dark")}
    >
      {dark ? (
        <Moon size={18} aria-hidden="true" />
      ) : (
        <Sun size={18} aria-hidden="true" />
      )}
      <span>{lang === "tl" ? "Madilim na tema" : "Dark mode"}</span>
      <span className="theme-switch-track" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

async function preparePhoto(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw Error("Choose a PNG, JPEG, or WebP image under 5 MB.");
  const image = await createImageBitmap(file).catch(() => {
    throw Error("This image could not be read. Choose another picture.");
  });
  try {
    if (
      !image.width ||
      !image.height ||
      image.width * image.height > 72_000_000
    )
      throw Error("Choose a smaller image (up to 72 megapixels).");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 192;
    const context = canvas.getContext("2d");
    if (!context) throw Error("Image preview is unavailable in this browser.");
    const side = Math.min(image.width, image.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 192, 192);
    context.drawImage(
      image,
      (image.width - side) / 2,
      (image.height - side) / 2,
      side,
      side,
      0,
      0,
      192,
      192,
    );
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    image.close();
  }
}

function ProfileSettings({
  user,
  school,
  lang,
  onSaved,
  onClose,
  theme,
  onThemeChange,
  themePersisted,
}: {
  user: SessionUser;
  school: string;
  lang: Language;
  onSaved: (value: SessionUser) => void;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  themePersisted: boolean;
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [name, setName] = useState(user.name),
    [photo, setPhoto] = useState(user.avatarDataUrl || "");
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null),
    readId = useRef(0);
  useEffect(
    () => () => {
      readId.current++;
    },
    [],
  );
  return (
    <Dialog
      title={t("Mga setting ng profile", "Profile settings")}
      onClose={onClose}
    >
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          setSaved(false);
          try {
            const result = await api<{ user: SessionUser }>("/api/profile", {
              name,
              avatarDataUrl: photo,
            });
            onSaved(result.user);
            setName(result.user.name);
            setSaved(true);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Avatar user={{ name, avatarDataUrl: photo }} large />
          <div className="min-w-0 space-y-2 flex-1">
            <label className="btn-light cursor-pointer">
              <Camera size={16} aria-hidden="true" />
              {t("Palitan ang larawan", "Change picture")}
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={async (event) => {
                  const file = event.target.files?.[0],
                    id = ++readId.current;
                  if (!file) return;
                  setReading(true);
                  setError("");
                  setSaved(false);
                  try {
                    const value = await preparePhoto(file);
                    if (readId.current === id) setPhoto(value);
                  } catch (e: any) {
                    if (readId.current === id)
                      setError(
                        t(
                          "Hindi mabasa ang larawan. Gumamit ng PNG, JPEG, o WebP na wala pang 5 MB.",
                          e.message,
                        ),
                      );
                  } finally {
                    if (readId.current === id) setReading(false);
                    if (inputRef.current) inputRef.current.value = "";
                  }
                }}
              />
            </label>
            {photo && (
              <button
                type="button"
                className="btn-light"
                disabled={busy}
                onClick={() => {
                  ++readId.current;
                  setReading(false);
                  setPhoto("");
                  setSaved(false);
                }}
              >
                {t("Alisin ang larawan", "Remove picture")}
              </button>
            )}
            <p className="text-xs text-slate-500">
              {t(
                "PNG, JPEG o WebP · hanggang 5 MB. I-save upang mailapat.",
                "PNG, JPEG or WebP · up to 5 MB. Save to apply.",
              )}
            </p>
            <p className="text-xs text-slate-500">
              {t(
                "Ikaw lamang ang makakakita ng larawang ito sa iyong account.",
                "This picture is visible only in your account.",
              )}
            </p>
          </div>
        </div>
        <label className="field">
          {t("Pangalang ipinapakita", "Display name")}
          <input
            name="displayName"
            value={name}
            required
            maxLength={200}
            disabled={busy}
            autoComplete="name"
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <div className="profile-school text-sm space-y-1">
          <p className="font-semibold">{school}</p>
          <p className="text-slate-500">
            {user.role === "teacher"
              ? t("Guro", "Teacher")
              : t("Mag-aaral", "Student")}
          </p>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="notice">
            {t("Nai-save ang profile.", "Profile saved.")}
          </p>
        )}
        {reading && (
          <p role="status" className="text-sm">
            {t("Inihahanda ang larawan…", "Preparing picture…")}
          </p>
        )}
        <button className="btn" disabled={busy || reading || !name.trim()}>
          {busy
            ? t("Sine-save…", "Saving…")
            : t("I-save ang profile", "Save profile")}
        </button>
      </form>
      <section
        className="section-divider mt-6 pt-5 space-y-3"
        aria-label={t("Hitsura", "Appearance")}
      >
        <h3 className="font-semibold">{t("Hitsura", "Appearance")}</h3>
        <p className="text-sm text-slate-500">
          {themePersisted
            ? t(
                "Naaalala ang tema sa browser na ito.",
                "Your theme is remembered in this browser.",
              )
            : t(
                "Nailapat ang tema. Hindi ito maaalala dahil hindi magagamit ang browser storage.",
                "Theme applied. Browser storage is unavailable, so it may reset when you reload.",
              )}
        </p>
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((value) => (
            <button
              key={value}
              className={theme === value ? "btn" : "btn-light"}
              type="button"
              aria-pressed={theme === value}
              onClick={() => onThemeChange(value)}
            >
              {value === "light" ? (
                <Sun size={16} aria-hidden="true" />
              ) : (
                <Moon size={16} aria-hidden="true" />
              )}
              {value === "light"
                ? t("Maliwanag", "Light")
                : t("Madilim", "Dark")}
            </button>
          ))}
        </div>
      </section>
      <section
        className="section-divider mt-6 pt-5 space-y-3"
        aria-label={t("Seguridad", "Security")}
      >
        <h3 className="font-semibold">{t("Seguridad", "Security")}</h3>
        <PasswordControl lang={lang} />
      </section>
    </Dialog>
  );
}

export function ProfileMenu({
  user,
  school,
  lang,
  theme,
  onThemeChange,
  themePersisted,
  onSaved,
  clearDrafts,
  onClearDrafts,
  onSignOut,
}: {
  user: SessionUser;
  school: string;
  lang: Language;
  theme: Theme;
  onThemeChange: (value: Theme) => void;
  themePersisted: boolean;
  onSaved: (value: SessionUser) => void;
  clearDrafts: boolean;
  onClearDrafts: (value: boolean) => void;
  onSignOut: () => void;
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [open, setOpen] = useState(false),
    [settings, setSettings] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      className="relative profile-menu"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="profile-trigger"
        aria-label={t("Buksan ang menu ng profile", "Open profile menu")}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <Avatar user={user} />
      </button>
      {open && (
        <div id={id} className="secondary-menu profile-dropdown">
          <div className="px-2 py-2 border-b border-slate-200 mb-1">
            <p className="font-semibold text-sm">{user.name}</p>
            <p className="text-xs text-slate-500">
              {user.role === "teacher"
                ? t("Guro", "Teacher")
                : t("Mag-aaral", "Student")}
            </p>
          </div>
          <button
            className="btn-light"
            onClick={() => {
              trigger.current?.focus();
              setOpen(false);
              setSettings(true);
            }}
          >
            <Settings size={17} aria-hidden="true" />
            {t("Mga setting ng profile", "Profile settings")}
          </button>
          <ThemeToggle theme={theme} onChange={onThemeChange} lang={lang} />
          {!themePersisted && (
            <p role="status" className="text-xs p-2">
              {t(
                "Nailapat ang tema. Hindi ito maaalala dahil hindi magagamit ang browser storage.",
                "Theme applied. Browser storage is unavailable, so it may reset when you reload.",
              )}
            </p>
          )}
          <PrivacyNotice lang={lang} />
          <label className="flex items-start gap-2 text-sm p-2">
            <input
              type="checkbox"
              checked={clearDrafts}
              onChange={(event) => onClearDrafts(event.target.checked)}
            />
            {t(
              "Linisin ang sariling draft sa pag-sign out (shared device).",
              "Clear my local drafts on sign-out (shared device).",
            )}
          </label>
          <button className="btn-light" onClick={onSignOut}>
            <LogOut size={17} aria-hidden="true" />
            {t("Mag-sign out", "Sign out")}
          </button>
        </div>
      )}
      {settings && (
        <ProfileSettings
          key={user.id}
          user={user}
          school={school}
          lang={lang}
          onSaved={onSaved}
          onClose={() => {
            setSettings(false);
            trigger.current?.focus();
          }}
          theme={theme}
          onThemeChange={onThemeChange}
          themePersisted={themePersisted}
        />
      )}
    </div>
  );
}
