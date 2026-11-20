import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FileText, Pencil, X } from "lucide-react";

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
 * Standalone mascots are keyboard-accessible animation buttons. Small status
 * icons stay decorative to avoid nesting buttons. Facing follows the mascot's
 * position in the viewport; a separate wrapper preserves it during animation.
 * All motion lives in index.css and stops under prefers-reduced-motion.
 */
export type MayakdaPose = "nest" | "weave" | "notice" | "quiet";

const SRC = "/assets/brand/mayakda.webp";
const WIDTH = 431;
const HEIGHT = 487;
const MESSAGES = {
  en: [
    "Hi! I'm Mayakda, your friendly writing companion. Let's weave a story together!",
    "One sentence at a time. Your next idea doesn't have to be perfect to begin.",
    "Your ideas make this story yours. Keep exploring, little by little!",
    "A little encouragement goes a long way. Let's help a story grow today!",
    "Take a breath and try a little 'what if?' A new possibility might be waiting.",
  ],
  tl: [
    "Kumusta! Ako si Mayakda, ang kaibigan mo sa pagsusulat. Maghabi tayo ng kuwento!",
    "Isang pangungusap muna. Hindi kailangang perpekto ang ideya para makapagsimula.",
    "Ang mga ideya mo ang nagbibigay-buhay sa kuwento. Patuloy lang sa pagtuklas!",
    "Malaking tulong ang kaunting paghikayat. Sama-sama nating palaguin ang kuwento!",
    "Huminga muna at magtanong ng 'paano kung?' Baka may bagong ideyang naghihintay.",
  ],
};

