import React from "react";
import {
  BookOpen,
  ClipboardCheck,
  HeartHandshake,
  Lightbulb,
  MessageSquareQuote,
  PencilLine,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Mayakda } from "./Mayakda";

/**
 * Teacher's Guidance: a practical playbook for running KwentoHabi in class.
 * Opened from the Help menu (teachers only). Everything here describes how
 * the app already works; it adds no new behaviour.
 */
export function TeacherGuidance({ lang }: { lang: "tl" | "en" }) {
  const t = (tl: string, en: string) => (lang === "tl" ? tl : en);

  const steps = [
    {
      icon: <BookOpen size={20} />,
      title: t("1 · Itakda ang kuwento", "1 · Set up the story"),
      body: t(
        "Pindutin ang Bagong kuwento. Piliin ang mga kasapi, isulat ang malinaw na panuto, maglakip ng sanggunian at takdang araw, at itakda ang antas ng nilalaman.",
        "Choose New story. Pick the members, write clear instructions, attach references and a due date, and set the content level.",
      ),
    },
    {
      icon: <PencilLine size={20} />,
      title: t("2 · Hayaang sumulat ang mag-aaral", "2 · Let students write"),
      body: t(
        "Sa Pagsusulat, bawat mag-aaral ang sumusulat ng sariling kabanata. Magkahiwalay ang bagong draft at rebisyon, kaya walang nabubura.",
        "In the Writing canvas each student writes their own chapter. New drafts and revisions are kept separately, so nothing is overwritten.",
      ),
    },
    {
      icon: <ScanSearch size={20} />,
      title: t(
        "3 · Basahin ang continuity check",
        "3 · Read the continuity check",
      ),
      body: t(
        "Ipinapakita ng check ang posibleng salungatan sa kuwento. Limitado ang lokal na parser at opsyonal ang AI; maaaring mali ang flag, kaya basahin ang mismong teksto.",
        "The check points to possible conflicts in the story. The local parser is limited and AI is optional; flags can be wrong, so read the passage itself.",
      ),
    },
    {
      icon: <ClipboardCheck size={20} />,
      title: t("4 · Ikaw ang magpapasya", "4 · You make the call"),
      body: t(
        "Sa Gabay ng guro, piliin ang Payagan sa konteksto o Humiling ng rebisyon. Mungkahi lamang ang AI; ikaw ang nagbibigay ng huling marka.",
        "In Teacher review choose Allow in context or Request revision. AI only suggests; you assign the final grade.",
      ),
    },
  ];

  const tips = [
    [
      t("Magsimula sa gumagana", "Start with what works"),
      t(
        "Pangalanan ang isang tiyak na detalye: “Ramdam ko ang alat ng hangin sa unang talata.”",
        "Name one specific detail: “I can taste the salty breeze in your first paragraph.”",
      ),
    ],
    [
      t("Isang susunod na hakbang", "One next step"),
      t(
        "Mas madaling sundin ang isang malinaw na mungkahi kaysa sa sampung puna.",
        "One clear suggestion is easier to act on than ten comments.",
      ),
    ],
    [
      t("Magtanong, huwag isulat muli", "Ask, don't rewrite"),
      t(
        "“Ano ang mapapansin ni Lia rito?” Hayaang ang mag-aaral ang humanap ng sagot.",
        "“What would Lia notice here?” Let the student find the answer.",
      ),
    ],
    [
      t("Ingatan ang boses ng mag-aaral", "Protect the student's voice"),
      t(
        "Gamitin ang rubric bilang gabay, hindi bilang hulmahan. Kanila ang kuwento.",
        "Use the rubric as a guide, not a mould. The story is theirs.",
      ),
    ],
  ];

  const prompts = [
    t(
      "Isang bayani na gumagana lang ang kapangyarihan kapag nagsasabi siya ng totoo.",
      "A hero whose power only works when they tell the truth.",
    ),
    t(
      "Lambat ng mangingisda na nakahuhuli ng mga alaala.",
      "A fisherman's net that catches memories instead of fish.",
    ),
    t(
      "Nag-day off ang diwatang tagapagbantay ng inyong barangay.",
      "Your barangay's guardian spirit takes a day off.",
    ),
    t(
      "Isang liham mula kay Lola na dumating nang dalawampung taon na huli.",
      "A letter from Lola that arrives twenty years late.",
    ),
    t(
      "Isang dyip na lumiko papunta sa ibang siglo.",
      "A jeepney that takes a wrong turn into another century.",
    ),
    t("Ang maya na natutong magbasa.", "The maya bird who learned to read."),
  ];

  return (
    <div className="space-y-5 teacher-guidance">
      <section className="welcome-panel">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="min-w-0 space-y-3 max-w-2xl">
            <p className="eyebrow">
              {t("Patnubay para sa guro", "Teacher's guidance")}
            </p>
            <h2
              id="workspace-title"
              tabIndex={-1}
              className="font-serif text-3xl sm:text-4xl font-bold leading-tight outline-none"
            >
              {t(
                "Gabayan ang mga batang manunulat, isang kabanata sa bawat pagkakataon.",
                "Guide young writers, one chapter at a time.",
              )}
            </h2>
            <p className="text-slate-700">
              {t(
                "Isang maikling gabay sa paggamit ng KwentoHabi sa klase: mula sa pagtatakda ng kuwento hanggang sa pagbibigay ng puna na nakatutulong.",
                "A short playbook for running KwentoHabi in class: from setting up a story to giving feedback that actually helps.",
              )}
            </p>
          </div>
          <Mayakda
            pose="nest"
            size={110}
            className="sm:ml-auto self-center"
            lang={lang}
            speechPlacement="left"
          />
        </div>
      </section>

      <section className="card space-y-4" aria-labelledby="tg-rhythm">
        <h3 id="tg-rhythm" className="font-serif text-xl font-bold">
          {t("Ang daloy ng isang gawain", "The rhythm of an assignment")}
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
        <section className="card space-y-4" aria-labelledby="tg-highlights">
          <div className="flex items-center gap-3">
            <span className="stat-icon size-10">
              <Sparkles size={20} />
            </span>
            <h3 id="tg-highlights" className="font-serif text-xl font-bold">
              {t("Pagbasa sa mga highlight", "Reading the highlights")}
            </h3>
          </div>
          <ul className="space-y-3 text-sm">
            <li>
              <mark className="hl-contradiction">
                {t("Posibleng salungatan", "Possible contradiction")}
              </mark>{" "}
              —{" "}
              {t(
                "hindi tugma sa naunang detalye (hal. kulay ng mata, edad, lugar). Itanong muna sa mag-aaral kung sinadya ito.",
                "doesn't match an earlier detail (eye colour, age, place). Ask the student first whether it was intentional.",
              )}
            </li>
            <li>
              <mark className="hl-resolved">{t("Naresolba", "Resolved")}</mark>{" "}
              —{" "}
              {t(
                "napag-usapan na at may pasya; nananatili bilang tala ng proseso.",
                "already discussed and decided; kept as a record of the process.",
              )}
            </li>
            <li>
              <mark className="hl-flagged">
                {t("Naka-flag para sa pagsusuri", "Flagged for review")}
              </mark>{" "}
              —{" "}
              {t(
                "maaaring lumampas sa napiling antas ng nilalaman. Basahin sa konteksto bago magpasya.",
                "may go beyond the chosen content level. Read it in context before deciding.",
              )}
            </li>
          </ul>
        </section>

        <section className="card space-y-4" aria-labelledby="tg-groups">
          <div className="flex items-center gap-3">
            <span className="stat-icon size-10">
              <Users size={20} />
            </span>
            <h3 id="tg-groups" className="font-serif text-xl font-bold">
              {t("Mga kuwentong pangkat", "Group stories")}
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
            <li>
              {t(
                "Hikayatin ang pangkat na mag-usap sa tala bago humingi ng gabay sa guro.",
                "Encourage the group to talk it through in notes before asking you to step in.",
              )}
            </li>
            <li>
              {t(
                "Sa Mga talakayang nangangailangan ng gabay, piliin ang Panatilihin pareho, Gamitin ang A, o Gamitin ang B.",
                "In Discussions needing guidance, choose Keep both, Adopt A or Adopt B.",
              )}
            </li>
            <li>
              {t(
                "Gawing iisang batayan ng katotohanan ang Wiki ng kuwento: tauhan, lugar, at mahahalagang pangyayari.",
                "Treat the Story wiki as the shared source of truth: characters, places and key events.",
              )}
            </li>
            <li>
              {t(
                "Naka-lock ang iyong pasya hanggang ikaw mismo ang magbukas muli ng talakayan.",
                "Your decisions stay locked until you reopen the discussion yourself.",
              )}
            </li>
          </ul>
        </section>
      </div>

      <section className="card space-y-4" aria-labelledby="tg-feedback">
        <div className="flex items-center gap-3">
          <span className="stat-icon size-10">
            <MessageSquareQuote size={20} />
          </span>
          <h3 id="tg-feedback" className="font-serif text-xl font-bold">
            {t("Punang nakatutulong", "Feedback that helps")}
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
        <section className="card space-y-4" aria-labelledby="tg-care">
          <div className="flex items-center gap-3">
            <span className="stat-icon size-10">
              <HeartHandshake size={20} />
            </span>
            <h3 id="tg-care" className="font-serif text-xl font-bold">
              {t("Malasakit at kaligtasan", "Care and safety")}
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
            <li>
              {t(
                "Kung may sensitibong bahagi na mukhang personal, kausapin nang pribado ang mag-aaral at sundin ang child-protection na proseso ng paaralan.",
                "If a sensitive passage seems personal, talk to the student privately and follow your school's child-protection procedure.",
              )}
            </li>
            <li>
              {t(
                "Lokal lamang ang pagsusuri hanggang maitala ng paaralan ang pahintulot ng mag-aaral.",
                "Checks stay local until the school records the student's authorization.",
              )}
            </li>
            <li>
              {t(
                "Ibahagi nang pribado ang mga password, at huwag maglagay ng tunay na datos ng mag-aaral sa mga halimbawang kuwento.",
                "Share passwords privately, and keep real student data out of demo stories.",
              )}
            </li>
          </ul>
        </section>

        <section className="card space-y-4" aria-labelledby="tg-prompts">
          <div className="flex items-center gap-3">
            <span className="stat-icon size-10">
              <Lightbulb size={20} />
            </span>
            <h3 id="tg-prompts" className="font-serif text-xl font-bold">
              {t("Mga panimulang ideya", "Story starters")}
            </h3>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {prompts.map((p) => (
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
          "Tandaan: katuwang ang KwentoHabi, hindi kapalit ng guro. Ikaw pa rin ang huling nagpapasya sa bawat marka at bawat kuwento.",
          "Remember: KwentoHabi is a helper, not a replacement for you. You make the final call on every grade and every story.",
        )}
      </p>
    </div>
  );
}
