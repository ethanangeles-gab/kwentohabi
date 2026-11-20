import React from "react";

/**
 * StoryDoodles — a faint, hand-drawn backdrop for the workspace: the tools and
 * heroes of storytelling (pencil, quill, ink pot, open book, book stack,
 * notebook, scroll, ABC block, speech bubble, magnifier, caped hero, hero mask,
 * lightning shield, comic burst, castle, crown, treasure map, moon, cloud,
 * idea bulb, paper plane, rocket, magic wand, needle-and-thread for "habi", a
 * little maya bird, hearts, and five-point stars).
 *
 * It is purely decorative: aria-hidden, pointer-events off, and painted
 * BEHIND every card (z-index -1 inside the isolated .app-shell), so it shows
 * only in the gaps and never sits on top of text. Items marked `wide` are
 * dropped on phones so small screens stay calm. Motion is a slow bob that
 * stops under prefers-reduced-motion (see index.css).
 */

type Tone = "ink" | "orange" | "gold" | "red";

type Doodle = {
  art: keyof typeof ART;
  /** Position as a percentage of the viewport. */
  x: number;
  y: number;
  /** Width in rem. */
  size: number;
  rotate?: number;
  tone: Tone;
  /** Hide below 640px. */
  wide?: boolean;
  float?: boolean;
  flip?: boolean;
};

