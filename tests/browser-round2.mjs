import { setLanguage } from "./language.mjs";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fixture } from "./runtime.mjs";
import { pdfFixture, docxFixture } from "./document-fixtures.mjs";
await mkdir("tmp", { recursive: true });
const f = await fixture({ MONTHLY_CHECK_LIMIT: "100" });
let browser;
const checks = [],
  accessibility = [];
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const teacherContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const response = await teacherContext.request.post(f.url + "/api/setup", {
    data: {
      school: "KwentoHabi Demonstration School",
      username: "round2-teacher",
      password: "round2-browser-password",
    },
  });
  assert(response.ok());
  const accounts = (await response.json()).accounts;
  const password = (id) =>
    accounts.find((account) => account.username === id).password;
  const teacher = await teacherContext.newPage();
  const errors = [];
  teacher.on("pageerror", (error) => errors.push(error.message));
  await teacher.goto(f.url);
  await setLanguage(teacher, "en");
  const workspace = async (page) =>
    (await page.request.get(f.url + "/api/workspace")).json();
  const refresh = async (page) => {
    await Promise.all([
      page.waitForResponse(
        (response) => response.url() === f.url + "/api/workspace",
      ),
      page.getByRole("button", { name: "Refresh", exact: true }).click(),
    ]);
  };
  const scan = async (page, label) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    accessibility.push({
      label,
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
  };
  await teacher
    .getByRole("heading", { name: "Guide the next chapter.", exact: true })
    .waitFor();
  await teacher.screenshot({
    path: "tmp/round2-teacher-home.png",
    fullPage: true,
  });
  await scan(teacher, "Teacher home");
  await teacher.getByRole("button", { name: "Materials", exact: true }).click();
  let evaluationCalls = 0;
  teacher.on("request", (request) => {
    if (request.url() === f.url + "/api/evaluate") evaluationCalls++;
  });
  await teacher
    .getByRole("button", { name: "Generate feedback", exact: true })
    .click();
  await teacher
    .getByText(/Teacher review required. No automated score/)
    .waitFor();
  const quotaAfter = (await workspace(teacher)).usage.used;
  await teacher
    .getByRole("button", { name: "Story wiki", exact: true })
    .click();
  await teacher.getByRole("button", { name: "Materials", exact: true }).click();
  await teacher
    .getByText(/Teacher review required. No automated score/)
    .waitFor();
  assert.equal(evaluationCalls, 1);
  await teacher.reload();
  await teacher.getByRole("button", { name: "Materials", exact: true }).click();
  await teacher
    .getByText(/Teacher review required. No automated score/)
    .waitFor();
  assert.equal((await workspace(teacher)).usage.used, quotaAfter);
  checks.push(
    "Feedback survives navigation/reload without another request or charge",
  );
  await teacher
    .getByRole("button", { name: "Add material", exact: true })
    .click();
  let dialog = teacher.getByRole("dialog");
  await dialog.getByLabel("Import document", { exact: true }).setInputFiles({
    name: "continuity.pdf",
    mimeType: "application/pdf",
    buffer: pdfFixture(
      "Reviewed PDF reference: maintain narrative continuity.",
    ),
  });
  await dialog
    .getByLabel("Reference text (optional)", { exact: true })
    .filter({ visible: true })
    .waitFor();
  await teacher.waitForFunction(() =>
    document
      .querySelector('dialog textarea[aria-label="Reference text (optional)"]')
      ?.value.includes("Reviewed PDF reference"),
  );
  await dialog.getByLabel("Import document", { exact: true }).setInputFiles({
    name: "folklore.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: docxFixture("Reviewed DOCX reference: credit every storyteller."),
  });
  await teacher.waitForFunction(() =>
    document
      .querySelector('dialog textarea[aria-label="Reference text (optional)"]')
      ?.value.includes("credit every storyteller"),
  );
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Reviewed teacher reference");
  await dialog
    .getByLabel("License or permission", { exact: true })
    .fill("Original synthetic QA material");
  await dialog
    .getByLabel("Criterion name", { exact: true })
    .fill("Attribution");
  await dialog
    .getByLabel("Description 1", { exact: true })
    .fill("Credit the source of each memory.");
  await dialog.getByRole("checkbox").check();
  await scan(teacher, "Document import dialog");
  await dialog
    .getByRole("button", { name: "Save material", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  checks.push(
    "PDF and Word text preview, editable criteria and rights attestation",
  );
  const mariaContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    maria = await mariaContext.newPage();
  maria.on("pageerror", (error) => errors.push(error.message));
  await maria.addInitScript(() => {
    if (!localStorage.getItem("kwentohabi-language"))
      localStorage.setItem("kwentohabi-language", '"en"');
  });
  await maria.goto(f.url);
  await maria
    .getByRole("combobox", { name: "Sign in as", exact: true })
    .selectOption("student");
  await maria.getByLabel(/username/i).fill("maria");
  await maria.getByLabel(/^Password\s*\*?$/).fill(password("maria"));
  await maria.getByRole("button", { name: "Sign in", exact: true }).click();
  await maria
    .getByRole("heading", {
      name: "Your next chapter starts here.",
      exact: true,
    })
    .waitFor();
  await maria.screenshot({
    path: "tmp/round2-student-home.png",
    fullPage: true,
  });
  await maria
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  const text = maria.getByRole("textbox", {
      name: "Chapter text",
      exact: true,
    }),
    title = maria.getByLabel("Chapter title", { exact: true });
  await title.fill("New chapter snapshot");
  await text.fill("Submitted new paragraph.");
  async function delayedSave(action, snapshot, later) {
    let release, started;
    const gate = new Promise((resolve) => (release = resolve)),
      ready = new Promise((resolve) => (started = resolve));
    await maria.route("**/api/stories/*/actions", async (route) => {
      if (route.request().postDataJSON().action !== action)
        return route.continue();
      const response = await route.fetch();
      started();
      await gate;
      await route.fulfill({ response });
    });
    await text.fill(snapshot);
    await maria
      .getByRole("button", { name: "Save chapter", exact: true })
      .click();
    await ready;
    await text.fill(later);
    release();
    await maria.getByText("Saved to server.", { exact: true }).waitFor();
    await maria.unroute("**/api/stories/*/actions");
    assert.equal(await text.inputValue(), later);
    await maria.reload();
    await maria
      .getByRole("button", { name: "Writing canvas", exact: true })
      .click();
    assert.equal(await text.inputValue(), later);
  }
  await delayedSave(
    "chapter-add",
    "Submitted new paragraph.",
    "Submitted new paragraph. Additional unsaved words typed while save was pending.",
  );
  await delayedSave(
    "chapter-edit",
    "Submitted revision.",
    "Submitted revision. Additional revision words typed while save was pending.",
  );
  checks.push(
    "Delayed create and revision retain newer typing after response and reload",
  );
  await maria
    .getByRole("button", { name: "New chapter draft", exact: true })
    .click();
  await text.fill("Independent unsaved new chapter.");
  await maria
    .getByRole("button", { name: "Edit below", exact: true })
    .first()
    .click();
  assert.notEqual(await text.inputValue(), "Independent unsaved new chapter.");
  await maria
    .getByRole("combobox", { name: "Retained drafts", exact: true })
    .selectOption("new");
  assert.equal(await text.inputValue(), "Independent unsaved new chapter.");
  await maria.reload();
  await maria
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  assert.equal(await text.inputValue(), "Independent unsaved new chapter.");
  checks.push("Opening an existing chapter retains a separate new draft");
  await scan(maria, "Student writing canvas");
  await teacher
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  await teacher
    .getByRole("button", { name: "Check current draft", exact: true })
    .click();
  await teacher
    .getByText("Last check: limited local parser", { exact: true })
    .waitFor();
  await teacher
    .getByRole("button", { name: "Teacher review", exact: true })
    .click();
  await teacher
    .getByRole("button", { name: "Adopt A", exact: true })
    .first()
    .click();
  await teacher
    .getByRole("heading", { name: "Locked teacher decisions", exact: true })
    .waitFor();
  let story = (await workspace(teacher)).stories.find(
      (s) => s.id === "story-lia",
    ),
    locked = story.contradictions.find(
      (c) => story.resolutions[c.key]?.type === "teacher-decided",
    );
  await refresh(maria);
  await maria.getByLabel("Choose conflict").selectOption(locked.key);
  assert(
    await maria
      .getByRole("button", { name: "Adopt B", exact: true })
      .isDisabled(),
  );
  assert(
    await maria
      .getByRole("button", { name: "Ask teacher", exact: true })
      .isDisabled(),
  );
  await teacher
    .getByRole("button", { name: "Reopen discussion", exact: true })
    .first()
    .click();
  await refresh(maria);
  await maria
    .getByRole("textbox", {
      name: "Maria Santos - Perspective note",
      exact: true,
    })
    .fill(
      "Please help me understand this difference before my partner returns.",
    );
  await maria
    .getByRole("button", { name: "Save my note", exact: true })
    .click();
  await maria.getByRole("button", { name: "Ask teacher", exact: true }).click();
  await refresh(teacher);
  story = (await workspace(teacher)).stories.find((s) => s.id === "story-lia");
  assert.equal(story.resolutions[locked.key].type, "teacher");
  assert(!story.notes[locked.key].jose);
  checks.push(
    "Locked teacher decision and unilateral help request work in the UI",
  );
  const brokenContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await brokenContext.addInitScript(() => {
    localStorage.setItem("kwentohabi-language", '"en"');
    Storage.prototype.setItem = function () {
      throw new DOMException("Test quota exhausted", "QuotaExceededError");
    };
  });
  const broken = await brokenContext.newPage();
  broken.on("pageerror", (error) => errors.push(error.message));
  await broken.goto(f.url);
  await broken
    .getByRole("combobox", { name: "Sign in as", exact: true })
    .selectOption("student");
  await broken.getByLabel(/username/i).fill("jose");
  await broken.getByLabel(/^Password\s*\*?$/).fill(password("jose"));
  await broken.getByRole("button", { name: "Sign in", exact: true }).click();
  await broken
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  await broken
    .getByLabel("Chapter text", { exact: true })
    .fill("The doctor ran a blood test.");
  await broken
    .getByRole("alert")
    .filter({ hasText: "Draft not saved locally" })
    .waitFor();
  await broken
    .getByRole("button", { name: "Save chapter", exact: true })
    .click();
  await broken.getByText("Saved to server.", { exact: true }).waitFor();
  const medicalStory = (await workspace(broken)).stories[0],
    medical = medicalStory.chapters.find(
      (c) => c.text === "The doctor ran a blood test.",
    );
  assert(medical);
  assert(!medicalStory.safetyFlags.some((f) => f.chapter === medical.id));
  checks.push(
    "Storage quota failure is visible; saving to server still works and clinical text is not flagged",
  );
  await brokenContext.close();
  const learner = await teacher.request.post(f.url + "/api/users", {
    data: {
      username: "round2-learner",
      name: "Round Two Learner",
      classId: "mabini",
    },
  });
  assert(learner.ok());
  await refresh(teacher);
  await teacher.getByText("Manage classroom accounts", { exact: true }).click();
  const row = teacher
    .getByText("Round Two Learner", { exact: true })
    .locator("..");
  await row.getByRole("button", { name: /Notice \/ consent/ }).click();
  dialog = teacher.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "School decision", exact: true })
    .selectOption("recorded");
  await dialog
    .getByRole("textbox", {
      name: "Notice/consent reference or reason",
      exact: true,
    })
    .fill("Synthetic school record QA-UI-001");
  await dialog
    .getByRole("button", { name: "Save school record", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await row.getByRole("button", { name: /Recorded/ }).waitFor();
  checks.push(
    "School guardian-authorization record is usable through the roster",
  );
  await teacher.getByRole("button", { name: "Classroom", exact: true }).click();
  await teacher
    .getByRole("button", { name: "Open fictional demo", exact: true })
    .click();
  await teacher
    .getByRole("heading", { name: "Ang Huling Habi", exact: true })
    .waitFor();
  await teacher
    .getByRole("button", { name: "Story wiki", exact: true })
    .click();
  await teacher.getByRole("heading", { name: "Amihan", exact: true }).waitFor();
  await teacher.screenshot({
    path: "tmp/round2-story-wiki.png",
    fullPage: true,
  });
  await scan(teacher, "Story wiki profiles");
  checks.push("One fictional demonstration has source-linked story profiles");
  await teacher.getByText("Help & project", { exact: true }).click();
  await teacher
    .getByRole("button", { name: "Teacher's guidance", exact: true })
    .click();
  await teacher
    .getByRole("heading", {
      name: "Guide young writers, one chapter at a time.",
    })
    .waitFor();
  await scan(teacher, "Teacher's guidance");
  checks.push("Teacher's guidance opens from the help menu and passes axe");
  await teacher.getByRole("button", { name: "Classroom", exact: true }).click();
  await teacher.setViewportSize({ width: 390, height: 844 });
  await teacher.screenshot({
    path: "tmp/round2-mobile-home.png",
    fullPage: true,
  });
  const small = await teacher.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert(small.scroll <= small.width + 1);
  await maria.setViewportSize({ width: 1440, height: 900 });
  await setLanguage(maria, "en");
  await maria.getByText("Help & project", { exact: true }).click();
  assert(
    (await maria
      .locator("#help-menu")
      .getByRole("button", { name: /^BMC|Teacher's guidance/ })
      .count()) === 0,
    "Student help menu must not show BMC or Teacher's guidance",
  );
  await maria
    .getByRole("button", { name: "Student's guidance", exact: true })
    .click();
  await maria
    .getByRole("heading", {
      name: "Your story, your voice. Let's write it well.",
    })
    .waitFor();
  await scan(maria, "Student's guidance");
  checks.push("Student's guidance replaces BMC for students and passes axe");
  let layoutStates = 0;
  for (const width of [320, 390, 768, 1440, 1920]) {
    await maria.setViewportSize({ width, height: 900 });
    for (const language of ["en", "tl"]) {
      await setLanguage(maria, language);
      for (const name of language === "en"
        ? ["Classroom", "Writing canvas", "Story wiki", "Materials"]
        : ["Silid-aralan", "Pagsusulat", "Wiki ng kuwento", "Mga materyales"]) {
        await maria.getByRole("button", { name, exact: true }).click();
        assert(
          (await maria.evaluate(() => document.documentElement.scrollWidth)) <=
            width + 1,
          `Student overflow ${name}/${language}/${width}`,
        );
        layoutStates++;
      }
      await maria
        .getByText(
          language === "en" ? "Help & project" : "Tulong at proyekto",
          { exact: true },
        )
        .click();
      await maria
        .getByRole("button", {
          name:
            language === "en"
              ? "Student's guidance"
              : "Patnubay para sa mag-aaral",
          exact: true,
        })
        .click();
      assert(
        (await maria.evaluate(() => document.documentElement.scrollWidth)) <=
          width + 1,
        `Student's guidance overflow ${language}/${width}`,
      );
      layoutStates++;
    }
  }
  for (const width of [320, 768, 1920]) {
    await teacher.setViewportSize({ width, height: 1000 });
    for (const language of ["en", "tl"]) {
      await setLanguage(teacher, language);
      await teacher
        .getByText(
          language === "en" ? "Help & project" : "Tulong at proyekto",
          { exact: true },
        )
        .click();
      for (const name of [
        language === "en" ? "Teacher's guidance" : "Patnubay para sa guro",
      ]) {
        await teacher.getByRole("button", { name, exact: true }).click();
        assert(
          (await teacher.evaluate(
            () => document.documentElement.scrollWidth,
          )) <=
            width + 1,
          `Teacher's guidance overflow ${name}/${language}/${width}`,
        );
        layoutStates++;
      }
    }
  }
  const result = { checks, layoutStates, accessibility, errors };
  await writeFile(
    "tmp/round2-browser-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        checks,
        layoutStates,
        accessibility: accessibility.map((item) => ({
          label: item.label,
          violations: item.violations.length,
        })),
        errors,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, []);
  assert(
    accessibility.every((item) => !item.violations.length),
    "See tmp/round2-browser-results.json for accessibility violations",
  );
} finally {
  await browser?.close();
  await f.cleanup();
}
