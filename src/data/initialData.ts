import { StudentAuthor, Chapter, Contradiction, SafetyFlag, RubricStandard, DefenseQuestion } from '../types';

export const AUTHORS: Record<string, StudentAuthor> = {
  maria: {
    id: 'maria',
    name: 'Maria Santos',
    firstName: 'Maria',
    avatarColor: '#c2410c', // terracotta
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
    badgeText: 'text-orange-700',
    borderCol: 'border-orange-500',
    role: 'Lead Worldbuilder'
  },
  jose: {
    id: 'jose',
    name: 'Jose Reyes',
    firstName: 'Jose',
    avatarColor: '#1d4ed8', // indigo
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    badgeText: 'text-blue-700',
    borderCol: 'border-blue-500',
    role: 'Plot & Dialogue Weaver'
  },
  ana: {
    id: 'ana',
    name: 'Ana Cruz',
    firstName: 'Ana',
    avatarColor: '#7e22ce', // purple
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    badgeText: 'text-purple-700',
    borderCol: 'border-purple-500',
    role: 'Setting & Climax Writer'
  },
  ethan: {
    id: 'ethan',
    name: 'Ethan Gabriel Angeles',
    firstName: 'Ethan',
    avatarColor: '#059669', // jade
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-700',
    borderCol: 'border-emerald-500',
    role: 'Character Development'
  },
  sophia: {
    id: 'sophia',
    name: 'Sophia Abigail Santiago',
    firstName: 'Sophia',
    avatarColor: '#d97706', // ochre
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-700',
    borderCol: 'border-amber-500',
    role: 'Narrative Pacing & Dialogue'
  }
};

export const INITIAL_STORIES = [
  {
    id: 'story-lia',
    title: 'Si Lia at ang Dagat',
    genre: 'Baybaying Realismo / Drama ng Pamilya',
    gradeLevel: 'Grade 9 - Seksyon Mabini',
    description: 'Ang kuwento ni Lia, isang batang lumalaki sa pamayanang mangingisda at humaharap sa mga hamon ng dagat at pamilya.',
    chapters: [
      {
        id: 'c1',
        authorId: 'maria',
        title: 'Kabanata 1: Ang Dalampasigan',
        at: '2026-11-03T09:15:00+08:00',
        text: "Lia lived in a small fishing village in Batangas. Lia's eyes were brown. Lia had two brothers who laughed at everything she said. Every morning she carried her father's net down to the shore before the sun came up. The salty breeze always reminded her of quiet mornings before the village woke up."
      },
      {
        id: 'c2',
        authorId: 'jose',
        title: 'Kabanata 2: Ang Paaralan sa Bayan',
        at: '2026-11-04T10:40:00+08:00',
        text: "Lia's green eyes caught the light as she walked to school past the market. Lia was an only child, and some days she wished for someone to share secrets with. Lia lived in Quezon, where the road to the sea was long and dusty. Her classmates often gathered around the mango tree during recess."
      },
      {
        id: 'c3',
        authorId: 'ana',
        title: 'Kabanata 3: Ang Salungat ng Bagyo',
        at: '2026-11-05T16:05:00+08:00',
        text: "When the typhoon passed, two fishermen fought over the last boat. One of them was hit and blood ran down his cheek. Lia lived in Batangas, so she knew the sea could be kind in the morning and cruel by night. She clutched her father's woven hat tightly as waves roared."
      }
    ]
  },
  {
    id: 'story-makiling',
    title: 'Ang Hiwaga sa Bundok Makiling',
    genre: 'Mitolohiya at Misteryo',
    gradeLevel: 'Grade 10 - Seksyon Rizal',
    description: 'Isang pangkat ng kabataan ang naglalakbay upang hanapin ang nawawalang gintong agimat sa paanan ng bundok.',
    chapters: [
      {
        id: 'm1',
        authorId: 'ethan',
        title: 'Kabanata 1: Ang Babala ng Matanda',
        at: '2026-11-06T11:00:00+08:00',
        text: "Si Samuel ay may dalang lumang tanso na kwintas mula sa kanyang lolo. Labing-limang taong gulang si Samuel nang marating nila ang unang taluktok. Sabi ng matanda sa kubo, huwag gagalawin ang puting usa sa tabing-ilog."
      },
      {
        id: 'm2',
        authorId: 'sophia',
        title: 'Kabanata 2: Ang Liwanag sa Kweba',
        at: '2026-11-07T14:30:00+08:00',
        text: "Labing-anim na taong gulang si Samuel nang pumasok sila sa kweba. Hawak niya ang kanyang pilak na kwintas na kumikinang sa dilim. Biglang lumitaw ang isang anino na may dalang sulo."
      }
    ]
  }
];

