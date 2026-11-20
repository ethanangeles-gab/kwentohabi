import React, { useState } from "react";
import { api } from "../utils/client";
import type { SessionUser } from "../types";
import { PrivacyNotice } from "./PrivacyNotice";
import {
  ACCOUNT_IDENTIFIER_MAX_LENGTH,
  isValidAccountIdentifier,
} from "../utils/accountIdentifier";

const RequiredMark = () => (
  <span className="required-mark" aria-hidden="true">
    *
  </span>
);

export function RegistrationForm({
  lang,
  initialRole,
  onBack,
  onRegistered,
}: {
  lang: "tl" | "en";
  initialRole: "" | "teacher" | "student";
  onBack: () => void;
  onRegistered: (user: SessionUser) => Promise<void>;
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [role, setRole] = useState(initialRole),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl font-bold">
        {t("Gumawa ng account", "Create account")}
      </h2>
      <p className="text-sm text-slate-600">
        {t(
          "Punan ang form upang gumawa ng bagong account.",
          "Fill in the form to create a new account.",
        )}{" "}
        {t("Kailangan ang mga field na may", "Fields marked with")}{" "}
        <RequiredMark />
        {t(".", " are required.")}
      </p>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setError("");
          if (!isValidAccountIdentifier(data.get("username"))) {
            setError(
              t(
                "Maglagay ng wastong email address o username na may 3–80 titik, numero, tuldok, underscore o gitling.",
                "Enter a valid email address or a username with 3-80 letters, digits, dots, underscores, or hyphens.",
              ),
            );
            event.currentTarget
              .querySelector<HTMLInputElement>('[name="username"]')
              ?.focus();
            return;
          }
          if (data.get("password") !== data.get("confirmPassword")) {
            setError(
              t(
                "Hindi magkatugma ang mga password.",
                "Passwords do not match.",
              ),
            );
            return;
          }
          setBusy(true);
          try {
            const result = await api<{ user: SessionUser }>("/api/register", {
              name: data.get("name"),
              username: data.get("username"),
              password: data.get("password"),
              confirmPassword: data.get("confirmPassword"),
              role,
              ...(role === "student" ? { classId: data.get("classId") } : {}),
              privacyAccepted: data.get("privacy") === "on",
            });
            await onRegistered(result.user);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          <span>
            {t("Uri ng account", "Account type")} <RequiredMark />
          </span>
          <select
            required
            value={role}
            disabled={busy}
            onChange={(e) => {
              setRole(e.target.value as typeof role);
              setError("");
            }}
          >
            <option value="" disabled>
              {t("Pumili ng tungkulin", "Choose a role")}
            </option>
            <option value="student">{t("Mag-aaral", "Student")}</option>
            <option value="teacher">{t("Guro", "Teacher")}</option>
          </select>
        </label>
        <label className="field">
          <span>
            {t("Buong pangalan", "Full name")} <RequiredMark />
          </span>
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={200}
            disabled={busy}
          />
        </label>
        <label className="field">
          <span>
            Username / Email <RequiredMark />
          </span>
          <input
            name="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={ACCOUNT_IDENTIFIER_MAX_LENGTH}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={busy}
            aria-describedby="registration-username-help"
          />
        </label>
        <p id="registration-username-help" className="text-xs text-slate-500">
          {t(
            "Wastong email address, o username na may 3–80 titik, numero, tuldok, underscore o gitling.",
            "A valid email address, or a username with 3–80 letters, digits, dots, underscores or hyphens.",
          )}
        </p>
        {role === "student" && (
          <label className="field">
            <span>
              {t("Klase", "Class")} <RequiredMark />
            </span>
            <select name="classId" required defaultValue="" disabled={busy}>
              <option value="" disabled>
                {t("Pumili ng klase", "Choose your class")}
              </option>
              <option value="mabini">Grade 9 - Seksyon Mabini</option>
              <option value="rizal">Grade 9 - Seksyon Rizal</option>
            </select>
          </label>
        )}
        <label className="field">
          <span>
            Password <RequiredMark />
          </span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            disabled={busy}
            aria-describedby="registration-password-help"
          />
        </label>
        <p id="registration-password-help" className="text-xs text-slate-500">
          {t(
            "Gumamit ng hindi bababa sa 12 karakter.",
            "Use at least 12 characters.",
          )}
        </p>
        <label className="field">
          <span>
            {t("Ulitin ang password", "Confirm password")} <RequiredMark />
          </span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            disabled={busy}
          />
        </label>
        <PrivacyNotice lang={lang} compact />
        <label className="flex items-start gap-2 text-sm">
          <input name="privacy" type="checkbox" required disabled={busy} />
          <span>
            {t(
              "Nabasa ko ang privacy at abiso sa guardian.",
              "I have read the privacy and guardian notice.",
            )}{" "}
            <RequiredMark />
          </span>
        </label>
        <p className="text-xs text-slate-500">
          {t(
            "Hiwalay pa ring itinatala ng paaralan ang kinakailangang pasya sa pahintulot.",
            "Your school separately records any required guardian authorization.",
          )}
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="btn w-full" disabled={busy}>
          {busy
            ? t("Ginagawa ang account…", "Creating account…")
            : t("Gumawa ng account", "Create account")}
        </button>
        <button
          type="button"
          className="btn-light w-full"
          disabled={busy}
          onClick={onBack}
        >
          {t("Bumalik sa pag-sign in", "Back to sign in")}
        </button>
      </form>
    </section>
  );
}
