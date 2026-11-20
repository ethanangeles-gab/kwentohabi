import React from "react";

/**
 * Mayakda — maya (the Philippine tree sparrow) + akda (a literary work),
 * also read as "may-akda" (author). A helper, never the writer: it carries
 * the student's pages and points at details worth a second look.
 *
 * The artwork is public/assets/brand/mayakda.webp. Poses are motion only:
 *  - nest:   a happy hop (empty states, login)
 *  - weave:  a busy waddle (saving / loading)
 *  - notice: a curious head tilt with a glint (continuity checks)
 *  - quiet:  slow breathing, slightly muted (teacher-review screens)
 *
 * The image is decorative (empty alt, aria-hidden); the words beside it carry
 * the meaning. All motion lives in index.css and stops under
 * prefers-reduced-motion.
 */
export type MayakdaPose = "nest" | "weave" | "notice" | "quiet";

const SRC = "/assets/brand/mayakda.webp";
const WIDTH = 431;
const HEIGHT = 487;

export function Mayakda({
  pose = "nest",
  size = 96,
  className = "",
}: {
  pose?: MayakdaPose;
  /** Rendered width in pixels; height follows the artwork's proportions. */
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`mayakda mayakda-${pose} ${className}`.trim()}
      style={{ width: size }}
      aria-hidden="true"
    >
      <img
        className="mk-img"
        src={SRC}
        alt=""
        width={WIDTH}
        height={HEIGHT}
        decoding="async"
        draggable={false}
      />
      {pose === "notice" && (
        <svg className="mk-glint" viewBox="0 0 24 24" focusable="false">
          <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 3v6" />
            <path d="M20 7l-4 4" />
            <path d="M4 7l4 4" />
          </g>
        </svg>
      )}
    </span>
  );
}

/** Mayakda beside a short message, laid out as a quiet callout. */
export function MayakdaNote({
  pose,
  size = 72,
  title,
  children,
  className = "",
  role,
}: {
  pose: MayakdaPose;
  size?: number;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  role?: "status";
}) {
  return (
    <div className={`mayakda-note ${className}`.trim()} role={role}>
      <Mayakda pose={pose} size={size} />
      <div className="min-w-0 space-y-1">
        {title && <p className="mayakda-note-title">{title}</p>}
        {children && <div className="text-sm text-slate-600">{children}</div>}
      </div>
    </div>
  );
}