export const INITIAL_CONTRADICTIONS: Contradiction[] = [
  {
    key: 'lia|eye color',
    subject: 'Lia',
    attribute: 'eye color',
    a: {
      chapter: 'c1',
      value: 'brown',
      quote: "Lia's eyes were brown.",
      author: 'maria'
    },
    b: {
      chapter: 'c2',
      value: 'green',
      quote: "Lia's green eyes caught the light as she walked to school past the market.",
      author: 'jose'
    },
    explanation: 'Maria established that Lia has brown eyes in Chapter 1, but Jose described Lia having green eyes in Chapter 2.',
    starterPrompts: {
      aToB: 'Naunawaan ko na isinulat mo na berde ang mga mata ni Lia para sa dramatic effect, pero naisip ko na kayumanggi ito dahil...',
      bToA: 'I see that Maria wrote brown eyes for Lia. I imagined green eyes because the sunlight near the coast reflected the water...'
    }
  },
  {
    key: 'lia|siblings',
    subject: 'Lia',
    attribute: 'siblings',
    a: {
      chapter: 'c1',
      value: 'two brothers',
      quote: 'Lia had two brothers who laughed at everything she said.',
      author: 'maria'
    },
    b: {
      chapter: 'c2',
      value: 'only child',
      quote: 'Lia was an only child, and some days she wished for someone to share secrets with.',
      author: 'jose'
    },
    explanation: 'Maria wrote that Lia has two brothers, while Jose wrote that Lia is an only child longing for someone to share secrets with.',
    starterPrompts: {
      aToB: 'Napansin ko na isinulat mo na nag-iisang anak si Lia. Sa kabanata ko ay may dalawang kapatid siya na...',
      bToA: 'I see that Maria gave Lia two brothers. In my scene, I wanted a lonely emotional arc, but perhaps we could make them cousins or...'
    }
  },
  {
    key: 'lia|hometown',
    subject: 'Lia',
    attribute: 'hometown',
    a: {
      chapter: 'c1',
      value: 'Batangas',
      quote: 'Lia lived in a small fishing village in Batangas.',
      author: 'maria'
    },
    b: {
      chapter: 'c2',
      value: 'Quezon',
      quote: 'Lia lived in Quezon, where the road to the sea was long and dusty.',
      author: 'jose'
    },
    explanation: 'Maria placed Lia in a fishing village in Batangas, but Jose wrote that she lived in Quezon where the road was dusty.',
    starterPrompts: {
      aToB: 'Itinatag ko ang tagpuan sa Batangas dahil sa mga bangka, pero maaari bang lumipat ang kanyang pamilya sa Quezon?',
      bToA: 'I see Batangas in chapter 1. What if she visits her aunt in Quezon during the school term?'
    }
  }
];

export const INITIAL_FLAGS: SafetyFlag[] = [
  {
    key: 'c3|blood ran down his cheek',
    chapter: 'c3',
    author: 'ana',
    quote: 'One of them was hit and blood ran down his cheek.',
    category: 'violence',
    severity: 'mild',
    reason: 'Contains depiction of physical fighting between fishermen with blood mentioned.'
  }
];