export function Mayakda({
  pose = "nest",
  size = 96,
  className = "",
  interactive = true,
  label,
  lang = "en",
  speechPlacement = "auto",
}: {
  pose?: MayakdaPose;
  /** Rendered width in pixels; height follows the artwork's proportions. */
  size?: number;
  className?: string;
  /** Disable for decorative status icons, especially inside other buttons. */
  interactive?: boolean;
  label?: string;
  lang?: "tl" | "en";
  /** Prefer a side, falling back vertically when the bubble cannot fit. */
  speechPlacement?: "auto" | "left" | "right";
}) {
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const speech = useRef<HTMLDivElement>(null);
  const speechId = useId();
  const [facing, setFacing] = useState("right");
  const [reaction, setReaction] = useState(0);
  const [reacting, setReacting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(-1);
  const [speechPosition, setSpeechPosition] = useState<{
    top: number;
    left: number;
    arrow: number;
    placement: "above" | "below" | "left" | "right";
  } | null>(null);
  const open = interactive && messageIndex >= 0;
  const message = open ? MESSAGES[lang][messageIndex] : "";
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      if (!root.current || !speech.current) return;
      const anchor = root.current.getBoundingClientRect();
      if (
        anchor.width <= 0 ||
        anchor.height <= 0 ||
        anchor.bottom <= 0 ||
        anchor.top >= innerHeight ||
        anchor.right <= 0 ||
        anchor.left >= innerWidth
      ) {
        setMessageIndex(-1);
        setSpeechPosition(null);
        return;
      }
      const rightSpace = innerWidth - anchor.right - 32;
      speech.current.style.setProperty(
        "--speech-width",
        `${speechPlacement === "right" && rightSpace >= 208 ? Math.min(288, rightSpace) : 288}px`,
      );
      const bubble = speech.current.getBoundingClientRect();
      const sideLeft =
        speechPlacement === "left"
          ? anchor.left - bubble.width - 20
          : anchor.right + 20;
      const fitsSide =
        sideLeft >= 12 && sideLeft + bubble.width <= innerWidth - 12;
      if (speechPlacement !== "auto" && fitsSide) {
        const centerY = anchor.top + anchor.height / 2;
        const top = Math.max(
          12,
          Math.min(
            centerY - bubble.height / 2,
            innerHeight - bubble.height - 12,
          ),
        );
        setSpeechPosition({
          left: sideLeft,
          top,
          arrow: Math.max(16, Math.min(centerY - top, bubble.height - 16)),
          placement: speechPlacement,
        });
        return;
      }
      const center = anchor.left + anchor.width / 2;
      const left = Math.max(
        12,
        Math.min(center - bubble.width / 2, innerWidth - bubble.width - 12),
      );
      const above = anchor.top - bubble.height - 12;
      setSpeechPosition({
        left,
        top: Math.max(
          12,
          Math.min(
            above >= 12 ? above : anchor.bottom + 12,
            innerHeight - bubble.height - 12,
          ),
        ),
        arrow: Math.max(16, Math.min(center - left, bubble.width - 16)),
        placement: above >= 12 ? "above" : "below",
      });
    };
    update();
    const observer = new ResizeObserver(update);
    if (speech.current) observer.observe(speech.current);
    if (root.current) observer.observe(root.current);
    // Also handle mascots clipped by a scrolling ancestor rather than the window.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry.isIntersecting ||
          entry.intersectionRect.width <= 0 ||
          entry.intersectionRect.height <= 0
        ) {
          setMessageIndex(-1);
          setSpeechPosition(null);
        }
      },
      { threshold: [0, Number.EPSILON] },
    );
    if (root.current) visibility.observe(root.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => {
      observer.disconnect();
      visibility.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, message, speechPlacement]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !speech.current?.contains(target))
        setMessageIndex(-1);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMessageIndex(-1);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const update = () => {
      const bounds = element.getBoundingClientRect();
      setFacing(
        bounds.left + bounds.width / 2 > innerWidth / 2 ? "left" : "right",
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observer.observe(document.documentElement);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, []);
  useEffect(() => {
    if (!reaction) return;
    // A timer also clears the feedback when reduced motion disables animation.
    const timer = window.setTimeout(() => setReacting(false), 750);
    return () => window.clearTimeout(timer);
  }, [reaction]);
  const artwork = (
    <span className="mk-facing" aria-hidden="true">
      <span className="mk-reaction" key={reaction}>
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
        {interactive && reacting && (
          <span className="mk-writing-tools">
            <Pencil className="mk-pencil" focusable="false" />
            <FileText className="mk-paper" focusable="false" />
          </span>
        )}
      </span>
    </span>
  );
  return (
    <span
      ref={root}
      className={`mayakda mayakda-${pose}${interactive && reacting ? " mayakda-is-reacting" : ""} ${className}`.trim()}
      style={{ width: size }}
      data-facing={facing}
      aria-hidden={interactive ? undefined : true}
    >
      {interactive ? (
        <button
          ref={trigger}
          type="button"
          className="mayakda-trigger"
          aria-label={label || t("Kausapin si Mayakda", "Say hello to Mayakda")}
          title={
            open
              ? undefined
              : label || t("Kausapin si Mayakda", "Say hello to Mayakda")
          }
          aria-expanded={open}
          aria-controls={open ? speechId : undefined}
          onClick={() => {
            setReaction((value) => value + 1);
            setReacting(true);
            setMessageIndex((value) => (value + 1) % MESSAGES[lang].length);
          }}
        >
          {artwork}
        </button>
      ) : (
        artwork
      )}
      {open &&
        createPortal(
          <div
            ref={speech}
            id={speechId}
            className="mayakda-speech"
            role="region"
            aria-label={t("Mensahe ni Mayakda", "Mayakda's message")}
            data-placement={speechPosition?.placement}
            style={
              {
                top: speechPosition?.top ?? 0,
                left: speechPosition?.left ?? 0,
                visibility: speechPosition ? "visible" : "hidden",
                "--speech-arrow": `${speechPosition?.arrow ?? 24}px`,
              } as React.CSSProperties
            }
          >
            <div className="mayakda-speech-heading">
              <span>Mayakda</span>
              <button
                type="button"
                aria-label={t(
                  "Isara ang mensahe ni Mayakda",
                  "Close Mayakda's message",
                )}
                onClick={() => {
                  setMessageIndex(-1);
                  trigger.current?.focus();
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <p role="status" aria-atomic="true">
              {message}
            </p>
          </div>,
          document.body,
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
  lang = "en",
}: {
  pose: MayakdaPose;
  size?: number;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  role?: "status";
  lang?: "tl" | "en";
}) {
  return (
    <div className={`mayakda-note ${className}`.trim()} role={role}>
      <Mayakda pose={pose} size={size} lang={lang} />
      <div className="min-w-0 space-y-1">
        {title && <p className="mayakda-note-title">{title}</p>}
        {children && <div className="text-sm text-slate-600">{children}</div>}
      </div>
    </div>
  );
}
