import fs from "node:fs";
import path from "node:path";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import {
  INITIAL_STORIES,
  INITIAL_RUBRICS,
  AUTHORS,
} from "../src/data/initialData";
import type {
  StoryWorkspace,
  RubricStandard,
  SessionUser,
  ResolutionLogEntry,
  ConsentRecord,
  ChapterRevision,
} from "../src/types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
export const string = (
  v: unknown,
  label: string,
  max = 200,
  min = 1,
): string => {
  if (typeof v !== "string" || v.trim().length < min || v.length > max)
    fail(400, `${label} must contain ${min}-${max} characters.`);
  return (v as string).trim();
};
export function passwordHash(
  password: string,
  salt = randomBytes(16).toString("hex"),
) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function passwordMatches(password: string, hash: string) {
  const [salt, key] = hash.split(":");
  return timingSafeEqual(
    Buffer.from(key, "hex"),
    Buffer.from(passwordHash(password, salt).split(":")[1], "hex"),
  );
}
export const tokenHash = (v: string) =>
  createHash("sha256").update(v).digest("hex");
export type UserRecord = SessionUser & { username: string; hash: string };
export interface Database {
  schema: number;
  school: string;
  users: UserRecord[];
  stories: StoryWorkspace[];
  rubrics: RubricStandard[];
  usage: Record<string, { month: string; count: number }>;
  sessions: Record<string, { userId: string; expires: number }>;
  consents: Record<string, ConsentRecord>;
  history: Record<string, ChapterRevision[]>;
}
const filename = path.join(
  path.resolve(process.env.DATA_DIR || "data"),
  "workspace.json",
);
// This backend must never run two writers against an in-memory JSON snapshot.
const lockFile = filename + ".lock";
fs.mkdirSync(path.dirname(filename), { recursive: true });
if (fs.existsSync(lockFile)) {
  const owner = Number(fs.readFileSync(lockFile, "utf8"));
  if (!Number.isSafeInteger(owner) || owner < 1)
    throw new Error(
      "Invalid storage lock. Stop the server and inspect workspace.json.lock before restarting.",
    );
  try {
    process.kill(owner, 0);
    throw new Error(
      "This DATA_DIR is already in use. Run one server process or use a different directory.",
    );
  } catch (error: any) {
    if (error.code !== "ESRCH") throw error;
    fs.unlinkSync(lockFile);
  }
}
fs.writeFileSync(lockFile, String(process.pid), { flag: "wx", mode: 0o600 });
process.once("exit", () => {
  try {
    if (fs.readFileSync(lockFile, "utf8") === String(process.pid))
      fs.unlinkSync(lockFile);
  } catch {}
});
export const db: Database = fs.existsSync(filename)
  ? JSON.parse(fs.readFileSync(filename, "utf8"))
  : {
      schema: 1,
      school: "",
      users: [],
      stories: [],
      rubrics: structuredClone(INITIAL_RUBRICS),
      usage: {},
      sessions: {},
      consents: {},
      history: {},
    };
db.consents ??= {};
db.history ??= {};
for (const story of db.stories) {
  story.evaluations ??= {};
  story.wikiEntries ??= [];
  story.status ??= "active";
  story.isDemo ??= ["story-lia", "story-makiling"].includes(story.id);
}
for (const user of db.users)
  user.isDemo ??= Boolean(
    AUTHORS[user.id] && user.name === AUTHORS[user.id].name,
  );
