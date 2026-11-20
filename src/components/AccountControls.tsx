import React, { useState } from "react";
import { api } from "../utils/client";
import { GuardianRecord } from "./GuardianRecord";
import { Dialog } from "./Dialog";
import { InvitationControl } from "./InvitationControl";
import { ACCOUNT_IDENTIFIER_MAX_LENGTH } from "../utils/accountIdentifier";
import type { SessionUser } from "../types";

export function PasswordControl({ lang }: { lang: "tl" | "en" }) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  return (
    <>
      <button
        className="btn-light"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError("");
        }}
      >
        {t("Palitan ang password", "Change password")}
      </button>
      {open && (
        <Dialog
          title={t("Palitan ang password", "Change password")}
          onClose={() => setOpen(false)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget,
                data = new FormData(form);
              setBusy(true);
              setError("");
              try {
                await api("/api/password", {
                  currentPassword: data.get("current"),
                  newPassword: data.get("next"),
                });
                form.reset();
                setDone(true);
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              {t("Kasalukuyang password", "Current password")}
              <input
                type="password"
                name="current"
                required
                autoComplete="current-password"
              />
            </label>
            <label className="field">
              {t(
                "Bagong password · 12 o higit na karakter",
                "New password · at least 12 characters",
              )}
              <input
                type="password"
                name="next"
                minLength={12}
                maxLength={128}
                required
                autoComplete="new-password"
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {done && (
              <p role="status" className="notice">
                {t(
                  "Napalitan ang password. Na-sign out ang ibang session.",
                  "Password changed. Other sessions were signed out.",
                )}
              </p>
            )}
            <button className="btn" disabled={busy}>
              {t("I-save ang password", "Save password")}
            </button>
          </form>
        </Dialog>
      )}
    </>
  );
}

export function ClassRoster({
  users,
  classId,
  refresh,
  lang,
}: {
  users: SessionUser[];
  classId: string;
  refresh: () => Promise<void>;
  lang: "tl" | "en";
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [credential, setCredential] = useState<{
      username: string;
      password: string;
    } | null>(null);
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <h3 className="font-serif text-xl font-bold">
          {t("Talaan ng klase", "Class roster")} · {classId}
        </h3>
        <div className="flex flex-wrap gap-2">
          <InvitationControl classId={classId} lang={lang} />
          <button
            className="btn-light"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            {t("Magdagdag ng mag-aaral", "Add student")}
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {t(
          "Ang mga bagong mag-aaral ay kailangang idagdag sa isang bagong nakabahaging gawain upang makasali. Ibahagi nang pribado ang account sa tamang mag-aaral.",
          "Add new students to a new shared assignment to include them. Share account details privately with the assigned student.",
        )}
      </p>
      {users
        .filter((u) => u.role === "student" && u.classIds.includes(classId))
        .map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2"
          >
            <span className="font-semibold text-sm">
              {u.name}
              {u.isDemo && (
                <span className="badge ml-2">
                  {t("Kathang-isip", "Fictional")}
                </span>
              )}
            </span>
            <GuardianRecord user={u} lang={lang} onSaved={refresh} />
            <button
              className="btn-light"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await api(
                    `/api/users/${u.id}/reset-password`,
                    {},
                  );
                  setCredential(result);
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("Bagong password", "Reset password")}
            </button>
          </div>
        ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {open && (
        <Dialog
          title={t("Magdagdag ng mag-aaral", "Add student")}
          onClose={() => setOpen(false)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setBusy(true);
              setError("");
              try {
                const result = await api("/api/users", {
                  name: data.get("name"),
                  username: data.get("username"),
                  classId,
                });
                await refresh();
                setOpen(false);
                setCredential(result);
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              {t("Pangalan", "Student name")}
              <input required name="name" maxLength={200} />
            </label>
            <label className="field">
              Username / Email
              <input
                required
                name="username"
                minLength={3}
                maxLength={ACCOUNT_IDENTIFIER_MAX_LENGTH}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <p className="text-sm">
              {t("Klase", "Class")}: {classId}
            </p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="btn" disabled={busy}>
              {t("Lumikha ng account", "Create student account")}
            </button>
          </form>
        </Dialog>
      )}
      {credential && (
        <Dialog
          title={t("Pribadong detalye ng account", "Private account details")}
          onClose={() => setCredential(null)}
        >
          <p className="text-sm mb-4">
            {t(
              "Itabi bago isara. Ipinapakita nang isang beses lamang.",
              "Save before closing. Shown only once.",
            )}
          </p>
          <p className="select-all font-mono text-sm">
            {credential.username}
            <br />
            {credential.password}
          </p>
        </Dialog>
      )}
    </section>
  );
}