export const BMC_BLOCKS = [
  {
    id: 'cs',
    title: 'Customer Segments',
    titleTl: 'Mga Segment ng Customer',
    icon: 'Users',
    color: 'border-blue-500 bg-blue-50/50',
    bullets: [
      'Filipino students and youth (Junior and Senior High School, College creative writing classes)',
      'Teachers and writing club advisers',
      'Student writing groups within a class (3-6 learners collaborating on shared worlds)'
    ],
    rationale: 'Addresses where the 91% learning poverty and classroom grading bottleneck lives. Group writing in classes is where cross-author checking solves real friction.'
  },
  {
    id: 'vp',
    title: 'Value Propositions',
    titleTl: 'Alok na Halaga',
    icon: 'Sparkles',
    color: 'border-amber-500 bg-amber-50/50',
    bullets: [
      'Cross-author continuity checking: flags contradictions across authors and guides students to resolve them respectfully',
      'Structured feedback benchmarked against a teacher’s uploaded materials or DepEd shared archive',
      'Digitized living story wiki (automatic fact-extraction by author & timestamp)',
      'Real-time plot hole and continuity checking (Socratic style: flags, never auto-rewrites)',
      'Safe, age-appropriate story space with teacher-controlled content settings'
    ],
    rationale: 'Leads with the sharpest differentiator no competitor has (cross-author checking), followed by the pedagogical workflow and safety controls for minors.'
  },
  {
    id: 'cr',
    title: 'Customer Relationships',
    titleTl: 'Ugnayan sa Customer',
    icon: 'HeartHandshake',
    color: 'border-rose-500 bg-rose-50/50',
    bullets: [
      'Teacher-mediated adoption (school-scoped accounts, guardian consent notice)',
      'Free archive access builds demand for institutional licensing',
      'Human-in-the-loop: AI acts as mentor, teacher retains grading authority'
    ],
    rationale: 'Schools adopt through teachers. Minors require school-scoped accounts and guardian notices under RA 10173.'
  },
  {
    id: 'ch',
    title: 'Channels',
    titleTl: 'Mga Daluyan',
    icon: 'Compass',
    color: 'border-emerald-500 bg-emerald-50/50',
    bullets: [
      'Schools, universities, and DepEd-aligned programs',
      'Writing club advisers and educator communities',
      'Free archive access (the acquisition wedge during 6-12 month school procurement cycles)',
      'Pilot classes and school social media groups'
    ],
    rationale: 'Teachers are reached via institutions. Free archive access keeps KwentoHabi embedded while institutional purchase orders clear.'
  },
  {
    id: 'rs',
    title: 'Revenue Streams',
    titleTl: 'Pinagkukunan ng Kita',
    icon: 'Coins',
    color: 'border-teal-500 bg-teal-50/50',
    bullets: [
      'Institutional and classroom licensing: ₱50–₱100 per student/year (anchor B2B revenue)',
      'Marketplace fees on teacher-contributed materials and exemplars',
      'CSR (Corporate Social Responsibility) sponsorships for public and under-resourced schools'
    ],
    rationale: 'One predictable B2B institutional line, plus content marketplace and corporate CSR sponsorships to bridge equity.'
  },
  {
    id: 'kr',
    title: 'Key Resources',
    titleTl: 'Mahahalagang Yaman',
    icon: 'Cpu',
    color: 'border-indigo-500 bg-indigo-50/50',
    bullets: [
      'Curriculum-aligned feedback framework (DepEd creative writing standards)',
      'AI continuity-checking engine with fact attribution and semantic logic gates',
      'Secure cloud server infrastructure & longitudinal classroom dataset',
      'Parsed materials library & age-appropriate content-safety guidelines'
    ],
    rationale: 'The parsed materials library and multi-author continuity dataset compound over time, creating a defensible moat against generic chatbots.'
  },
  {
    id: 'ka',
    title: 'Key Activities',
    titleTl: 'Mahahalagang Gawain',
    icon: 'CheckSquare',
    color: 'border-purple-500 bg-purple-50/50',
    bullets: [
      'Curriculum development and teacher onboarding outreach',
      'App development and prompt engineering (reconciliation & collision engine)',
      'Data security management and RA 10173 minor compliance',
      'Material parsing, rights verification, and moderation review'
    ],
    rationale: 'Recurring technical and pedagogical tasks required to keep the safe space, archive, and reconciliation engine running.'
  },
  {
    id: 'kp',
    title: 'Key Partners',
    titleTl: 'Mahahalagang Katuwang',
    icon: 'Building2',
    color: 'border-cyan-500 bg-cyan-50/50',
    bullets: [
      'DepEd-aligned schools and universities (UST, public high schools)',
      'Cloud hosting providers (Google Cloud / AWS)',
      'Invoicing and institutional payment providers',
      'AI / LLM API providers (Google Gemini API)'
    ],
    rationale: 'Schools are the buyers; cloud and Gemini API provide the scalable intelligence infrastructure.'
  },
  {
    id: 'cs_cost',
    title: 'Cost Structure',
    titleTl: 'Istruktura ng Gastos',
    icon: 'Receipt',
    color: 'border-red-500 bg-red-50/50',
    bullets: [
      'AI API costs ($0.02–$0.05 per check, ~$0.40–$1.00/student/mo vs ₱50-₱100 license)',
      'Cloud hosting & database storage',
      'Developer salaries and cybersecurity hardening',
      'Curriculum alignment labor & archive curation',
      'Content-moderation API & teacher review support'
    ],
    rationale: 'AI token consumption scales with students; unit economics show $0.40-$1.00/month cost remains well below the projected ₱50-₱100 per seat fee.'
  }
];