export function persist() {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const temp = filename + ".tmp",
    fd = fs.openSync(temp, "w", 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify(db, null, 2));
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(temp, filename);
}
export const publicUser = (u: UserRecord): SessionUser => ({
  id: u.id,
  name: u.name,
  role: u.role,
  classIds: u.classIds,
  isDemo: u.isDemo,
  consentStatus:
    u.role === "student"
      ? db.consents[u.id]?.status || (u.isDemo ? "not-required" : "pending")
      : undefined,
});
export function setup(school: string, username: string, password: string) {
  if (db.users.length) fail(409, "This school is already configured. Sign in.");
  db.school = school;
  db.users.push({
    id: "teacher",
    name: "Class Teacher",
    username,
    hash: passwordHash(password),
    role: "teacher",
    classIds: ["mabini", "rizal"],
    isDemo: false,
  });
  const accounts = Object.values(AUTHORS).map((a) => {
    const temporaryPassword = randomBytes(12).toString("base64url");
    db.users.push({
      id: a.id,
      name: a.name,
      username: a.id,
      hash: passwordHash(temporaryPassword),
      role: "student",
      classIds: [a.id === "ethan" || a.id === "sophia" ? "rizal" : "mabini"],
      isDemo: true,
    });
    return { username: a.id, password: temporaryPassword };
  });
  db.stories = INITIAL_STORIES.map((s, i) =>
    makeStory({
      ...s,
      classId: i === 0 ? "mabini" : "rizal",
      memberIds: [...new Set(s.chapters.map((c) => c.authorId))],
      mode: "shared",
      isDemo: true,
    }),
  );
  persist();
  return accounts;
}
export function makeStory(input: Partial<StoryWorkspace>): StoryWorkspace {
  return {
    id: randomBytes(12).toString("hex"),
    title: "",
    genre: "",
    gradeLevel: "",
    description: "",
    classId: "",
    memberIds: [],
    mode: "shared",
    chapters: [],
    version: 1,
    revision: 1,
    checkedRevision: null,
    contradictions: [],
    facts: [],
    safetyFlags: [],
    resolutions: {},
    notes: {},
    logs: [],
    contentLevel: "strict",
    selectedRubricId: db.rubrics[0]?.id || "",
    summary: "",
    checkMethod: "unchecked",
    contributions: [],
    evaluations: {},
    wikiEntries: [],
    status: "active",
    isDemo: false,
    ...input,
  };
}
export function rememberChapter(
  story: StoryWorkspace,
  chapter: StoryWorkspace["chapters"][number],
) {
  const history = (db.history[story.id] ??= []);
  if (
    history.some(
      (item) =>
        item.chapterId === chapter.id &&
        item.text === chapter.text &&
        item.title === chapter.title,
    )
  )
    return;
  history.push({
    ...structuredClone(chapter),
    revisionId: randomBytes(12).toString("hex"),
    chapterId: chapter.id,
    savedAt: new Date().toISOString(),
  } as ChapterRevision);
  while (history.filter((item) => item.id === chapter.id).length > 20)
    history.splice(
      history.findIndex((item) => item.id === chapter.id),
      1,
    );
  while (
    history.length > 200 ||
    history.reduce((sum, item) => sum + item.text.length, 0) > 2_000_000
  )
    history.shift();
}
export function canRead(user: SessionUser, story: StoryWorkspace) {
  return (
    user.classIds.includes(story.classId) &&
    (user.role === "teacher" || story.memberIds.includes(user.id))
  );
}
export function getStory(user: SessionUser, id: string): StoryWorkspace {
  const story = db.stories.find((s) => s.id === id);
  if (!story || !canRead(user, story))
    fail(404, "Story not found in your assigned class/group.");
  return story!;
}
export const teacherOnly = (user: SessionUser) => {
  if (user.role !== "teacher") fail(403, "A teacher account is required.");
};
export function checkVersion(story: StoryWorkspace, version: unknown) {
  if (story.version !== version)
    fail(
      409,
      "Another participant saved changes. Refresh and review before retrying. Your draft is retained.",
    );
}
export function log(
  story: StoryWorkspace,
  type: string,
  text: string,
  discussion?: ResolutionLogEntry["discussion"],
) {
  story.logs.unshift({
    id: randomBytes(12).toString("hex"),
    at: new Date().toISOString(),
    type,
    text,
    discussion,
  });
}
export function commit(story: StoryWorkspace) {
  story.version++;
  persist();
  return story;
}
export function invalidate(story: StoryWorkspace) {
  story.revision++;
  story.resolutions = Object.fromEntries(
    Object.entries(story.resolutions).filter(
      ([, resolution]) => resolution.type === "teacher-decided",
    ),
  );
  story.summary = "";
}
export const MONTHLY_LIMIT = Math.max(
  1,
  Math.min(10000, Number(process.env.MONTHLY_CHECK_LIMIT) || 20),
);
export const monthNow = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
export function usage(user: SessionUser) {
  const month = monthNow(),
    record = db.usage[user.id];
  const used = record?.month === month ? record.count : 0;
  return {
    used,
    limit: MONTHLY_LIMIT,
    remaining: Math.max(0, MONTHLY_LIMIT - used),
    month,
  };
}
export function consume(user: SessionUser) {
  const u = usage(user);
  if (u.remaining === 0)
    fail(
      429,
      `Monthly analysis allowance exhausted (${u.limit}). Contact your teacher.`,
    );
  db.usage[user.id] = { month: u.month, count: u.used + 1 };
  persist();
}
