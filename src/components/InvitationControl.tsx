import React, { useState } from "react";
import { api } from "../utils/client";
import { Dialog } from "./Dialog";

type Invitation = {
  id: string;
  classId: string;
  role: "teacher" | "student";
  expiresAt: string;
  maxUses: number;
  uses: number;
  status: "active" | "used" | "expired" | "revoked";
};
export function InvitationControl({
  classId,
  lang,
}: {
  classId: string;
  lang: "tl" | "en";
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [items, setItems] = useState<Invitation[]>([]);
  const [role, setRole] = useState<"student" | "teacher">("student"),
    [uses, setUses] = useState(30),
    [latest, setLatest] = useState<{
      code: string;
      invitation: Invitation;
    } | null>(null),
    [copyNotice, setCopyNotice] = useState("");
  const load = async () => {
    const result = await api<{ invitations: Invitation[] }>(
      `/api/invitations?classId=${encodeURIComponent(classId)}`,
    );
    setItems(result.invitations);
  };
  const roleName = (value: string) =>
    value === "teacher" ? t("Guro", "Teacher") : t("Mag-aaral", "Student");
  const stateName = (value: Invitation["status"]) =>
    value === "active"
      ? t("Aktibo", "Active")
      : value === "used"
        ? t("Naubos na", "Fully used")
        : value === "expired"
          ? t("Nag-expire", "Expired")
          : t("Binawi", "Revoked");
  return (
    <>
      <button
        type="button"
        className="btn-light"
        onClick={async () => {
          setOpen(true);
          setLatest(null);
          setCopyNotice("");
          setError("");
          setBusy(true);
          try {
            await load();
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("Mga join code", "Join codes")}
      </button>
      {open && (
        <Dialog
          title={t("Mga join code ng klase", "Class join codes")}
          onClose={() => setOpen(false)}
        >
          <p className="text-sm text-slate-600 mb-4">
            {t("Klase", "Class")}: {classId}.{" "}
            {t(
              "Gagamitin ang code sa Create account. May bisa nang 7 araw.",
              "Use the code on Create account. Codes expire after 7 days.",
            )}
          </p>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              setCopyNotice("");
              try {
                const result = await api<{
                  invitation: Invitation;
                  code: string;
                }>("/api/invitations", {
                  classId,
                  role,
                  maxUses: role === "teacher" ? 1 : uses,
                });
                setLatest(result);
                await load();
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              {t("Tungkulin ng inimbitahan", "Invite as")}
              <select
                value={role}
                disabled={busy}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <option value="student">{t("Mag-aaral", "Student")}</option>
                <option value="teacher">{t("Guro", "Teacher")}</option>
              </select>
            </label>
            <label className="field">
              {t("Bilang ng bagong account", "Number of new accounts")}
              <input
                type="number"
                min={1}
                max={role === "teacher" ? 1 : 100}
                required
                value={role === "teacher" ? 1 : uses}
                disabled={busy || role === "teacher"}
                onChange={(e) => setUses(Number(e.target.value))}
              />
            </label>
            {role === "teacher" && (
              <p className="notice">
                {t(
                  "Isang guro lamang ang maaaring gumamit ng code. Makakapagrepaso siya ng mga sulatin at tala ng mag-aaral sa klaseng ito.",
                  "A teacher code admits one teacher, who can review this class's submissions and learner records.",
                )}
              </p>
            )}
            <button className="btn" disabled={busy}>
              {t("Gumawa ng join code", "Generate join code")}
            </button>
          </form>
          {error && (
            <p role="alert" className="error mt-4">
              {error}
            </p>
          )}
          {latest && (
            <section className="notice mt-5 space-y-3">
              <p className="font-semibold">
                {roleName(latest.invitation.role)} · {t("Hanggang", "Up to")}{" "}
                {latest.invitation.maxUses} {t("account", "accounts")}
              </p>
              <label className="field">
                {t("Bagong join code", "New join code")}
                <input
                  readOnly
                  value={latest.code}
                  className="font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
              <p className="text-sm">
                {t(
                  "Kopyahin bago isara. Isang beses lamang ipinapakita ang code. Ibahagi lamang sa nilalayong kasapi.",
                  "Copy before closing. The code is shown once; share it only with the intended class members.",
                )}
              </p>
              <button
                className="btn-light"
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(latest.code);
                    setCopyNotice(t("Nakopya ang code.", "Code copied."));
                  } catch {
                    setCopyNotice(
                      t(
                        "Piliin ang code at kopyahin gamit ang keyboard o menu ng device.",
                        "Select the code and copy it with your keyboard or device menu.",
                      ),
                    );
                  }
                }}
              >
                {t("Kopyahin ang code", "Copy code")}
              </button>
              {copyNotice && <p role="status">{copyNotice}</p>}
            </section>
          )}
          <section className="section-divider mt-6 pt-5 space-y-3">
            <h3 className="font-serif font-bold text-lg">
              {t("Mga code at paggamit", "Codes and usage")}
            </h3>
            {busy && (
              <p role="status" className="text-sm">
                {t("Ina-update…", "Updating…")}
              </p>
            )}
            {!items.length && !busy && (
              <p className="text-sm text-slate-500">
                {t("Wala pang join code.", "No join codes yet.")}
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 text-sm"
              >
                <div className="space-y-1">
                  <p className="font-semibold">
                    {roleName(item.role)} · {stateName(item.status)}
                  </p>
                  <p className="text-slate-500">
                    {item.uses}/{item.maxUses} {t("nagamit", "used")} ·{" "}
                    {t("May bisa hanggang", "Expires")}{" "}
                    {new Date(item.expiresAt).toLocaleDateString("en-PH", {
                      timeZone: "Asia/Manila",
                    })}
                  </p>
                </div>
                {item.status === "active" && (
                  <button
                    className="btn-light"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        await api(`/api/invitations/${item.id}/revoke`, {});
                        if (latest?.invitation.id === item.id) setLatest(null);
                        await load();
                      } catch (e: any) {
                        setError(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {t("Bawiin", "Revoke")}
                  </button>
                )}
              </div>
            ))}
          </section>
        </Dialog>
      )}
    </>
  );
}
