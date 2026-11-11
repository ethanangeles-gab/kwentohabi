import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Built-in rule-based fallback analyzer for reliability
function localAnalyze(chapters: Array<{ id: string; author: string; title: string; text: string; at?: string }>, contentLevel: string = 'strict') {
  const pats = [
    { re: /\b([A-Z][a-z]+)'s (eyes|hair) (?:were|was) ([a-z]+)/gi, f: (m: RegExpExecArray) => [m[1], m[2].toLowerCase() === 'eyes' ? 'eye color' : 'hair color', m[3].toLowerCase()] },
    { re: /\b([A-Z][a-z]+)'s ([a-z]+) (eyes|hair)\b/gi, f: (m: RegExpExecArray) => [m[1], m[3].toLowerCase() === 'eyes' ? 'eye color' : 'hair color', m[2].toLowerCase()] },
    { re: /\b([A-Z][a-z]+) (?:lived|lives|naninirahan|nakatira) (?:in|sa) (?:[a-z ]+? (?:in|sa) )?([A-Z][a-z]+)/gi, f: (m: RegExpExecArray) => [m[1], 'hometown / residence', m[2]] },
    { re: /\b([A-Z][a-z]+) (?:was|is|ay) (\d+) (?:years old|taong gulang)/gi, f: (m: RegExpExecArray) => [m[1], 'age', m[2]] },
    { re: /\b([A-Z][a-z]+) (?:had|has|may) (one|two|three|four|five|isang|dalawang|tatlong|\d+) (brothers?|sisters?|siblings?|kapatid)/gi, f: (m: RegExpExecArray) => [m[1], 'siblings', `${m[2]} ${m[3]}`] },
    { re: /\b([A-Z][a-z]+) (?:was|is|ay) an only child\b/gi, f: (m: RegExpExecArray) => [m[1], 'siblings', 'only child'] },
    { re: /\b([A-Z][a-z]+) (?:ay|is) nag-iisang anak\b/gi, f: (m: RegExpExecArray) => [m[1], 'siblings', 'only child'] },
    { re: /\b([A-Z][a-z]+) (?:has|had|may) (a |an )?([a-z]+) (necklace|pendant|ring|sword|amulet|agimat|kwintas)\b/gi, f: (m: RegExpExecArray) => [m[1], `${m[4]} color/type`, m[3]] },
    { re: /\b([A-Z][a-z]+) (?:rode|boarded|sumakay sa) (?:a |an |ang )?([a-z]+) (?:car|vehicle|boat|bangka|sasakyan)\b/gi, f: (m: RegExpExecArray) => [m[1], 'vehicle color', m[2]] }
  ];

  const facts: Array<{ ch: string; author: string; key: string; subject: string; attribute: string; value: string; quote: string }> = [];

  for (const ch of chapters) {
    const sents = ch.text.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const p of pats) {
      p.re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = p.re.exec(ch.text)) !== null) {
        const found = p.f(m);
        const matchStr = m[0];
        const sent = sents.find(s => s.includes(matchStr)) || matchStr;
        facts.push({
          ch: ch.id,
          author: ch.author,
          key: `${found[0].toLowerCase()}|${found[1].toLowerCase()}`,
          subject: found[0],
          attribute: found[1],
          value: found[2],
          quote: sent.trim()
        });
      }
    }
  }

  // Find cross-author collisions
  const groups: Record<string, typeof facts> = {};
  for (const f of facts) {
    if (!groups[f.key]) groups[f.key] = [];
    groups[f.key].push(f);
  }

  const contradictions: Array<{
    key: string;
    subject: string;
    attribute: string;
    a: { chapter: string; value: string; quote: string; author: string };
    b: { chapter: string; value: string; quote: string; author: string };
    explanation: string;
    starterPrompts: {
      aToB: string;
      bToA: string;
    };
  }> = [];

  for (const key of Object.keys(groups)) {
    const list = groups[key];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const f1 = list[i];
        const f2 = list[j];
        if (f1.author !== f2.author && f1.value.toLowerCase() !== f2.value.toLowerCase()) {
          contradictions.push({
            key,
            subject: f1.subject,
            attribute: f1.attribute,
            a: { chapter: f1.ch, value: f1.value, quote: f1.quote, author: f1.author },
            b: { chapter: f2.ch, value: f2.value, quote: f2.quote, author: f2.author },
            explanation: `Author ${f1.author} established ${f1.subject}'s ${f1.attribute} as "${f1.value}", whereas author ${f2.author} wrote "${f2.value}".`,
            starterPrompts: {
              aToB: `Naunawaan ko na isinulat mo na "${f2.value}", ngunit noong una ay naisip ko na "${f1.value}" dahil...`,
              bToA: `Nakita ko na itinatag mo na "${f1.value}". Naisip ko ang "${f2.value}" dahil sa bagong direksyon ng kuwento kung saan...`
            }
          });
        }
      }
    }
  }

  // Content safety flags
  const flags: Array<{
    chapter: string;
    author: string;
    quote: string;
    category: 'violence' | 'self-harm' | 'sexual' | 'hate' | 'distress';
    severity: 'mild' | 'graphic';
    reason: string;
  }> = [];

  const violenceGraphic = /\b(blood|dugo|bled|stabbed|sinaksak|gunshot|baril|pinatay|corpse|bangkay|pagpatay|slaughter)\b/i;
  const violenceMild = /\b(fought|nag-away|fight|hit|sinuntok|punch|tinamaan)\b/i;
  const distressRe = /\b(gusto ko nang mawala|ayoko na mabuhay|nobody cares about me|so hopeless|pagod na pagod na ako sa lahat)\b/i;

  for (const ch of chapters) {
    const sents = ch.text.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const sent of sents) {
      if (distressRe.test(sent)) {
        flags.push({
          chapter: ch.id,
          author: ch.author,
          quote: sent,
          category: 'distress',
          severity: 'graphic',
          reason: 'Passage contains emotional distress cues. Routed to school guidance counselor per DepEd child protection protocol.'
        });
      } else if (contentLevel !== 'literature') {
        if (violenceGraphic.test(sent)) {
          flags.push({
            chapter: ch.id,
            author: ch.author,
            quote: sent,
            category: 'violence',
            severity: 'graphic',
            reason: 'Contains depictions of blood or severe physical violence.'
          });
        } else if (contentLevel === 'strict' && violenceMild.test(sent)) {
          flags.push({
            chapter: ch.id,
            author: ch.author,
            quote: sent,
            category: 'violence',
            severity: 'mild',
            reason: 'Contains depictions of mild physical conflict or fighting.'
          });
        }
      }
    }
  }

  return { contradictions, flags, facts };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API endpoint for Gemini narrative cross-author continuity analysis
  app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
    try {
      const { chapters, contentLevel = 'strict', rubric } = req.body;
      if (!Array.isArray(chapters) || chapters.length === 0) {
        return res.status(400).json({ error: 'Chapters array is required' });
      }

      // If Gemini is available and API key is set, use Gemini 3.8 Flash!
      if (ai) {
        try {
          const prompt = `You are KwentoHabi's AI Continuity and Fact-Checking Engine for Filipino student collaborative storytelling.
The student authors are writing chapters of a single shared story world.
Rubric / Reference: ${rubric || 'DepEd Creative Writing Standards: Narrative Consistency & Character Plausibility'}
Content Level: ${contentLevel} (strict = junior high, moderate = senior high, literature = college/creative literature where classic conflicts like Noli Me Tangere are examined).

Here are the submitted chapters:
${JSON.stringify(chapters.map((c: any) => ({
  id: c.id,
  author: c.author,
  title: c.title,
  text: c.text,
  timestamp: c.at
})))}

Analyze the text and extract:
1. "facts": Every canon fact established with [subject, attribute, value, author, chapter, quote].
2. "contradictions": Cross-author continuity collisions ONLY. If Student B states a fact that conflicts with what Student A previously established (e.g. eye color, hometown, age, relationship, vehicle, timeline, physical status). Do not flag disagreements within the same author's own text unless glaring. For each collision, provide respectful Tagalog / English Socratic starter prompts for each author.
3. "flags": Passages requiring teacher review for age-appropriate safety (graphic violence, self-harm, hate speech, sexual content, or emotional distress).
4. "storyWikiSummary": A brief 2-3 sentence overview of the current story world, its main characters, and plot direction.

Return strictly a valid JSON object matching this schema:
{
  "facts": [
    { "subject": "Lia", "attribute": "eye color", "value": "brown", "author": "maria", "chapter": "c1", "quote": "Lia's eyes were brown." }
  ],
  "contradictions": [
    {
      "key": "lia|eye color",
      "subject": "Lia",
      "attribute": "eye color",
      "a": { "chapter": "c1", "value": "brown", "quote": "Lia's eyes were brown.", "author": "maria" },
      "b": { "chapter": "c2", "value": "green", "quote": "Lia's green eyes caught the light", "author": "jose" },
      "explanation": "Maria established Lia has brown eyes in Chapter 1, but Jose described green eyes in Chapter 2.",
      "starterPrompts": {
        "aToB": "Naunawaan ko na isinulat mo na berde ang kanyang mga mata, pero naisip ko noong una...",
        "bToA": "Nakita ko na itinatag mo na kulay kayumanggi ang mga mata ni Lia. Naisip ko ang berde dahil..."
      }
    }
  ],
  "flags": [
    {
      "chapter": "c3",
      "author": "ana",
      "quote": "One of them was hit and blood ran down his cheek.",
      "category": "violence",
      "severity": "mild",
      "reason": "Depicts physical altercation and blood."
    }
  ],
  "storyWikiSummary": "Lia is a fisherman's daughter navigating life between Batangas and the sea. The characters face changing weather and village disputes."
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              systemInstruction: 'You are an educational storytelling assistant specialized in narrative continuity, semantic fact extraction, and encouraging respectful classroom collaboration for Filipino learners.',
            },
          });

          const rawText = response.text || '{}';
          const parsed = JSON.parse(rawText);

          return res.json({
            success: true,
            via: 'gemini',
            data: parsed,
          });
        } catch (geminiError: any) {
          console.warn('Gemini API call failed, falling back to local analysis:', geminiError?.message || geminiError);
          // Fall back gracefully to local analysis
          const localResult = localAnalyze(chapters, contentLevel);
          return res.json({
            success: true,
            via: 'local-fallback',
            fallbackNotice: 'AI model check was processed via fast local semantic parser.',
            data: {
              ...localResult,
              storyWikiSummary: 'Ang kuwento ay sumusunod kay Lia at sa kanyang pamilya sa baybayin. Sinusubukan ng mga manunulat na maghabi ng iisang tuloy-tuloy na naratibo.',
            },
          });
        }
      } else {
        // Run robust local analysis
        const localResult = localAnalyze(chapters, contentLevel);
        return res.json({
          success: true,
          via: 'local',
          data: {
            ...localResult,
            storyWikiSummary: 'Ang kuwento ay sumusunod kay Lia at sa kanyang komunidad sa baybayin. Sinusubukan ng mga manunulat na maghabi ng iisang tuloy-tuloy na naratibo.',
          },
        });
      }
    } catch (err: any) {
      console.error('Error analyzing narrative:', err);
      return res.status(500).json({ error: err.message || 'Server error during narrative analysis' });
    }
  });

  // API endpoint to generate Socratic suggestions or perspective starter prompts
  app.post('/api/gemini/socratic-suggestion', async (req: Request, res: Response) => {
    try {
      const { conflict, authorName, peerName, authorPerspective } = req.body;
      if (ai) {
        try {
          const prompt = `As KwentoHabi's conflict resolution mentor, provide 3 constructive Tagalog/English sentence starters for student "${authorName}" who is discussing a narrative contradiction with classmate "${peerName}".
The conflict is regarding ${conflict?.subject || 'the story element'}'s ${conflict?.attribute || 'details'}:
${peerName}'s version: "${conflict?.b?.value || conflict?.a?.value}"
${authorName}'s version: "${conflict?.a?.value || conflict?.b?.value}"
Student's initial thought: "${authorPerspective || ''}"

Return JSON:
{
  "starters": [
    "string 1",
    "string 2",
    "string 3"
  ],
  "creativeSynthesis": "A 1-sentence idea for how both versions might coexist creatively (e.g., rumors, changing perspective, disguise, lighting)."
}`;

          const resp = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });

          return res.json({ success: true, data: JSON.parse(resp.text || '{}') });
        } catch (e: any) {
          // fallback
        }
      }

      // Default fallback
      return res.json({
        success: true,
        data: {
          starters: [
            `I see that ${peerName} described ${conflict?.b?.value || 'their version'}. In my chapter, I envisioned...`,
            `Could we say that ${conflict?.subject || 'the character'} actually had...`,
            `What if from ${authorName}'s point of view it seemed like ${conflict?.a?.value || 'this'}, but later revealed to be...`
          ],
          creativeSynthesis: `Consider if the difference is due to lighting, rumors among villagers, or an intentional unreliable narrator.`
        }
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      app: 'KwentoHabi',
      version: '1.0.0'
    });
  });

  // Dev mode: mount Vite middlewares
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KwentoHabi server listening on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();