/** Comic-book "POW" burst: 12 points around the centre. */
const burstPoints = Array.from({ length: 24 }, (_, i) => {
  const r = i % 2 === 0 ? 28 : 17;
  const a = (Math.PI * i) / 12 - Math.PI / 2;
  return `${(32 + r * Math.cos(a)).toFixed(1)},${(32 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

/** Five-point star. */
const starPoints = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 27 : 11;
  const a = (Math.PI * i) / 5 - Math.PI / 2;
  return `${(32 + r * Math.cos(a)).toFixed(1)},${(33 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

/** Each drawing lives on a 64×64 grid; strokes use currentColor. */
const ART = {
  pencil: (
    <g transform="rotate(-38 32 32)">
      <rect x="4" y="26" width="7" height="12" rx="2.5" className="sd-fill" />
      <rect x="4" y="26" width="7" height="12" rx="2.5" />
      <path d="M11 26h4v12h-4M15 26h29v12H15M15 32h29M44 26l14 6-14 6" />
      <path d="M53 30l5 2-5 2z" className="sd-solid" />
    </g>
  ),
  quill: (
    <>
      <path d="M55 5C39 7 23 21 17 43c10-3 24-13 38-38z" className="sd-fill" />
      <path d="M55 5C39 7 23 21 17 43c10-3 24-13 38-38zM17 43L55 5M17 43l-7 13M26 32l8-1M32 24l9-1M38 17l8-1" />
    </>
  ),
  book: (
    <>
      <path d="M32 18c-8-5-18-5-26-2v32c8-3 18-3 26 2 8-5 18-5 26-2V16c-8-3-18-3-26 2zM32 18v32" />
      <path d="M12 24h14M12 30h14M12 36h9M38 24h14M38 30h14M38 36h10" />
    </>
  ),
  bubble: (
    <>
      <path d="M11 13h42a5 5 0 015 5v21a5 5 0 01-5 5H29L17 54V44h-6a5 5 0 01-5-5V18a5 5 0 015-5z" />
      <circle cx="21" cy="28.5" r="2.6" className="sd-solid" />
      <circle cx="32" cy="28.5" r="2.6" className="sd-solid" />
      <circle cx="43" cy="28.5" r="2.6" className="sd-solid" />
    </>
  ),
  mask: (
    <>
      <path
        d="M5 28c0-9 11-11 19-6 4 2 6 4 8 4s4-2 8-4c8-5 19-3 19 6 0 11-11 15-19 10-4-2-6-4-8-4s-4 2-8 4C16 43 5 39 5 28z"
        className="sd-fill"
      />
      <path d="M5 28c0-9 11-11 19-6 4 2 6 4 8 4s4-2 8-4c8-5 19-3 19 6 0 11-11 15-19 10-4-2-6-4-8-4s-4 2-8 4C16 43 5 39 5 28z" />
      <ellipse cx="19" cy="29.5" rx="6" ry="3.6" />
      <ellipse cx="45" cy="29.5" rx="6" ry="3.6" />
    </>
  ),
  shield: (
    <>
      <path d="M32 6l22 8v16c0 14-10 24-22 28C20 54 10 44 10 30V14z" />
      <path d="M36 15L24 34h8l-4 15 14-21h-8l4-13z" className="sd-fill" />
      <path d="M36 15L24 34h8l-4 15 14-21h-8l4-13z" />
    </>
  ),
  bulb: (
    <>
      <path d="M32 12c-9 0-15 7-15 15 0 7 5 10 7 16h16c2-6 7-9 7-16 0-8-6-15-15-15z" className="sd-fill" />
      <path d="M32 12c-9 0-15 7-15 15 0 7 5 10 7 16h16c2-6 7-9 7-16 0-8-6-15-15-15zM25 48h14M27 54h10M32 2v4M50 9l-3 3M14 9l3 3M58 26h-4M6 26h4" />
    </>
  ),
  plane: (
    <>
      <path d="M8 31L58 9 45 53 33 38zM58 9L33 38l-3 12 3-12" />
      <path d="M4 52c5-5 10 1 15-3" strokeDasharray="3 4" />
    </>
  ),
  rocket: (
    <>
      <path d="M28 46l4 11 4-11z" className="sd-solid" />
      <path d="M32 5c10 8 12 22 8 37H24c-4-15-2-29 8-37zM24 33l-8 11 8-2M40 33l8 11-8-2" />
      <circle cx="32" cy="21" r="5" className="sd-fill" />
      <circle cx="32" cy="21" r="5" />
    </>
  ),
  crown: (
    <>
      <path d="M8 46l4-28 12 14 8-20 8 20 12-14 4 28z" className="sd-fill" />
      <path d="M8 46l4-28 12 14 8-20 8 20 12-14 4 28zM8 53h48" />
    </>
  ),
  thread: (
    <>
      <path d="M6 58L40 18a4.5 4.5 0 016.5 6.2z" className="sd-fill" />
      <path d="M6 58L40 18a4.5 4.5 0 016.5 6.2z" />
      <ellipse cx="42.6" cy="21" rx="1.3" ry="3" transform="rotate(42 42.6 21)" />
      <path d="M43 21c10-12 18-6 14 2s-14 6-10 14 14 2 12 14" />
    </>
  ),
  bird: (
    <>
      <path d="M9 37c8-13 24-15 34-9l12-4-6 8c-2 12-17 17-29 13z" className="sd-fill" />
      <path d="M9 37c8-13 24-15 34-9l12-4-6 8c-2 12-17 17-29 13zM24 33c4 5 10 6 15 4M20 45l-4 8M27 46l-1 8" />
      <circle cx="44" cy="30" r="1.4" className="sd-solid" />
    </>
  ),
  notebook: (
    <>
      <rect x="16" y="7" width="38" height="50" rx="3" />
      <path d="M24 18h22M24 26h22M24 34h22M24 42h14" />
      {[14, 23, 32, 41, 50].map((cy) => (
        <circle key={cy} cx="16" cy={cy} r="3" />
      ))}
    </>
  ),
  burst: (
    <>
      <polygon points={burstPoints} className="sd-fill" />
      <polygon points={burstPoints} />
    </>
  ),
  wand: (
    <>
      <path d="M8 56l30-30" strokeWidth="3.5" />
      <path
        d="M46 6l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"
        className="sd-solid"
      />
    </>
  ),
  squiggle: <path d="M4 34c8-12 14 10 22 0s14-12 22 0c4 5 8 2 12-2" />,
  scroll: (
    <>
      <path d="M16 14v36M48 14v36" />
      <path d="M12 10a4 4 0 014-4h36a4 4 0 010 8H16a4 4 0 01-4-4zM12 54a4 4 0 014-4h36a4 4 0 010 8H16a4 4 0 01-4-4z" className="sd-fill" />
      <path d="M12 10a4 4 0 014-4h36a4 4 0 010 8H16a4 4 0 01-4-4zM12 54a4 4 0 014-4h36a4 4 0 010 8H16a4 4 0 01-4-4zM22 22h20M22 29h20M22 36h14" />
    </>
  ),
  castle: (
    <>
      <path d="M23 16l9-11 9 11z" className="sd-fill" />
      <path d="M8 58V26h6v5h5v-5h6v32M25 58V16h14v42M39 58V26h6v5h5v-5h6v32M23 16l9-11 9 11zM4 58h56M28 58v-8a4 4 0 018 0v8" />
    </>
  ),
  inkpot: (
    <>
      <path d="M18 30h28v22a4 4 0 01-4 4H22a4 4 0 01-4-4z" className="sd-fill" />
      <path d="M18 30h28v22a4 4 0 01-4 4H22a4 4 0 01-4-4zM24 30v-6h16v6M21 24h22" />
      <path d="M52 8c3 4 4 6 4 8a4 4 0 01-8 0c0-2 1-4 4-8z" className="sd-solid" />
    </>
  ),
  magnifier: (
    <>
      <circle cx="26" cy="26" r="16" className="sd-fill" />
      <circle cx="26" cy="26" r="16" />
      <path d="M38 38l18 18" strokeWidth="5" />
      <path d="M17 21a10 10 0 018-6" />
    </>
  ),
  hero: (
    <>
      <path d="M26 22L12 54c7-4 13-3 20 1 7-4 13-5 20-1L38 22z" className="sd-fill" />
      <circle cx="32" cy="12" r="6" />
      <path d="M26 22h12l2 18H24zM26 24L15 12M38 24l11-12M28 40l-2 15M36 40l2 15" />
      <path d="M32 26l1.5 3 3 .4-2.2 2 .6 3-2.9-1.5-2.9 1.5.6-3-2.2-2 3-.4z" className="sd-solid" />
    </>
  ),
  heart: (
    <>
      <path d="M32 54C14 42 6 32 6 22a12 12 0 0126-6 12 12 0 0126 6c0 10-8 20-26 32z" className="sd-fill" />
      <path d="M32 54C14 42 6 32 6 22a12 12 0 0126-6 12 12 0 0126 6c0 10-8 20-26 32z" />
    </>
  ),
  star: (
    <>
      <polygon points={starPoints} className="sd-fill" />
      <polygon points={starPoints} />
    </>
  ),
  cloud: <path d="M18 46h30a10 10 0 000-20 14 14 0 00-27-3 11 11 0 00-3 23z" />,
  moon: (
    <>
      <path d="M40 8a24 24 0 100 48A20 20 0 0140 8z" className="sd-fill" />
      <path d="M40 8a24 24 0 100 48A20 20 0 0140 8z" />
      <path d="M50 22l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" className="sd-solid" />
    </>
  ),
  books: (
    <>
      <path d="M14 36h38v10H14z" className="sd-fill" />
      <path d="M10 46h44v10H10zM14 36h38v10H14zM8 26h40v10H8zM16 46v10M44 36v10M14 26v10M12 18l26-6 2 8" />
    </>
  ),
  abc: (
    <>
      <rect x="12" y="12" width="40" height="40" rx="5" className="sd-fill" />
      <rect x="12" y="12" width="40" height="40" rx="5" />
      <path d="M24 44l8-22 8 22M27 36h10" strokeWidth="3" />
    </>
  ),
  map: (
    <>
      <path d="M8 14l14-6 20 6 14-6v42l-14 6-20-6-14 6zM22 8v42M42 14v42" />
      <path d="M12 42c6-6 10 4 18-4s10-2 16-14" strokeDasharray="3 4" />
      <path d="M45 15l7 7M52 15l-7 7" strokeWidth="3" />
    </>
  ),
} as const;

const DOODLES: Doodle[] = [
  // top band (mostly behind the translucent header)
  { art: "crown", x: 26, y: 8, size: 3.75, rotate: -12, tone: "gold", wide: true },
  { art: "cloud", x: 40, y: 3, size: 4.5, tone: "ink", wide: true },
  { art: "burst", x: 58, y: 8, size: 3.75, rotate: 10, tone: "gold", wide: true },
  { art: "heart", x: 72, y: 5, size: 2.75, rotate: -10, tone: "red", wide: true, float: true },
  { art: "book", x: 86, y: 10, size: 5.25, rotate: -8, tone: "ink" },
  // upper middle
  { art: "pencil", x: 2, y: 18, size: 5.25, tone: "orange", float: true },
  { art: "abc", x: 16, y: 22, size: 3.5, rotate: 8, tone: "orange", wide: true },
  { art: "mask", x: 36, y: 22, size: 4.75, rotate: -6, tone: "red", wide: true },
  { art: "moon", x: 50, y: 20, size: 3.75, tone: "gold", wide: true },
  { art: "star", x: 78, y: 22, size: 2.5, rotate: -8, tone: "gold" },
  { art: "scroll", x: 93, y: 26, size: 4, rotate: 10, tone: "ink" },
  // middle
  { art: "bird", x: 11, y: 35, size: 3.75, tone: "ink", flip: true },
  { art: "magnifier", x: 26, y: 38, size: 4, rotate: -12, tone: "ink", wide: true },
  { art: "squiggle", x: 52, y: 38, size: 3.25, rotate: -14, tone: "gold", wide: true },
  { art: "hero", x: 62, y: 31, size: 4.75, tone: "red", wide: true, float: true },
  { art: "bubble", x: 78, y: 43, size: 4.5, rotate: 6, tone: "ink", wide: true, float: true },
  { art: "inkpot", x: 3, y: 46, size: 4, rotate: -6, tone: "ink" },
  { art: "notebook", x: 34, y: 54, size: 4, rotate: 8, tone: "ink", wide: true },
  { art: "map", x: 48, y: 50, size: 4.5, rotate: -4, tone: "orange", wide: true },
  { art: "star", x: 66, y: 48, size: 2, rotate: 10, tone: "orange", wide: true },
  { art: "heart", x: 92, y: 51, size: 2.5, rotate: 12, tone: "red" },
  // lower middle
  { art: "quill", x: 6, y: 60, size: 4.75, rotate: 8, tone: "red" },
  { art: "castle", x: 20, y: 62, size: 5, tone: "ink", wide: true },
  { art: "plane", x: 62, y: 60, size: 5, rotate: -6, tone: "ink", wide: true, float: true },
  { art: "shield", x: 89, y: 64, size: 4.75, rotate: 8, tone: "orange", float: true },
  { art: "books", x: 3, y: 74, size: 4.25, tone: "orange" },
  { art: "bulb", x: 22, y: 78, size: 4.25, rotate: -10, tone: "gold", wide: true },
  { art: "thread", x: 46, y: 74, size: 5.25, tone: "red", wide: true },
  { art: "squiggle", x: 70, y: 76, size: 4.25, tone: "orange", wide: true },
  { art: "cloud", x: 84, y: 76, size: 3.75, tone: "ink", wide: true },
  // bottom band
  { art: "wand", x: 4, y: 88, size: 4, tone: "orange" },
  { art: "star", x: 16, y: 92, size: 2.25, tone: "gold" },
  { art: "mask", x: 36, y: 88, size: 3.5, rotate: 8, tone: "orange", wide: true },
  { art: "rocket", x: 80, y: 86, size: 4.25, rotate: 20, tone: "red" },
];

export function StoryDoodles() {
  return (
    <div className="story-doodles" aria-hidden="true">
      {DOODLES.map((d, i) => (
        <svg
          key={i}
          viewBox="0 0 64 64"
          focusable="false"
          className={[
            "sd-item",
            `sd-${d.tone}`,
            d.wide && "sd-wide",
            d.float && "sd-float",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            {
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.size}rem`,
              "--sd-r": `${d.rotate ?? 0}deg`,
              "--sd-s": d.flip ? -1 : 1,
              animationDelay: `${(i % 5) * -1.4}s`,
            } as React.CSSProperties
          }
        >
          {ART[d.art]}
        </svg>
      ))}
    </div>
  );
}