export const DEFENSE_QUESTIONS: DefenseQuestion[] = [
  {
    id: 1,
    section: 'Problem & Evidence',
    question: 'Is this problem real, or did your team just assume it exists?',
    questionTl: 'Totoo ba ang suliraning ito, o ipinalagay lamang ng grupo ninyo?',
    answer: 'It is cited, not assumed. The World Bank and UNESCO learning poverty brief estimates roughly 91% of Filipino 10-year-olds cannot read an age-appropriate text. In PISA 2022 the Philippines ranked 77th of 81 countries in reading, and DepEd itself described the gap as five to six years of lost learning.',
    answerTl: 'May matibay na sanggunian: tinatantya ng World Bank at UNESCO na 91% ng 10-taong gulang na batang Pilipino ang hindi nakauunawa ng tamang teksto. Ika-77 sa 81 bansa ang Pilipinas sa PISA 2022 reading.'
  },
  {
    id: 2,
    section: 'Problem & Evidence',
    question: 'Your citations are about reading. Where is the evidence that writing feedback is the gap?',
    questionTl: 'Tungkol sa pagbasa ang inyong sanggunian. Nasaan ang patunay na ang feedback sa pagsusulat ang suliranin?',
    answer: 'That narrowing is our reasoned inference, not something PISA or the learning poverty data measure directly, since neither tests creative writing. Narrative writing demands high structural and comprehension skill, and we say openly that this sub-claim is our team’s reasoned inference.',
    answerTl: 'Makatwirang hinuha ito ng grupo: ang pagsulat ay nangangailangan ng mataas na antas ng pag-unawa. Hayagan naming sinasabi na ito ay hinuha mula sa datos ng literacy.'
  },
  {
    id: 3,
    section: 'Product & Technology',
    question: 'What is KwentoHabi in one sentence?',
    questionTl: 'Ano ang KwentoHabi sa iisang pangungusap?',
    answer: 'KwentoHabi is an AI writing-feedback platform for Filipino students that checks their writing against a teacher’s own materials, flags where classmates contradict each other in group stories, and keeps the story space age-appropriate and teacher-controlled.',
    answerTl: 'Ang KwentoHabi ay isang AI platform para sa feedback sa pagsusulat ng mga estudyanteng Pilipino na sumusuri sa gawa batay sa materyales ng guro, nagtuturo ng salungatan sa group stories, at nagpapanatili ng ligtas at kontroladong espasyo.'
  },
  {
    id: 4,
    section: 'Product & Technology',
    question: 'What is your single biggest differentiator? Why can’t students just use ChatGPT?',
    questionTl: 'Ano ang inyong pinakamalaking pagkakaiba? Bakit hindi na lang ChatGPT?',
    answer: 'Cross-author continuity checking: tracking facts by author across a shared story world and flagging where one student contradicts what another established. A general chatbot reviews one document in one session. It has no class roster, no rubric, no memory of what a student wrote last month, and no way to reconcile facts across several students.',
    answerTl: 'Ang cross-author continuity checking. Ang ChatGPT ay pang-isahang session lamang, walang class roster, walang rubric, at walang alaala ng isinulat ng iba pang kaklase sa iisang mundo ng kuwento.'
  },
  {
    id: 5,
    section: 'Product & Technology',
    question: 'Does the AI just rewrite the student’s story?',
    questionTl: 'Muli bang isinusulat ng AI ang kuwento ng estudyante?',
    answer: 'No. KwentoHabi uses a Socratic style: it flags the inconsistency and asks whether it was intentional (e.g. an unreliable narrator). The student stays the author; KwentoHabi is a feedback layer, not a ghostwriter.',
    answerTl: 'Hindi kailanman. Estilong Socratic ang gamit: itinuturo ang hindi pagkakatugma at itinatanong kung sinadya. Ang mag-aaral ang nananatiling may-akda.'
  },
  {
    id: 6,
    section: 'Safe Story Space',
    question: 'Are you claiming KwentoHabi prevents violence in schools?',
    questionTl: 'Sinasabi ba ninyong napipigilan ng KwentoHabi ang karahasan sa paaralan?',
    answer: 'No. No evidence supports that and we never claim it. The defensible claim is narrower: students get repeated, structured classroom practice at disagreeing respectfully, resolving conflict, and being accountable, inside a space designed to be age-appropriate and teacher-controlled.',
    answerTl: 'Hindi namin kailanman inaangkin iyan. Ang totoo: nagbibigay ito ng may-estrukturang pagsasanay sa magalang na pakikipagtalo at paglutas ng alitan sa loob ng silid-aralan.'
  },
  {
    id: 7,
    section: 'Safe Story Space',
    question: 'Do you ban violence completely? What about classic literature like Noli Me Tangere?',
    questionTl: 'Ipinagbabawal ba ninyo nang tuluyan ang karahasan? Paano ang mga akdang tulad ng Noli Me Tangere?',
    answer: 'We do not ban violence; we use "age-appropriate and teacher-controlled." Teachers choose the content level (strict default for junior high, moderate, or literature study). Passages are not auto-deleted—they go to the teacher to review in pedagogical context.',
    answerTl: 'Hindi ipinagbabawal; angkop sa edad at kontrolado ng guro. May antas para sa "Literature Study" upang mapag-aralan ang mga klasikong akda nang may gabay.'
  },
  {
    id: 8,
    section: 'Business & Corporation',
    question: 'Why is KwentoHabi registered as a Corporation instead of Sole Proprietorship or LLC?',
    questionTl: 'Bakit Corporation ang KwentoHabi at hindi Sole Proprietorship o LLC?',
    answer: 'With six co-founders, a stock Corporation under the Revised Corporation Code (RA 11232) allows shared ownership through shares and limits personal liability. That matters because the platform handles student data, and schools expect a formally registered entity. "LLC" is a US designation not recognized in Philippine corporate law.',
    answerTl: 'Anim ang aming co-founders, kaya kailangan ng paghahati ng shares at limited liability para protektahan ang personal na ari-arian. Ang "LLC" ay terminong Amerikano at hindi umiiral sa batas ng Pilipinas.'
  },
  {
    id: 9,
    section: 'Unit Economics',
    question: 'Do your unit economics work? How do you survive the 6-12 month procurement cycle?',
    questionTl: 'Kikita ba ang inyong unit economics? Paano makakaligtas sa 6 hanggang 12 buwang procurement?',
    answer: 'At an estimated $0.02 to $0.05 per check, about 20 checks/student/month equals ~$0.40 to $1.00 monthly cost—well below the projected ₱50 to ₱100 per-seat annual/semester fee. We survive procurement via pilot schools, lean cloud architecture, free archive access as the acquisition wedge, and CSR corporate sponsorships.',
    answerTl: 'Napakaliit ng gastos sa AI ($0.40–$1.00 kada buwan bawat estudyante) kumpara sa inaasahang ₱50–₱100 lisensya. Nakatutulong ang libreng archive bilang acquisition wedge at mga CSR sponsorship.'
  },
  {
    id: 10,
    section: 'SDG & Social Impact',
    question: 'Which SDGs does KwentoHabi align with?',
    questionTl: 'Sa aling mga SDG nakalinya ang KwentoHabi?',
    answer: 'SDG 4 (Quality Education, including target 4.7 on culture of peace) is primary. SDG 16 (Peace, Justice, Strong Institutions) is secondary through classroom practice in peaceful conflict resolution. SDG 9 (Infrastructure & Innovation) reflects our reconciliation engine, and SDG 10 (Reduced Inequalities) reflects CSR-sponsored licenses.',
    answerTl: 'SDG 4 (Quality Education) ang pangunahin, kasama ang target 4.7. Pangalawa ang SDG 16 para sa mapayapang paglutas ng alitan. Sumusuporta rin ang SDG 9 at SDG 10.'
  }
];

