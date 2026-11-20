import React from "react";

type MayakdaProps = {
  size?: number;
  pose?: "brand" | "notice" | "quiet";
  className?: string;
};

export function Mayakda({
  size = 128,
  pose = "brand",
  className = "",
}: MayakdaProps) {
  const notice = pose === "notice";
  const quiet = pose === "quiet";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role="img"
      aria-label="Mayakda, ang maya na tagahabi ng kuwento"
      className={`mayakda mayakda-${pose} ${className}`}
    >
      <ellipse cx="80" cy="146" rx="48" ry="7" fill="#173f3a" opacity=".10" />
      <path
        d="M39 146c-7-19 3-35 20-42 15-6 32 1 41 14 10 15 5 28-4 35H39Z"
        fill="#b97a46"
        stroke="#173f3a"
        strokeWidth="3"
      />
      <path
        d="M46 143c18-9 49-9 68 0M47 132c20-8 45-8 65 0"
        fill="none"
        stroke="#d5a653"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="5 7"
      />
      <ellipse cx="80" cy="82" rx="43" ry="49" fill="#9a6743" />
      <ellipse cx="80" cy="84" rx="33" ry="38" fill="#b98557" />
      <path
        d="M44 74c9-25 27-38 51-37 17 1 29 10 34 24-18-7-45-5-85 13Z"
        fill="#5d493a"
      />
      <circle cx="64" cy="76" r="4" fill="#172b2a" />
      <circle cx="96" cy="76" r="4" fill="#172b2a" />
      <circle cx="65" cy="75" r="1.2" fill="#fff" />
      <circle cx="97" cy="75" r="1.2" fill="#fff" />
      <path d="m80 82 10 5-10 7-10-7Z" fill="#d5a653" />
      <path
        d="M49 67c-12 7-16 19-11 29M111 67c12 7 16 19 11 29"
        fill="none"
        stroke="#5d493a"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M51 111c20 8 40 8 58-1"
        fill="none"
        stroke="#f1e1bc"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M51 111c20 8 40 8 58-1"
        fill="none"
        stroke="#1e3a8a"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="7 7"
      />
      <path
        d="M67 116l-9 20M93 116l9 20"
        fill="none"
        stroke="#6f4a32"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {notice && (
        <g className="mayakda-thread">
          <path
            d="M103 89c24 4 31 21 21 30-8 8-21-1-14-9"
            fill="none"
            stroke="#d97706"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="108" cy="111" r="3" fill="#d97706" />
        </g>
      )}
      {!quiet && (
        <path
          d="M87 88c15 5 23 14 27 27"
          fill="none"
          stroke="#c2410c"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="mayakda-loose-thread"
        />
      )}
    </svg>
  );
}
