import React, { useState } from "react";
import type { SessionUser, StoryWorkspace, WikiEntry } from "../types";
import { Dialog } from "./Dialog";
const categories: WikiEntry["category"][] = [
  "character",
  "location",
  "object",
  "event",
  "relationship",
  "rule",
];
export function WikiProfiles({
  story,
  user,
  users,
  action,
  lang,
}: {
  story: StoryWorkspace;
  user: SessionUser;
  users: SessionUser[];
  action: (kind: string, payload: any) => Promise<StoryWorkspace>;
  lang: "tl" | "en";
}) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  const label = (category: WikiEntry["category"]) =>
    ({
      character: t("Mga tauhan", "Characters"),
      location: t("Mga lugar", "Locations"),
      object: t("Mahahalagang bagay", "Important objects"),
      event: t("Mga pangyayari", "Events"),
      relationship: t("Mga ugnayan", "Relationships"),
      rule: t("Tuntunin at konteksto", "Story rules & background"),
    })[category];
  const [filter, setFilter] = useState("all"),
    [editing, setEditing] = useState<Partial<WikiEntry> | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const entries = story.wikiEntries || [],
    canWrite = user.role === "teacher" || story.status === "active";
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            {t("Binuo ng mga may-akda", "Written by your group")}
          </p>
          <h3 className="text-xl font-serif font-bold">
            {t("Ang mundo ng kuwento", "Your story world")}
          </h3>
        </div>
        {canWrite && (
          <button
            className="btn-light"
            onClick={() => {
              setEditing({
                category: "character",
                name: "",
                description: "",
                details: "",
                chapterIds: [],
              });
              setError("");
            }}
          >
            {t("Magdagdag ng profile", "Add story profile")}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className={filter === "all" ? "btn" : "btn-light"}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          {t("Lahat", "All")}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            aria-pressed={filter === category}
            className={filter === category ? "btn" : "btn-light"}
            onClick={() => setFilter(category)}
          >
            {label(category)}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries
          .filter((entry) => filter === "all" || entry.category === filter)
          .map((entry) => (
            <article key={entry.id} className="card space-y-3">
              <div className="flex items-start gap-3">
                <div aria-hidden="true" className="profile-initial">
                  {entry.name.slice(0, 1)}
                </div>
                <div>
                  <p className="eyebrow">{label(entry.category)}</p>
                  <h4 className="font-serif text-xl font-bold">{entry.name}</h4>
                </div>
              </div>
              <p className="text-sm text-slate-700">{entry.description}</p>
              {entry.details && (
                <details>
                  <summary className="text-sm font-semibold cursor-pointer">
                    {t(
                      "Ugnayan, papel at mga detalye",
                      "Relationships, role & details",
                    )}
                  </summary>
                  <p className="text-sm whitespace-pre-wrap mt-2">
                    {entry.details}
                  </p>
                </details>
              )}
              <p className="text-xs text-slate-600">
                {t("Itinala ni", "Recorded by")}{" "}
                {users.find((u) => u.id === entry.createdBy)?.name ||
                  entry.createdBy}
              </p>
              <p className="text-xs text-slate-600">
                {t("Sanggunian", "Sources")}:{" "}
                {entry.chapterIds
                  .map(
                    (id) =>
                      story.chapters.find((ch) => ch.id === id)?.title || id,
                  )
                  .join("; ") ||
                  t(
                    "Walang kabanatang naiuugnay",
                    "No source chapter attached",
                  )}
              </p>
              {canWrite &&
                (user.role === "teacher" || entry.createdBy === user.id) && (
                  <button
                    className="btn-light"
                    onClick={() => {
                      setEditing(structuredClone(entry));
                      setError("");
                    }}
                  >
                    {t("Baguhin ang profile", "Edit profile")}
                  </button>
                )}
            </article>
          ))}
      </div>
      {!entries.length && (
        <p className="card text-slate-600 text-sm">
          {t(
            "Magsimula sa isang tauhan o lugar. Ang profile ay tala ng pangkat, hindi awtomatikong katotohanan mula sa AI.",
            "Start with a character or setting. Profiles are group-authored notes, separate from automatically extracted evidence.",
          )}
        </p>
      )}
      {editing && (
        <Dialog
          title={t("Profile ng kuwento", "Story profile")}
          onClose={() => setEditing(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await action("wiki-save", { entry: editing });
                setEditing(null);
              } catch (error: any) {
                setError(error.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              {t("Kategorya", "Category")}
              <select
                aria-label={t("Kategorya ng profile", "Profile category")}
                value={editing.category}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    category: e.target.value as WikiEntry["category"],
                  })
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {label(category)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {t("Pangalan", "Name")}
              <input
                required
                maxLength={200}
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label className="field">
              {t("Paglalarawan", "Description")}
              <textarea
                aria-label={t("Paglalarawan ng profile", "Profile description")}
                required
                maxLength={3000}
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </label>
            <label className="field">
              {t(
                "Papel, personalidad, ugnayan at pangyayari",
                "Role, personality, relationships & events",
              )}
              <textarea
                aria-label={t("Mga detalye ng profile", "Profile details")}
                maxLength={5000}
                value={editing.details}
                onChange={(e) =>
                  setEditing({ ...editing, details: e.target.value })
                }
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="font-semibold mb-2">
                {t("Mga kabanatang pinagmulan", "Source chapters")}
              </legend>
              {story.chapters.map((ch) => (
                <label className="flex gap-2 text-sm" key={ch.id}>
                  <input
                    type="checkbox"
                    checked={editing.chapterIds?.includes(ch.id) || false}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        chapterIds: e.target.checked
                          ? [...(editing.chapterIds || []), ch.id]
                          : (editing.chapterIds || []).filter(
                              (id) => id !== ch.id,
                            ),
                      })
                    }
                  />
                  {ch.title}
                </label>
              ))}
            </fieldset>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="btn" disabled={busy}>
              {t("I-save ang profile", "Save story profile")}
            </button>
          </form>
        </Dialog>
      )}
    </section>
  );
}