export const INITIAL_RUBRICS: RubricStandard[] = [
  {
    id: 'deped-creative-writing',
    title: 'DepEd Grade 9-10 Creative Writing Competency Rubric',
    author: 'Department of Education (Curriculum Guide)',
    category: 'Institutional Standard',
    criteria: [
      { name: 'Kaisahan ng Banghay (Plot Consistency)', description: 'Logical flow of events without unexplained contradictions or narrative ruptures.', weight: 30 },
      { name: 'Pagbuo ng Tauhan (Characterization)', description: 'Consistent portrayal of motives, physical attributes, and personality traits.', weight: 25 },
      { name: 'Tagpuan at Atmospera (Setting & Atmosphere)', description: 'Sensory grounding in local environment (e.g. coastal Philippine villages, town centers).', weight: 20 },
      { name: 'Kolaborasyon at Paggalang (Cross-Author Respect)', description: 'How well authors weave into peers’ established facts and resolve plot divergence.', weight: 25 }
    ],
    exemplarText: 'Si Lia ay humakbang sa buhanginan ng Batangas. Ang bawat alon ay may dalang alaala ng kanyang amang mangingisda...'
  },
  {
    id: 'shs-literary-critique',
    title: 'Senior High 21st Century Philippine Literature Rubric',
    author: 'UST CICS / DepEd Senior High',
    category: 'Senior High School',
    criteria: [
      { name: 'Depth of Conflict & Resolution', description: 'Resolution of social, natural, or interpersonal dilemmas through meaningful narrative choice.', weight: 35 },
      { name: 'Use of Literary Devices (Point of View / Metaphor)', description: 'Intentional use of multiple narrators, symbolism, or cultural motifs.', weight: 35 },
      { name: 'Narrative Voice & Integrity', description: 'Stylistic continuity and authentic voice representation.', weight: 30 }
    ]
  }
];
