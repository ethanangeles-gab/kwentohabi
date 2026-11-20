import React, { useEffect, useState } from "react";
import { api } from "../utils/client";
import { Dialog } from "./Dialog";
export function PrivacyNotice({
  lang,
  compact = false,
}: {
  lang: "tl" | "en";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [notice, setNotice] = useState<{
      version: string;
      en: string[];
      tl: string[];
    } | null>(null),
    [error, setError] = useState("");
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  useEffect(() => {
    if (open)
      api("/api/privacy")
        .then(setNotice)
        .catch((e) => setError(e.message));
  }, [open]);
  return (
    <>
      <button
        type="button"
        className={
          compact ? "text-sm underline underline-offset-4" : "btn-light"
        }
        onClick={() => setOpen(true)}
      >
        {t("Privacy at abiso sa guardian", "Privacy & guardian notice")}
      </button>
      {open && (
        <Dialog
          title={t("Privacy at abiso sa guardian", "Privacy & guardian notice")}
          onClose={() => setOpen(false)}
        >
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {notice ? (
            <div className="space-y-4 text-sm">
              <p className="font-semibold">
                {t("Bersyon ng abiso", "Notice version")}: {notice.version}
              </p>
              {notice[lang].map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p role="status">{t("Binubuksan ang abiso…", "Loading notice…")}</p>
          )}
        </Dialog>
      )}
    </>
  );
}
