import React, { useState } from "react";
import type {
  StoryFact,
  Contradiction,
  Resolution,
  StoryWorkspace,
  SessionUser,
} from "../types";
import { WikiProfiles } from "./WikiProfiles";
import { AUTHORS } from "../data/initialData";
type Props = {
  facts: StoryFact[];
  contradictions: Contradiction[];
  resolutions: Record<string, Resolution>;
  storySummary: string;
  lang: "tl" | "en";
  story: StoryWorkspace;
  user: SessionUser;
  users: SessionUser[];
  action: (kind: string, payload: any) => Promise<StoryWorkspace>;
};
export function StoryWiki({
  facts,
  contradictions,
  resolutions,
  storySummary,
  lang,
  story,
  user,
  users,
  action,
}: Props) {
  const [search, setSearch] = useState("");
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const status = (f: StoryFact) => {
    const relevant = contradictions.filter(
      (c) =>
        [c.a, c.b].some(
          (s) =>
            s.chapter === f.chapterId &&
            s.author === f.authorId &&
            s.quote === f.quote &&
            s.value.toLowerCase() === f.value.toLowerCase(),
        ) &&
        c.subject.toLowerCase() === f.subject.toLowerCase() &&
        c.attribute === f.attribute,
    );
    if (!relevant.length) return t("Naitalang detalye", "Recorded fact");
    if (
      relevant.some(
        (c) => !resolutions[c.key] || resolutions[c.key].type === "teacher",
      )
    )
      return t("Para sa talakayan", "Needs discussion");
    if (
      relevant.some(
        (c) =>
          resolutions[c.key].outcome === "both" ||
          resolutions[c.key].type === "both",
      )
    )
      return t("Sinadyang pagkakaiba", "Intentional difference");
    return relevant.every(
      (c) =>
        resolutions[c.key].resolvedValue?.toLowerCase() ===
        f.value.toLowerCase(),
    )
      ? t("Pinagtibay", "Adopted")
      : t("Kailangan ng pag-align", "Needs alignment");
  };
  return (
    <section className="space-y-8">
      <WikiProfiles
        story={story}
        user={user}
        users={users}
        action={action}
        lang={lang}
      />
      <div className="section-divider" />
      <div className="card space-y-3">
        <h3 className="text-xl font-serif font-bold">
          {t("Mga detalye at pinagmulan", "Facts and source evidence")}
        </h3>
        {storySummary && <p className="text-sm">{storySummary}</p>}
        <p className="text-xs text-slate-500">
          {t(
            "Mga mungkahing detalye mula sa kasalukuyang pagsusuri. Balikan ang mga orihinal na sipi.",
            "Suggested facts from the latest check. Verify them against the original passages.",
          )}
        </p>
        <label className="field">
          {t(
            "Hanapin ang tauhan, detalye, o sipi",
            "Search character, detail, or quote",
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {facts
          .filter((f) =>
            `${f.subject} ${f.attribute} ${f.value} ${f.quote}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((f) => (
            <article key={f.id} className="card space-y-2">
              <div className="flex flex-wrap justify-between gap-2">
                <h4 className="font-bold">{f.subject}</h4>
                <span className="text-xs text-indigo-700 bg-indigo-50 rounded px-2 py-1">
                  {status(f)}
                </span>
              </div>
              <p className="text-sm">
                {f.attribute}: <b>{f.value}</b>
              </p>
              <blockquote className="font-serif text-slate-600 text-sm">
                “{f.quote}”
              </blockquote>
              <p className="text-xs text-slate-500">
                {users.find((u) => u.id === f.authorId)?.name ||
                  AUTHORS[f.authorId]?.name ||
                  f.authorId}{" "}
                · {f.chapterId}
              </p>
            </article>
          ))}
      </div>
      {facts.length === 0 && (
        <p className="card text-slate-500">
          {t(
            "Wala pang natukoy na detalye para sa kuwentong ito. Patakbuhin ang pagsusuri.",
            "No extracted facts for this story. Run a continuity check.",
          )}
        </p>
      )}
    </section>
  );
}
