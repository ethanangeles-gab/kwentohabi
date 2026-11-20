import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fixture } from "./runtime.mjs";

const f = await fixture();
let browser;
const errors = [],
  accessibility = [];
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const makePage = async () => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await context.addInitScript(() => {
      if (!localStorage.getItem("kwentohabi-language"))
        localStorage.setItem("kwentohabi-language", '"en"');
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    return { context, page };
  };
  const scan = async (page, label) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    accessibility.push({
      label,
      violations: result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    });
  };
  const { context: ownerContext, page: owner } = await makePage();
  const setup = await ownerContext.request.post(f.url + "/api/setup", {
    data: {
      school: "Registration UI School",
      username: "signup-teacher",
      password: "signup-teacher-password-123",
    },
  });
  assert(setup.ok());
  await owner.goto(f.url);
  await mkdir("tmp", { recursive: true });
  const openInvites = async () => {
    await owner
      .getByRole("button", { name: "Teacher review", exact: true })
      .click();
    await owner.getByText("Manage classroom accounts", { exact: true }).click();
    await owner
      .getByRole("button", { name: "Join codes", exact: true })
      .click();
    return owner.getByRole("dialog", { name: "Class join codes", exact: true });
  };
  let dialog = await openInvites();
  await dialog
    .getByRole("spinbutton", { name: "Number of new accounts", exact: true })
    .fill("2");
  await dialog
    .getByRole("button", { name: "Generate join code", exact: true })
    .click();
  await dialog.getByLabel("New join code", { exact: true }).waitFor();
  const studentCode = await dialog
    .getByLabel("New join code", { exact: true })
    .inputValue();
  assert.match(studentCode, /^[A-F0-9]{6}(-[A-F0-9]{6}){3}$/);
  await dialog
    .getByRole("combobox", { name: "Invite as", exact: true })
    .selectOption("teacher");
  assert(
    await dialog
      .getByRole("spinbutton", { name: "Number of new accounts", exact: true })
      .isDisabled(),
  );
  await dialog
    .getByRole("button", { name: "Generate join code", exact: true })
    .click();
  await owner.waitForFunction(
    (previous) => document.querySelector("input[readonly]")?.value !== previous,
    studentCode,
  );
  const teacherCode = await dialog
    .getByLabel("New join code", { exact: true })
    .inputValue();
  let layoutStates = 0;
  const layout = async (page, label) => {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(
        (await page.evaluate(() => document.documentElement.scrollWidth)) <=
          width + 1,
        label,
      );
      layoutStates++;
    }
  };
  await layout(owner, "Light invitation dialog");
  await scan(owner, "Light invitation dialog");
  await owner.screenshot({
    path: "tmp/registration-invitations-light.png",
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Close / Isara", exact: true })
    .click();
  await owner.evaluate(() => localStorage.setItem("kwentohabi-theme", "dark"));
  await owner.reload();
  dialog = await openInvites();
  assert.equal(
    await dialog.getByLabel("New join code", { exact: true }).count(),
    0,
    "Codes cannot be recovered from the invitation list",
  );
  await layout(owner, "Dark invitation dialog");
  await scan(owner, "Dark invitation dialog");
  await dialog
    .getByRole("button", { name: "Close / Isara", exact: true })
    .click();
  const { context: learnerContext, page: learner } = await makePage();
  await learner.goto(f.url);
  for (const language of ["tl", "en"])
    for (const mode of ["light", "dark"]) {
      await learner.evaluate(
        ({ language, mode }) => {
          localStorage.setItem("kwentohabi-language", JSON.stringify(language));
          localStorage.setItem("kwentohabi-theme", mode);
        },
        { language, mode },
      );
      await learner.reload();
      await learner
        .getByRole("button", {
          name: language === "en" ? "Create account" : "Gumawa ng account",
          exact: true,
        })
        .click();
      await learner
        .getByRole("heading", {
          name: language === "en" ? "Create account" : "Gumawa ng account",
          exact: true,
        })
        .waitFor();
      await layout(learner, `${language}/${mode} registration`);
      await scan(learner, `${language}/${mode} registration`);
      if (language === "en" && mode === "dark")
        await learner.screenshot({
          path: "tmp/registration-form-dark.png",
          fullPage: true,
        });
    }
  await learner
    .getByRole("button", { name: "Back to sign in", exact: true })
    .click();
  await learner
    .getByRole("combobox", { name: "Sign in as", exact: true })
    .waitFor();
  assert.equal(
    await learner.getByRole("button", { name: /^(English|Filipino)$/ }).count(),
    0,
  );
  assert.equal(await learner.getByRole("switch").count(), 0);
  await learner
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const fill = async (page, role, username) => {
    await page
      .getByRole("combobox", { name: "Account type", exact: true })
      .selectOption(role);
    if (role === "student")
      await page
        .getByRole("combobox", { name: "Class", exact: true })
        .selectOption("mabini");
    await page
      .getByLabel(/^Full name\s*\*$/)
      .fill(role === "student" ? "Registered Learner" : "Registered Teacher");
    await page.getByLabel(/^Username \/ Email\s*\*$/).fill(username);
    await page
      .getByLabel(/^Password\s*\*$/)
      .fill("new-signup-password-123");
    await page
      .getByLabel(/^Confirm password\s*\*$/)
      .fill("new-signup-password-123");
  };
  await fill(learner, "student", "signup.student+story@example.school");
  let requests = 0;
  learner.on("request", (request) => {
    if (request.url() === f.url + "/api/register") requests++;
  });
  await learner
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  assert.equal(requests, 0, "Notice acknowledgment is required");
  await learner
    .getByRole("checkbox", {
      name: "I have read the privacy and guardian notice.",
      exact: true,
    })
    .check();
  await learner
    .getByLabel(/^Confirm password\s*\*$/)
    .fill("different-password-123");
  await learner
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await learner
    .getByRole("alert")
    .filter({ hasText: "Passwords do not match." })
    .waitFor();
  assert.equal(requests, 0);
  await learner
    .getByLabel(/^Confirm password\s*\*$/)
    .fill("new-signup-password-123");
  await learner
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await learner
    .getByRole("heading", {
      name: "Your next chapter starts here.",
      exact: true,
    })
    .waitFor();
  await learner
    .getByRole("button", { name: "Open profile menu", exact: true })
    .click();
  await learner.getByRole("button", { name: "Sign out", exact: true }).click();
  await learner
    .getByRole("combobox", { name: "Sign in as", exact: true })
    .selectOption("student");
  await learner
    .getByLabel("Username / Email", { exact: true })
    .fill("SIGNUP.STUDENT+STORY@EXAMPLE.SCHOOL");
  await learner
    .getByLabel("Password", { exact: true })
    .fill("new-signup-password-123");
  await learner.getByRole("button", { name: "Sign in", exact: true }).click();
  await learner
    .getByRole("heading", {
      name: "Your next chapter starts here.",
      exact: true,
    })
    .waitFor();
  const learnerWorkspace = await learnerContext.request.get(
    f.url + "/api/workspace",
  );
  assert(learnerWorkspace.ok());
  const enrolled = await learnerWorkspace.json();
  assert.equal(enrolled.user.role, "student");
  assert.equal(enrolled.user.consentStatus, "pending");
  assert.deepEqual(enrolled.user.classIds, ["mabini"]);
  assert.deepEqual(enrolled.stories, []);
  assert.equal(
    await learner
      .getByRole("button", { name: "Teacher review", exact: true })
      .count(),
    0,
  );
  assert(
    !(await learner.evaluate(() => JSON.stringify(localStorage))).includes(
      "new-signup-password-123",
    ),
  );
  const { context: colleagueContext, page: colleague } = await makePage();
  await colleague.goto(f.url);
  await colleague
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await fill(colleague, "teacher", "signup-colleague");
  await colleague
    .getByRole("checkbox", {
      name: "I have read the privacy and guardian notice.",
      exact: true,
    })
    .check();
  await colleague
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await colleague
    .getByRole("heading", { name: "Guide the next chapter.", exact: true })
    .waitFor();
  assert(
    await colleague
      .getByRole("button", { name: "Teacher review", exact: true })
      .isVisible(),
  );
  const colleagueWorkspace = await (
    await colleagueContext.request.get(f.url + "/api/workspace")
  ).json();
  assert.equal(colleagueWorkspace.user.role, "teacher");
  assert.deepEqual(colleagueWorkspace.user.classIds, ["mabini", "rizal"]);
  await owner.getByRole("button", { name: "Join codes", exact: true }).click();
  dialog = owner.getByRole("dialog", { name: "Class join codes", exact: true });
  await dialog
    .getByRole("button", { name: "Revoke", exact: true })
    .first()
    .click();
  await dialog.getByText("Teacher · Revoked", { exact: true }).waitFor();
  const result = {
    layoutStates,
    accessibility,
    errors,
    checks: [
      "Teacher issues student/teacher codes",
      "Codes displayed once",
      "Create account and back to sign in",
      "Notice acknowledgment and password confirmation",
      "Student email registration and later email sign-in open the correct home",
      "Teacher username registration opens the correct home",
      "New students have pending school authorization and no automatic group access",
      "Passwords not stored in browser storage",
      "Registration needs no join code; teacher can still revoke codes",
    ],
  };
  await writeFile(
    "tmp/registration-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        layoutStates,
        scans: accessibility.length,
        violations: accessibility.reduce(
          (n, item) => n + item.violations.length,
          0,
        ),
        errors,
        checks: result.checks,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, []);
  assert(
    accessibility.every((item) => !item.violations.length),
    "See tmp/registration-results.json",
  );
} finally {
  await browser?.close();
  await f.cleanup();
}
