# KwentoHabi

A teacher-led writing workspace for group and private individual stories, with source-attributed continuity review, teacher references, and manual manuscript revision.

## Run locally

Use Node.js 22.14 or newer. From this folder:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. On first launch, create the school and teacher password (at least 12 characters). Setup generates separate sample student accounts and displays their random passwords once. Save those details privately. Teachers can add real students or reset their passwords from **Teacher review > Class roster**. Every user can change their own password. Passwords are hashed; there are no shared default credentials.

Only initialize a school you are authorized to administer. The server binds to `127.0.0.1` by default, so complete first-run setup before allowing network access.

The two sample classes are Mabini (Grade 9) and Rizal (Grade 10). Seed chapters are examples, initially marked unchecked; they do not count as new weekly contributions. Teachers create shared assignments with selected class members. Students can create private individual stories visible only to themselves and their assigned teacher.

## Configuration

The server loads `.env.local` before `.env`. An existing process environment value takes precedence. Keep secrets out of frontend code.

- `GEMINI_API_KEY`: optional server-side key. Leave blank for limited local checks and unscored teacher-review prompts.
- `GEMINI_MODEL`: the model available to your Google account; default `gemini-2.5-flash`. Live availability/accuracy must be verified with your own key.
- `MONTHLY_CHECK_LIMIT`: per-account monthly allowance, default 20. Continuity checks and evaluations share it. Attempts consume allowance even when the provider fails or a stale result is discarded.
- `DATA_DIR`: persistent storage directory, default `data`. Back up `workspace.json` securely. It contains student text, discussions, salted password hashes, usage, and hashed session tokens.
- `PORT`: default 3000. `HOST`: default `127.0.0.1`.
- `COOKIE_SECURE`: set `true` only when serving over HTTPS.

The app reports whether a key is configured, the method used by each check, unsaved/unchecked work, errors, and remaining allowance. A configured key is not a claim that provider access succeeds. Invalid provider evidence is rejected before rendering; a limited local result is labeled explicitly. The local parser covers a small evaluated set of English/Filipino patterns. No detected conflicts/flags is not proof that a story is consistent or suitable.

## Classroom workflow

1. Sign in with your own account and select an assigned story.
2. Students write and save their own chapters. Drafts are retained in that browser by account and story; saved work is stored on the server.
3. Run a **manual continuity check** after edits. The UI marks changed drafts and policies unchecked. Each result belongs to a specific story revision.
4. Each involved student saves their own perspective note. Discuss which version to adopt, keep both intentionally, or ask the teacher. Decisions do not rewrite the manuscript.
5. Teachers arbitrate escalations and review flagged passages. Allowed/rework statuses reach the author. No counselor notifications or external referrals are sent by this app.
6. Teachers assign complete rubrics and references. Add criteria/descriptions/weights, paste reference text, or import a `.txt` file. Review imported text and attest permission/source/license before saving. PDF/DOCX parsing is not implemented; paste selected text instead. Materials stay school-private and teachers can withdraw them.
7. Formative AI evaluation must cite exact draft excerpts. Without valid AI feedback, the report uses the selected criteria but leaves every score unassigned for teacher review. Sample rubrics are illustrative, not verified official standards.

Authorized sessions refresh every five seconds. Saves use optimistic version checks; stale saves return a conflict and retain the local draft. A chapter edit also compares the original draft text to prevent a second session of the same author silently overwriting newer work.

## Build and verification

```powershell
npm run lint
npm test
npm run test:browser
npm run build
npm run start:production
```

`lint` checks TypeScript. `npm test` runs analysis fixtures, authenticated persistence/permission tests, and a controlled local model server for malformed/stale AI responses. Browser tests use installed Google Chrome headlessly and isolated test data under `tmp`; they check both languages, 320/390/768/1440/1920px layouts, dialogs, XSS, save/reload, and draft retention. They do not contact Google. `npm run preview` starts the full production Express app with APIs; it requires a preceding build.

Use `package-lock.json` and `npm ci` for the verified dependency set.

## Deployment boundaries

This version uses an atomic JSON file and is suitable for a single server process with a persistent local disk. Do not run multiple replicas against that file. A school rollout still needs managed database/storage, HTTPS with the chosen reverse proxy configuration, backups, account recovery/provisioning, retention and consent processes, and evaluated live AI behavior. It is not a claim of legal compliance or proven educational outcomes.

Institutional billing, marketplace checkout, CSR administration, automated referrals, multi-school tenancy, and public material sharing remain planned. The calculator uses an explicitly assumed annual fee and FX; its default assumptions show a loss. Source PDFs are preserved as supplied, including any historical captions.

See [QA_FIXES.md](QA_FIXES.md) for the 44-finding disposition and validation limits.
