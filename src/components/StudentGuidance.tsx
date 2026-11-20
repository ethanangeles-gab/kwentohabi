import React from "react";
import {
  BookOpen,
  BookMarked,
  HeartHandshake,
  Lightbulb,
  MessagesSquare,
  PencilLine,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Mayakda } from "./Mayakda";

/**
 * Student's Guidance: a friendly how-to for young writers using KwentoHabi.
 * Opened from the Help menu (students only). Everything here describes how
 * the app already works; it adds no new behaviour.
 */
export function StudentGuidance({ lang }: { lang: "tl" | "en" }) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);

  const steps = [
    {
      icon: <BookOpen size={20} />,
      title: t("1 · Basahin ang panuto", "1 · Read the assignment"),
      body: t(
        "Buksan ang Panuto ng gawain sa itaas ng kuwento. Tingnan ang takdang araw at ang mga sanggunian ng guro.",
        "Open Assignment instructions above the story. Check the due date and any references from your teacher.",
      ),
    },
    {
      icon: <BookMarked size={20} />,
      title: t("2 · Silipin ang Wiki ng kuwento", "2 · Peek at the Story wiki"),
      body: t(
        "Nakalista roon ang mga tauhan, lugar, at pangyayaring napagkasunduan na, para tumugma ang iyong kabanata.",
        "It lists the characters, places and events already agreed on, so your chapter fits the story.",
      ),
    },
    {
      icon: <PencilLine size={20} />,
      title: t("3 · Isulat ang iyong kabanata", "3 · Write your chapter"),
      body: t(
        "Sa Pagsusulat, gamitin ang Pokus sa pagsusulat para walang abala. I-save nang madalas; hindi nabubura ang dating bersyon.",
        "In the Writing canvas, try Focus writing to block out distractions. Save often; earlier versions are kept.",
      ),
    },
    {
      icon: <ScanSearch size={20} />,
      title: t("4 · Patakbuhin ang check", "4 · Run the check"),
      body: t(
        "Pindutin ang Suriin ang kasalukuyang draft. Ituturo nito ang posibleng hindi tugma, pero maaari itong magkamali. Ikaw ang huling titingin.",
        "Choose Check current draft. It points to details that might not match, but it can be wrong. You take the final look.",
      ),
    },
  ];

  const tips = [
    [
      t("Ipakita, huwag sabihin", "Show, don't tell"),
      t(
        "Sa halip na “Natakot siya,” isulat ang “Nanginig ang kanyang mga daliri sa hawakan ng pinto.”",
        "Instead of “She was scared,” try “Her fingers shook on the door handle.”",
      ),
    ],
    [
      t("Bigyan ng kahinaan ang bayani", "Give your hero a weakness"),
      t(
        "Mas kapana-panabik ang bayani na may kinatatakutan o pagkakamaling kailangang ayusin.",
        "A hero with a fear or a mistake to fix is far more exciting to follow.",
      ),
    ],
    [
      t("Gamitin ang limang pandama", "Use all five senses"),
      t(
        "Ano ang naaamoy, naririnig, at nalalasahan ng tauhan? Doon nabubuhay ang eksena.",
        "What does your character smell, hear and taste? That's where a scene comes alive.",
      ),
    ],
    [
      t("Basahin nang malakas", "Read it out loud"),
      t(
        "Kapag nadapa ka sa pagbasa, malamang may pangungusap na kailangang ayusin.",
        "If you stumble while reading, that sentence probably needs a fix.",
      ),
    ],
  ];

  const starters = [
    t(
      "Nagising ka na may superpower na gumagana lang tuwing Lunes.",
      "You wake up with a superpower that only works on Mondays.",
    ),
    t(
      "Nabubuhay ang lahat ng iginuguhit ng iyong lapis.",
      "Everything your pencil draws comes to life.",
    ),
    t(
      "Isang sari-sari store na nagbebenta ng mga hiling.",
      "A sari-sari store that sells wishes.",
    ),
    t(
      "Ikaw ang paksa ng huling pahina ng isang librong hiniram sa aklatan.",
      "The last page of a library book is written about you.",
    ),
    t(
      "Nagpasya ang iyong anino na maglakbay nang mag-isa.",
      "Your shadow decides to go on an adventure without you.",
    ),
    t(
      "Isang bagyo ang nagdala ng estrangherong nagsasalita lamang sa bugtong.",
      "A typhoon brings a stranger who speaks only in riddles.",
    ),
  ];

  return (
    <div className="space-y-5 student-guidance">
      <section className="welcome-panel">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="min-w-0 space-y-3 max-w-2xl">
            <p className="eyebrow">
              {t("Patnubay para sa mag-aaral", "Student's guidance")}
            </p>
            <h2
              id="workspace-title"
              tabIndex={-1}
              className="font-serif text-3xl sm:text-4xl font-bold leading-tight outline-none"
            >
              {t(
                "Iyong kuwento, iyong boses. Isulat natin nang mahusay.",
                "Your story, your voice. Let's write it well.",
              )}
            </h2>
            <p className="text-slate-700">
              {t(
                "Lahat ng kailangan mo para makasulat ng kabanatang ipagmamalaki mo: mula sa unang ideya hanggang sa pakikipagtulungan sa iyong pangkat.",
                "Everything you need to write a chapter you're proud of: from the first idea to working with your group.",
              )}
            </p>
          </div>
          <Mayakda
            pose="nest"
            size={110}
            lang={lang}
            speechPlacement="left"
            className="sm:ml-auto self-center"
          />
        </div>
      </section>

      <section className="card space-y-4" aria-labelledby="sg-steps">
        <h3 id="sg-steps" className="font-serif text-xl font-bold">
          {t("Paano nabubuo ang isang kabanata", "How a chapter comes to life")}
        </h3>
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((s) => (
            <li key={s.title} className="flex gap-3 min-w-0">
              <span className="stat-icon size-10">{s.icon}</span>
              <div className="min-w-0 space-y-1">
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-slate-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-4" aria-labelledby="sg-highlights">
          <div className="flex items-center gap-3">
            <span className="stat-icon size-10">
              <Sparkles size={20} />
            </span>
            <h3 id="sg-highlights" className="font-serif text-xl font-bold">
              {t(
                "Ano ang ibig sabihin ng mga kulay?",
                "What do the colours mean?",
              )}
            </h3>
          </div>
          <ul className="space-y-3 text-sm">
            <li>
              <mark className="hl-contradiction">
                {t("Posibleng salungatan", "Possible contradiction")}
              </mark>{" "}
              —{" "}
              {t(
                "tugma ba ito sa naisulat na noon? Ayusin ito, o ipaliwanag sa tala kung sinadya mo.",
                "does this match what was written before? Fix it, or explain in a note if you meant it.",
              )}
            </li>
            <li>
              <mark className="hl-resolved">{t("Naresolba", "Resolved")}</mark>{" "}
              —{" "}
              {t(
                "naayos na; wala ka nang kailangang gawin.",
                "already settled; nothing for you to do.",
              )}
            </li>
            <li>
              <mark className="hl-flagged">
                {t("Naka-flag para sa pagsusuri", "Flagged for review")}
              </mark>{" "}
              —{" "}
              {t(
                "babasahin ito ng iyong guro sa konteksto. Hindi ka pinaparusahan; pagsusuri lamang ito.",
                "your teacher will read it in context. You're not in trouble; it's just a check.",
              )}
            </li>
          </ul>
        </section>

        <section className="card space-y-4" aria-labelledby="sg-group">
          <div className="flex items-center gap-3">
            <span className="stat-icon size-10">
              <MessagesSquare size={20} />
            </span>
            <h3 id="sg-group" className="font-serif text-xl font-bold">
              {t("Pagsulat bilang pangkat", "Writing as a group")}
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
            <li>
              {t(
                "Kapag may hindi tugma, magsulat ng Tala ng pananaw: “May napansin ako dito…”",
                "When details clash, write a Perspective note: “I noticed something here…”",
              )}
            </li>
            <li>
              {t(
                "Pumili nang sama-sama: Piliin A, Piliin B, Panatilihin pareho, o Gabay ng guro.",
                "Decide together: Adopt A, Adopt B, Keep both, or Ask teacher.",
              )}
            </li>
            <li>
              {t(
                "Igalang ang kabanata ng kaklase. Ikaw ang may-ari ng sa iyo; sila ang may-ari ng sa kanila.",
                "Respect your classmates' chapters. Yours is yours; theirs is theirs.",
              )}
            </li>
            <li>
              {t(
                "Ang pasya ng guro ang huli, at siya lamang ang makapagbubukas nito muli.",
                "Your teacher's decision is final, and only your teacher can reopen it.",
              )}
            </li>
          </ul>
        </section>
      </div>

      <section className="card space-y-4" aria-labelledby="sg-tips">
        <div className="flex items-center gap-3">
          <span className="stat-icon size-10">
            <Wand2 size={20} />
          </span>
          <h3 id="sg-tips" className="font-serif text-xl font-bold">
            {t("Mga lihim ng mahusay na manunulat", "Writer's secret powers")}
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tips.map(([title, body]) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 p-4 space-y-1"
            >
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-4" aria-labelledby="sg-care">
          <div className="flex items-center gap-3">
            <span className="stat-icon size-10">
              <HeartHandshake size={20} />
            </span>
            <h3 id="sg-care" className="font-serif text-xl font-bold">
              {t("Ingatan ang sarili", "Look after yourself")}
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
            <li>
              {t(
                "Kung mabigat sa loob ang isinusulat mo, kausapin ang iyong guro o isang pinagkakatiwalaang nakatatanda.",
                "If what you're writing about feels heavy, talk to your teacher or a trusted adult.",
              )}
            </li>
            <li>
              {t(
                "Huwag ibahagi ang iyong password, kahit sa kaibigan.",
                "Keep your password to yourself, even from friends.",
              )}
            </li>
            <li>
              {t(
                "Gumamit ng gawa-gawang pangalan at lugar sa halip na tunay na buong pangalan o tirahan ng tao.",
                "Use made-up names and places instead of real people's full names or addresses.",
              )}
            </li>
          </ul>
        </section>

        <section className="card space-y-4" aria-labelledby="sg-starters">
          <div className="flex items-center gap-3">
            <span className="stat-icon size-10">
              <Lightbulb size={20} />
            </span>
            <h3 id="sg-starters" className="font-serif text-xl font-bold">
              {t("Natigil? Subukan ito", "Stuck? Try one of these")}
            </h3>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {starters.map((p) => (
              <li
                key={p}
                className="rounded-lg bg-slate-50 px-3 py-2 font-serif text-base"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="notice flex items-start gap-2">
        <ShieldCheck size={18} className="shrink-0 mt-0.5" />
        {t(
          "Tandaan: tumutulong si Mayakda, pero ikaw ang manunulat. Huwag kopyahin ang sulat ng AI bilang sarili mo. Ang iyong guro ang nagbibigay ng marka.",
          "Remember: Mayakda helps, but you are the writer. Never pass off AI writing as your own. Your teacher gives the grade.",
        )}
      </p>
    </div>
  );
}
