# KwentoHabi

A teacher-led writing workspace: students author their stories, teachers guide revision, and evidence-linked checks surface details worth discussing. Version 1.2 includes the second QA pass dated 20 November 2026.

## Run locally

Use Node.js 22.14 or newer. From this folder:

```powershell
npm ci
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open http://localhost:3000. First-run setup creates the school and teacher account. Use a password of at least 12 characters. Separate fictional sample accounts receive random passwords shown once; save those privately. Add actual learners through **Teacher review > Manage classroom accounts** rather than treating fictional sample accounts as real student records. Every user can change their password under **Account**. Teachers can reset assigned students' passwords and clear their failed-login lock; resets revoke that student's other sessions.

The server binds to `127.0.0.1` by default. Complete setup before allowing network access. On Windows, stop a development process before running `npm ci` if native build-library files are locked. Existing `.env.local` settings and credentials should be preserved.

## Writing and review

- Student and teacher home screens prioritize their next action. Assignment cards distinguish private/group work, deadlines, lifecycle status, and fictional examples. Participation bars count members with a saved chapter; they are not a measure of effort or learning.
- New chapters and existing-chapter revisions have separate retained buffers. Opening another chapter does not discard unfinished writing. Successful saves acknowledge their submitted snapshot; text typed while waiting remains a draft of the saved chapter.
- Drafts autosave **in this browser**, not automatically as submitted chapters. A visible warning appears when browser storage is unavailable/full. Download a copy when needed. Save chapter submits it to the server. Undo/redo and focus-writing controls are available. Revision history is restricted to the author and assigned teacher; restoring creates another draft first. History retains up to 20 unique versions/chapter within a 200-version/2-million-character story archive.
- By default, saving a chapter also runs a bounded local continuity check immediately, without using the monthly manual-check allowance or sending work to Google. Students can turn after-save checking off. Manual optional-AI checks remain available; the result clearly identifies the method used.
- Involved students save their own perspective notes. **Ask teacher** requires only the requesting student's note, so an absent peer cannot prevent escalation. Adopting/keeping versions through peer agreement still requires both notes. Teachers can also initiate review directly.
- A teacher decision stays locked until the teacher reopens it. Unchanged teacher evidence remains protected when another chapter is edited or the story is rechecked. Changing the actual evidence invalidates that agreement for the changed case. Decisions never automatically rewrite manuscripts.
- Teachers can review chapters with written feedback, request revision, moderate passages, filter by student/submission date, and export story/review history as JSON or contribution summaries as CSV. Teacher review and AI feedback are separate; the teacher assigns final grades.
- Teachers set assignment instructions/deadlines and can close, archive, or reopen assignments. Closed/archived assignments are read-only for student writes. Archiving does not erase records.
- The wiki separates human-authored character/location/object/event/relationship/rule profiles from extracted source evidence. Profiles can cite real chapters and retain their authorship.

Authorized sessions poll for committed updates every five seconds. That indicator does not mean an unsubmitted draft has reached the server. Saves reject stale story versions and changed chapter base text instead of silently replacing newer work.

## References and saved feedback

Teachers can paste reference text or import PDF, DOCX, or UTF-8 TXT files. Imports accept up to 4 MB, at most 50 PDF pages, and at most 50,000 retained text characters. DOCX expansion is bounded; parsing runs in a separate process with processing limits and without AI credentials. Scanned PDFs need OCR, encrypted files must be unlocked, and legacy DOC files must be converted to DOCX. The app reports unreadable/oversized files and truncated text.

Importing only creates a preview. Teachers review/edit the extracted text, complete criteria/descriptions/weights totaling 100, supply source/license details, and attest permission before saving. Materials remain private to this school and can be withdrawn. The actual complete selected reference is sent to optional AI feedback. Sample rubrics are illustrative, not verified official standards.

Feedback reports are saved by account/story/rubric/revision/language/method preference. They survive navigation, reload, and server restart. Reopening an unchanged report costs no additional allowance. **Regenerate feedback (uses allowance)** explicitly requests another attempt. Changed writing or references mark older feedback outdated. At most 30 recent reports are kept per story. Provider evidence/feedback lengths are bounded before persistence.

Without valid AI evaluation, reports use the selected criteria and actual reading excerpts but leave scores unassigned. These excerpts are prompts for teacher reading, not proof that the criterion was met.

## Privacy, guardian records, and fictional demonstration

**Privacy & guardian notice** is available at sign-in and under Account/Help. Teachers record each actual learner's school decision and an internal consent/notice reference in the roster. Pending/declined records prevent provider requests for that learner's work; automatic local checking and teacher-led review remain available. Recorded/not-required statuses document the school's assertion, not an automatically verified legal determination. The app does not contact guardians or send counselor referrals. Schools must conduct their actual notice/consent and safeguarding process outside this recordkeeping feature.

Shared-device drafts remain readable through browser storage tools. Account offers **Clear my local drafts on sign-out**; downloading a copy and clearing the browser are also available. Private stories are restricted to their author/teacher. Shared story membership is enforced on the server. Moderation cues are restricted to the teacher and affected author.

Teachers can choose **Open fictional demo** to add **Ang Huling Habi**, an original Filipino-inspired example with source-linked profiles and planted continuity differences. It does not overwrite existing assignments. Sample accounts, story content, and illustrative feedback are labeled fictional; they are not research findings or actual student performance.

The two supplied practice classes remain Mabini and Rizal. General multi-school tenancy, additional-class administration, automatic notifications, public sharing, billing, marketplace payments, CSR administration, and counselor handoff automation remain rollout work.

## Configuration and HTTPS proxies

The server loads `.env.local` before `.env`; existing process environment values take precedence. Keep keys server-side.

- `GEMINI_API_KEY`: optional. Blank uses limited local checks and unscored teacher-review feedback.
- `GEMINI_MODEL`: model available to your account; default `gemini-2.5-flash`. Real provider access and accuracy still need verification with an authorized key.
- `MONTHLY_CHECK_LIMIT`: default 20 per account/calendar month in Asia/Manila. Manual checks and generated evaluations share the allowance; attempts count even if a provider fails or a stale result is rejected. Cached reports and automatic local after-save checks do not consume it.
- `DATA_DIR`: persistent directory, default `data`; never put it under `public`.
- `PORT`: default 3000. `HOST`: default `127.0.0.1`.
- `APP_ORIGIN`: exact external origin, such as `https://writing.your-school.example`. No path, query, or credentials.
- `TRUST_PROXY`: explicitly trusted proxy addresses/networks, such as `loopback` or `10.0.0.5/32`. The proxy must sanitize/overwrite forwarding headers. Do not trust all addresses or expose an unintended bypass path to the app.
- `COOKIE_SECURE`: `true` when accessed over HTTPS.

