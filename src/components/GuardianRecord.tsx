import React, { useEffect, useState } from "react";
import { api } from "../utils/client";
import { Dialog } from "./Dialog";
import type { ConsentRecord, SessionUser } from "../types";
import { PrivacyNotice } from "./PrivacyNotice";
export function GuardianRecord({
  user,
  lang,
  onSaved,
}: {
  user: SessionUser;
  lang: "tl" | "en";
  onSaved: () => Promise<void>;
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const [open, setOpen] = useState(false),
    [record, setRecord] = useState<ConsentRecord | null>(null),
    [version, setVersion] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open)
      api("/api/consents")
        .then((result) => {
          setVersion(result.notice.version);
          setRecord(result.records[user.id]);
        })
        .catch((e) => setError(e.message));
  }, [open, user.id]);
  return (
    <>
      <button
        className="btn-light"
        onClick={() => {
          setOpen(true);
          setError("");
        }}
      >
        {t("Abiso / pahintulot", "Notice / consent")}:{" "}
        {user.consentStatus === "recorded"
          ? t("Naitala", "Recorded")
          : user.consentStatus === "not-required"
            ? t("Hindi kailangan", "Not required")
            : user.consentStatus === "declined"
              ? t("Hindi pinayagan", "Declined")
              : t("Nakabinbin", "Pending")}
      </button>
      {open && (
        <Dialog
          title={`${t("Tala ng paaralan", "School authorization record")}: ${user.name}`}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-4">
            <PrivacyNotice lang={lang} />
            <p className="text-sm">
              {t(
                "Itala ang pasya at reference ng paaralan. Hindi ito awtomatikong nagpapadala sa guardian o nagpapatunay ng legal na pahintulot.",
                "Record the school’s decision and reference. This does not automatically contact a guardian or verify legal sufficiency.",
              )}
            </p>
            {record && (
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    await api(`/api/users/${user.id}/consent`, {
                      ...record,
                      noticeVersion: version,
                    });
                    await onSaved();
                    setOpen(false);
                  } catch (error: any) {
                    setError(error.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="field">
                  {t("Pasya ng paaralan", "School decision")}
                  <select
                    aria-label={t("Pasya ng paaralan", "School decision")}
                    value={record.status}
                    onChange={(e) =>
                      setRecord({
                        ...record,
                        status: e.target.value as ConsentRecord["status"],
                      })
                    }
                  >
                    <option value="pending">
                      {t("Nakabinbin ang pagsusuri", "Pending school review")}
                    </option>
                    <option value="recorded">
                      {t("Naitala ang pahintulot", "Authorization recorded")}
                    </option>
                    <option value="declined">
                      {t("Hindi pinayagan", "Declined")}
                    </option>
                    <option value="not-required">
                      {t(
                        "Hindi kailangan (may dahilan)",
                        "Not required (reason recorded)",
                      )}
                    </option>
                  </select>
                </label>
                <label className="field">
                  {t(
                    "Reference ng abiso/pahintulot o dahilan",
                    "Notice/consent reference or reason",
                  )}
                  <textarea
                    aria-label={t(
                      "Reference ng abiso/pahintulot o dahilan",
                      "Notice/consent reference or reason",
                    )}
                    minLength={
                      ["recorded", "not-required"].includes(record.status)
                        ? 6
                        : 0
                    }
                    required={["recorded", "not-required"].includes(
                      record.status,
                    )}
                    maxLength={500}
                    value={record.reference}
                    onChange={(e) =>
                      setRecord({ ...record, reference: e.target.value })
                    }
                  />
                </label>
                <p className="text-xs text-slate-600">
                  {t(
                    "Gumamit ng internal record ID; huwag maglagay ng hindi kailangang personal na impormasyon ng guardian.",
                    "Use an internal record ID; avoid unnecessary guardian personal information.",
                  )}
                </p>
                <button className="btn" disabled={busy}>
                  {t("I-save ang tala", "Save school record")}
                </button>
              </form>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
