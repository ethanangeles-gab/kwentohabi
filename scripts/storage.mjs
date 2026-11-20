import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"], quiet: true });
const [command, ...args] = process.argv.slice(2);
const value = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index < 0 ? defaultValue : args[index + 1];
};
const directory = path.resolve(
  value("--data-dir", process.env.DATA_DIR || "data"),
);
const file = path.resolve(value("--file", "kwentohabi-backup.json"));
const workspace = path.join(directory, "workspace.json");
const digest = (payload) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");
function validate(payload) {
  if (
    !payload ||
    !Array.isArray(payload.users) ||
    !Array.isArray(payload.stories) ||
    !Array.isArray(payload.rubrics) ||
    !payload.sessions ||
    !payload.usage
  )
    throw Error("Not a valid KwentoHabi workspace.");
  if (
    !payload.users.every(
      (user) =>
        typeof user.id === "string" &&
        typeof user.name === "string" &&
        ["teacher", "student"].includes(user.role) &&
        typeof user.hash === "string" &&
        /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(user.hash) &&
        Array.isArray(user.classIds),
    )
  )
    throw Error("Invalid account records in backup.");
  if (
    !payload.stories.every(
      (story) =>
        typeof story.id === "string" &&
        typeof story.title === "string" &&
        Array.isArray(story.chapters) &&
        story.chapters.every(
          (ch) =>
            typeof ch.id === "string" &&
            typeof ch.authorId === "string" &&
            typeof ch.text === "string",
        ) &&
        Number.isInteger(story.version),
    )
  )
    throw Error("Invalid story records in backup.");
}
function readBackup() {
  const backup = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    backup.kind !== "KwentoHabi backup" ||
    backup.sha256 !== digest(backup.payload)
  )
    throw Error(
      "Backup identity or checksum does not match. No records were changed.",
    );
  validate(backup.payload);
  return backup;
}
try {
  if (command === "backup") {
    const payload = JSON.parse(fs.readFileSync(workspace, "utf8"));
    validate(payload);
    // Snapshot reads see a complete atomic store file. Password hashes are private backup data.
    const backup = {
      kind: "KwentoHabi backup",
      schema: 1,
      createdAt: new Date().toISOString(),
      sha256: digest(payload),
      payload,
    };
    fs.writeFileSync(file, JSON.stringify(backup), { flag: "wx", mode: 0o600 });
    console.log(
      `Backup created: ${file}. Store it privately; it includes school records and account hashes.`,
    );
  } else if (command === "inspect") {
    const backup = readBackup();
    console.log(
      JSON.stringify({
        createdAt: backup.createdAt,
        school: backup.payload.school,
        accounts: backup.payload.users.length,
        stories: backup.payload.stories.length,
        checksum: "valid",
      }),
    );
  } else if (command === "restore") {
    const backup = readBackup();
    const lock = workspace + ".lock";
    if (fs.existsSync(lock)) {
      const owner = Number(fs.readFileSync(lock, "utf8"));
      if (!Number.isSafeInteger(owner) || owner < 1)
        throw Error("Inspect the invalid storage lock before restoring.");
      try {
        process.kill(owner, 0);
        throw Error(
          "Stop the server before restoring. No records were changed.",
        );
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    }
    fs.mkdirSync(directory, { recursive: true });
    if (fs.existsSync(workspace))
      fs.copyFileSync(
        workspace,
        path.join(
          directory,
          `before-restore-${Date.now()}-${randomBytes(4).toString("hex")}.json`,
        ),
        fs.constants.COPYFILE_EXCL,
      );
    // Invalidate copied sessions so a restored backup cannot revive old sign-ins.
    backup.payload.sessions = {};
    const temporary = workspace + ".restore-tmp",
      fd = fs.openSync(temporary, "wx", 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(backup.payload));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(temporary, workspace);
    console.log(
      "Workspace restored. The previous workspace was retained and all users must sign in again.",
    );
  } else
    throw Error(
      "Usage: node scripts/storage.mjs backup|inspect|restore --data-dir <directory> --file <backup.json>",
    );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