With a TLS-terminating proxy, set the canonical public origin and the actual trusted proxy boundary. Trusted HTTPS same-origin writes and foreign-origin rejection have local HTTP/header simulation tests; the final deployed HTTPS setup still requires verification.

## Storage, backup, and recovery

The current backend is an atomic JSON store with a process lock. A second writer to the same DATA_DIR is refused. This protects the local/single-server deployment; it does **not** provide managed shared storage, horizontal scaling, or multi-tenant database isolation. Do not run multiple replicas against this file. Backups contain school records and password hashes and must be protected.

Create a backup to a new file, and inspect its checksum:

```powershell
npm run storage:backup -- --data-dir data --file school-backup.json
npm run storage:inspect -- --file school-backup.json
```

To restore, first stop the server. Restore checks the backup identity/checksum, retains the previous workspace, and revokes copied sessions so users must sign in again:

```powershell
npm run storage:restore -- --data-dir data --file school-backup.json
npm run start:production
```

A checksum detects accidental alteration; use a backup from a trusted source. Restoring while the server is running is refused. If a stale lock exists after an abnormal stop, the app verifies the recorded process is no longer alive before reclaiming it. Do not manually remove a lock belonging to an active server.

Schools must set their retention/deletion, recovery access, and backup-storage procedures. History/report count limits and assignment archiving are not a comprehensive school retention policy. Managed storage, encrypted transport/storage, deployment monitoring, account recovery operations, and school acceptance remain production gates.

## Build and verification

```powershell
npm run lint
npm test
npm run test:browser
npm audit
npm run build
npm run start:production
```

`lint` is TypeScript checking. Automated tests use synthetic records and controlled local provider responses; they do not contact Google. Test databases are created in generated system temporary directories and removed afterward, so a fresh checkout does not need a pre-existing `tmp` folder. Screenshots and browser result summaries are intentionally retained under `tmp`.

The browser command uses installed Chrome headlessly. It runs the original teacher layout suite, additional student/BMC language-and-size states, delayed-save/storage-failure/report/import/privacy workflows, and WCAG-tagged axe checks on selected flows. Automated accessibility checks do not certify full WCAG compliance or replace screen-reader/disabled-user testing. Physical mobile devices, other browsers, actual hosting, and live AI reasoning/cost/latency remain unverified.

`npm run preview` starts the full production Express app and APIs after a build. Use `package-lock.json` for the verified dependencies. On school-sized workloads, evaluate network/save/load budgets on the intended devices before release; no educational-outcome, availability, or production-scale guarantee is made.

See [QA_FIXES.md](QA_FIXES.md) for the second-pass issue mapping, test evidence, and original QA history. Source PDFs remain unchanged. Business calculator defaults still correctly show a loss under the explicit annual-fee and FX assumptions; historical source graphics are not a validated pricing model.
