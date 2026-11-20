import { randomBytes } from "node:crypto";
import type { Express } from "express";
import {
  db,
  getStory,
  teacherOnly,
  string,
  fail,
  persist,
  makeStory,
  log,
} from "./store";
import { PRIVACY_NOTICE, PRIVACY_VERSION } from "./privacy";
import { extractDocument } from "./documents";
import {
  DEMO_TITLE,
  DEMO_INSTRUCTIONS,
  demoChapters,
  demoWiki,
} from "../src/data/demo";
import type { SessionUser, StoryWorkspace } from "../src/types";

export function registerClassroomRoutes(
  app: Express,
  route: any,
  visibleStory: (s: StoryWorkspace, u: SessionUser) => unknown,
) {
  const processing = new Set<string>();
  app.post(
    "/api/materials/extract",
    route(async (req: any, res: any) => {
      teacherOnly(req.user);
      if (processing.has(req.user.id))
        fail(429, "A document import is already running.");
      processing.add(req.user.id);
      try {
        res.json(await extractDocument(req.body));
      } catch (error: any) {
        if (error.status) throw error;
        fail(422, error.message || "Document import failed.");
      } finally {
        processing.delete(req.user.id);
      }
    }),
  );
  app.get(
    "/api/consents",
    route((req: any, res: any) => {
      teacherOnly(req.user);
      const users = db.users.filter(
        (u) =>
          u.role === "student" &&
          u.classIds.some((id) => req.user.classIds.includes(id)),
      );
      res.json({
        notice: PRIVACY_NOTICE,
        records: Object.fromEntries(
          users.map((u) => [
            u.id,
            db.consents[u.id] || {
              status: u.isDemo ? "not-required" : "pending",
              reference: u.isDemo ? "Fictional sample account" : "",
              noticeVersion: PRIVACY_VERSION,
              recordedAt: "",
              recordedBy: "",
            },
          ]),
        ),
      });
    }),
  );
  app.post(
    "/api/users/:id/consent",
    route((req: any, res: any) => {
      teacherOnly(req.user);
      const user = db.users.find(
        (u) =>
          u.id === req.params.id &&
          u.role === "student" &&
          u.classIds.some((id) => req.user.classIds.includes(id)),
      );
      if (!user) fail(404, "Assigned student not found.");
      if (
        !["pending", "recorded", "declined", "not-required"].includes(
          req.body.status,
        ) ||
        req.body.noticeVersion !== PRIVACY_VERSION
      )
        fail(
          400,
          "Read the current privacy notice and select a valid school decision.",
        );
      const reference = string(
        req.body.reference || "",
        "School consent reference or reason",
        500,
        ["recorded", "not-required"].includes(req.body.status) ? 6 : 0,
      );
      db.consents[user!.id] = {
        status: req.body.status,
        reference,
        noticeVersion: PRIVACY_VERSION,
        recordedAt: new Date().toISOString(),
        recordedBy: req.user.id,
      };
      persist();
      res.json({ record: db.consents[user!.id] });
    }),
  );
  app.get(
    "/api/stories/:id/chapters/:chapterId/history",
    route((req: any, res: any) => {
      const story = getStory(req.user, req.params.id),
        chapter = story.chapters.find((c) => c.id === req.params.chapterId);
      if (!chapter) fail(404, "Chapter not found.");
      if (req.user.role !== "teacher" && chapter!.authorId !== req.user.id)
        fail(403, "Only the author and teacher can read revision history.");
      res.json({
        versions: (db.history[story.id] || [])
          .filter((item) => item.chapterId === chapter!.id)
          .slice()
          .reverse(),
      });
    }),
  );
  app.get(
    "/api/stories/:id/export",
    route((req: any, res: any) => {
      teacherOnly(req.user);
      const s = getStory(req.user, req.params.id);
      const report = {
        title: s.title,
        gradeLevel: s.gradeLevel,
        mode: s.mode,
        status: s.status,
        instructions: s.instructions,
        dueAt: s.dueAt,
        revision: s.revision,
        checkedRevision: s.checkedRevision,
        exportedAt: new Date().toISOString(),
        chapters: s.chapters,
        facts: s.facts,
        conflicts: s.contradictions,
        resolutions: s.resolutions,
        notes: s.notes,
        reviewFlags: s.safetyFlags,
        history: s.logs,
        contributions: s.contributions,
        evaluations: Object.values(s.evaluations || {}),
        wiki: s.wikiEntries,
      };
      if (req.query.format === "csv") {
        const cell = (v: unknown) =>
          '"' +
          String(v ?? "")
            .replace(/^[=+@\-\t\r]/, "' $&")
            .replaceAll('"', '""') +
          '"';
        const rows = [
          [
            "Chapter",
            "Author",
            "Title",
            "Submitted at",
            "Words",
            "Review status",
          ],
          ...s.chapters.map((c) => [
            c.id,
            db.users.find((u) => u.id === c.authorId)?.name || c.authorId,
            c.title,
            c.at,
            c.text.trim().split(/\s+/).filter(Boolean).length,
            s.safetyFlags
              .filter((f) => f.chapter === c.id)
              .map((f) => f.decision || "pending")
              .join("; "),
          ]),
        ];
        res.setHeader("Content-Type", "text/csv;charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="kwentohabi-${s.id}.csv"`,
        );
        return res.send(
          "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n"),
        );
      }
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="kwentohabi-${s.id}.json"`,
      );
      res.json(report);
    }),
  );
  app.post(
    "/api/demo-story",
    route((req: any, res: any) => {
      teacherOnly(req.user);
      if (!req.user.classIds.includes("mabini"))
        fail(403, "The fictional example belongs to the Mabini sample class.");
      const existing = db.stories.find((s) => s.id === "demo-huling-habi");
      if (existing) return res.json(visibleStory(existing, req.user));
      const s = makeStory({
        id: "demo-huling-habi",
        title: DEMO_TITLE,
        genre: "Filipino folklore / Original fictional demonstration",
        gradeLevel: "Grade 9 - Seksyon Mabini",
        description:
          "Original fictional demonstration. Practice author attribution, discussion, teacher review and references with one story.",
        classId: "mabini",
        memberIds: ["maria", "jose", "ana"],
        isDemo: true,
        mode: "shared",
        instructions: DEMO_INSTRUCTIONS,
        chapters: demoChapters(),
        wikiEntries: demoWiki(req.user.id),
      });
      log(
        s,
        "Fictional example added",
        "Original fictional example, not real student work or research data.",
      );
      db.stories.push(s);
      persist();
      res.status(201).json(visibleStory(s, req.user));
    }),
  );
}
