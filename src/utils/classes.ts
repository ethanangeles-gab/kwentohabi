const CLASS_LABELS: Record<string, { tl: string; en: string }> = {
  mabini: { tl: "Grade 9 – Seksyon Mabini", en: "Grade 9 – Mabini Section" },
  rizal: { tl: "Grade 10 – Seksyon Rizal", en: "Grade 10 – Rizal Section" },
};

/** Human-readable class name for a stored class id. */
export function classLabel(id: string, lang: "tl" | "en") {
  return CLASS_LABELS[id]?.[lang] || id;
}
