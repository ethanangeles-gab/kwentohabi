import { randomBytes } from "node:crypto";
import type { Express, Response } from "express";
import {
  db,
  fail,
  string,
  tokenHash,
  passwordHash,
  persist,
  publicSelf,
  teacherOnly,
  type InvitationRecord,
  type UserRecord,
} from "./store";
import { PRIVACY_VERSION } from "./privacy";
import {
  ACCOUNT_IDENTIFIER_MAX_LENGTH,
  isValidAccountIdentifier,
  normalizeAccountIdentifier,
} from "../src/utils/accountIdentifier";

export const REGISTRATION_CLASSES = ["mabini", "rizal"] as const;

const status = (invite: InvitationRecord) =>
  invite.revokedAt
    ? "revoked"
    : Date.parse(invite.expiresAt) <= Date.now()
      ? "expired"
      : invite.uses >= invite.maxUses
        ? "used"
        : "active";
const publicInvite = (invite: InvitationRecord) => ({
  id: invite.id,
  classId: invite.classId,
  role: invite.role,
  createdAt: invite.createdAt,
  expiresAt: invite.expiresAt,
  uses: invite.uses,
  maxUses: invite.maxUses,
  status: status(invite),
});

export function registerPublicRegistration(
  app: Express,
  route: any,
  signIn: (res: Response, userId: string) => void,
) {
  // Allow a classroom behind one address while bounding public password-hash work.
  const attempts = new Map<string, { count: number; until: number }>();
  app.post(
    "/api/register",
    route((req: any, res: any) => {
      const now = Date.now(),
        ip = req.ip || "local";
      if (attempts.size >= 10000) {
        for (const [key, bucket] of attempts)
          if (bucket.until <= now) attempts.delete(key);
        if (!attempts.has(ip) && attempts.size >= 10000)
          fail(429, "Account creation is busy. Please try again later.");
      }
      const bucket = attempts.get(ip);
      const current =
        bucket && bucket.until > now
          ? bucket
          : { count: 0, until: now + 15 * 60000 };
      if (current.count >= 200)
        fail(
          429,
          "Too many account creation attempts. Try again in 15 minutes.",
        );
      current.count++;
      attempts.set(ip, current);
      if (!db.users.length)
        fail(409, "Your school must complete setup before you can join.");
      if (
        Object.keys(req.body).some(
          (key) =>
            ![
              "name",
              "username",
              "password",
              "confirmPassword",
              "role",
              "classId",
              "privacyAccepted",
            ].includes(key),
        )
      )
        fail(400, "Use the account form fields only.");
      const name = string(req.body.name, "Full name"),
        username = normalizeAccountIdentifier(
          string(
            req.body.username,
            "Username / Email",
            ACCOUNT_IDENTIFIER_MAX_LENGTH,
          ),
        );
      if (/[\u0000-\u001f\u007f]/.test(name))
        fail(400, "Full name cannot contain control characters.");
      if (!isValidAccountIdentifier(username))
        fail(
          400,
          "Enter a valid email address or a username with 3-80 letters, digits, dots, underscores, or hyphens.",
        );
      const password = string(req.body.password, "Password", 128, 12);
      if (req.body.password !== req.body.confirmPassword)
        fail(400, "Passwords do not match.");
      if (req.body.role !== "teacher" && req.body.role !== "student")
        fail(400, "Choose Teacher or Student before creating an account.");
      if (req.body.privacyAccepted !== true)
        fail(
          400,
          "Read and acknowledge the privacy notice before creating an account.",
        );
      const role: "teacher" | "student" = req.body.role;
      // No join code: students choose their class; teachers join every class.
      let classIds: string[];
      if (role === "teacher") classIds = [...REGISTRATION_CLASSES];
      else {
        const classId = string(req.body.classId, "Class");
        if (!(REGISTRATION_CLASSES as readonly string[]).includes(classId))
          fail(400, "Choose your class.");
        classIds = [classId];
      }
      if (db.users.some((user) => user.username === username))
        fail(409, "Username already exists.");
      const user: UserRecord = {
        id: randomBytes(12).toString("hex"),
        name,
        username,
        hash: passwordHash(password),
        role,
        classIds,
        isDemo: false,
        registration: {
          at: new Date(now).toISOString(),
          noticeVersion: PRIVACY_VERSION,
        },
      };
      db.users.push(user);
      try {
        signIn(res, user.id);
      } catch (error) {
        db.users.splice(db.users.indexOf(user), 1);
        for (const [key, session] of Object.entries(db.sessions))
          if (session.userId === user.id) delete db.sessions[key];
        throw error;
      }
      res.status(201).json({ user: publicSelf(user) });
    }),
  );
}

export function registerInvitationRoutes(app: Express, route: any) {
  const assignedClass = (req: any, value: unknown) => {
    teacherOnly(req.user);
    const classId = string(value, "Class");
    if (!req.user.classIds.includes(classId))
      fail(403, "Choose a class you teach.");
    return classId;
  };
  app.get(
    "/api/invitations",
    route((req: any, res: any) => {
      const classId = assignedClass(req, req.query.classId);
      const items = Object.values(db.invitations)
        .filter((invite) => invite.classId === classId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      res.json({
        invitations: [
          ...items.filter((invite) => status(invite) === "active"),
          ...items.filter((invite) => status(invite) !== "active").slice(0, 50),
        ].map(publicInvite),
      });
    }),
  );
  app.post(
    "/api/invitations",
    route((req: any, res: any) => {
      const classId = assignedClass(req, req.body.classId),
        role = req.body.role,
        maxUses = req.body.maxUses;
      if (role !== "teacher" && role !== "student")
        fail(400, "Choose a student or teacher invitation.");
      if (
        !Number.isInteger(maxUses) ||
        maxUses < 1 ||
        maxUses > 100 ||
        (role === "teacher" && maxUses !== 1)
      )
        fail(
          400,
          "Student codes allow 1-100 accounts. Teacher codes are single-use.",
        );
      if (
        Object.values(db.invitations).filter(
          (invite) => invite.classId === classId && status(invite) === "active",
        ).length >= 100
      )
        fail(400, "Revoke an unused join code before creating another.");
      const old = Object.entries(db.invitations)
        .filter(([, invite]) => status(invite) !== "active")
        .sort(([, a], [, b]) => a.createdAt.localeCompare(b.createdAt));
      while (Object.keys(db.invitations).length >= 1000 && old.length)
        delete db.invitations[old.shift()![0]];
      if (Object.keys(db.invitations).length >= 1000)
        fail(400, "Revoke an unused join code before creating another.");
      const code = randomBytes(12).toString("hex").toUpperCase(),
        now = new Date();
      const invite: InvitationRecord = {
        id: randomBytes(12).toString("hex"),
        classId,
        role,
        maxUses,
        uses: 0,
        createdBy: req.user.id,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
      };
      db.invitations[tokenHash(code)] = invite;
      persist();
      res.status(201).json({
        invitation: publicInvite(invite),
        code: code.match(/.{1,6}/g)!.join("-"),
      });
    }),
  );
  app.post(
    "/api/invitations/:id/revoke",
    route((req: any, res: any) => {
      teacherOnly(req.user);
      const invite = Object.values(db.invitations).find(
        (item) =>
          item.id === req.params.id && req.user.classIds.includes(item.classId),
      );
      if (!invite) fail(404, "Join code not found in your classes.");
      invite!.revokedAt = new Date().toISOString();
      invite!.revokedBy = req.user.id;
      persist();
      res.json({ invitation: publicInvite(invite!) });
    }),
  );
}
