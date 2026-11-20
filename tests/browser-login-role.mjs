import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fixture } from "./runtime.mjs";

const f = await fixture();
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage(),
    errors = [],
    accessibility = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem("kwentohabi-language"))
      localStorage.setItem("kwentohabi-language", '"en"');
  });
  await page.goto(f.url);
  await page
    .getByRole("button", { name: "Set up school", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("combobox").count(),
    0,
    "First school setup creates a teacher account only",
  );
  const setup = await context.request.post(f.url + "/api/setup", {
    data: {
      school: "Role Login Demo School",
      username: "role-teacher",
      password: "role-browser-password-123",
    },
  });
  assert(setup.ok());
  const student = (await setup.json()).accounts.find(
    (account) => account.username === "maria",
  );
  assert(
    (await context.request.post(f.url + "/api/logout", { data: {} })).ok(),
  );
  await page.reload();
  let layoutStates = 0;
  for (const language of ["en", "tl"]) {
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        ({ language, theme }) => {
          localStorage.setItem("kwentohabi-language", JSON.stringify(language));
          localStorage.setItem("kwentohabi-theme", theme);
        },
        { language, theme },
      );
      await page.reload();
      const role = page.getByRole("combobox", {
        name: language === "en" ? "Sign in as" : "Mag-sign in bilang",
        exact: true,
      });
      await role.waitFor();
      assert.equal(await role.inputValue(), "");
      assert(
        await page
          .getByRole("button", {
            name: language === "en" ? "Sign in" : "Mag-sign in",
            exact: true,
          })
          .isDisabled(),
      );
      assert.equal(
        await page
          .getByRole("button", { name: /^(English|Filipino)$/ })
          .count(),
        0,
      );
      assert.equal(await page.getByRole("switch").count(), 0);
      await role.selectOption("teacher");
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert(
          (await page.evaluate(() => document.documentElement.scrollWidth)) <=
            width + 1,
        );
        layoutStates++;
      }
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      accessibility.push({
        language,
        theme,
        violations: result.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => node.failureSummary),
        })),
      });
    }
  }
  await page.evaluate(() =>
    localStorage.setItem("kwentohabi-language", '"en"'),
  );
  await page.reload();
  const role = page.getByRole("combobox", { name: "Sign in as", exact: true });
  await role.selectOption("teacher");
  await page
    .getByLabel("Username / Email", { exact: true })
    .fill(student.username);
  await page.getByLabel("Password", { exact: true }).fill(student.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Your account does not match the selected role" })
    .waitFor();
  assert.equal(
    (await context.request.get(f.url + "/api/workspace")).status(),
    401,
  );
  await role.selectOption("student");
  assert.equal(await page.getByRole("alert").count(), 0);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Your next chapter starts here.",
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Teacher review", exact: true })
      .count(),
    0,
  );
  await page
    .getByRole("button", { name: "Open profile menu", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await role.waitFor();
  assert.equal(await role.inputValue(), "");
  await role.selectOption("teacher");
  await page
    .getByLabel("Username / Email", { exact: true })
    .fill("role-teacher");
  await page
    .getByLabel("Password", { exact: true })
    .fill("role-browser-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("heading", { name: "Guide the next chapter.", exact: true })
    .waitFor();
  assert(
    await page
      .getByRole("button", { name: "Teacher review", exact: true })
      .isVisible(),
  );
  await page
    .getByRole("button", { name: "Open profile menu", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await role.waitFor();
  await role.selectOption("teacher");
  await mkdir("tmp", { recursive: true });
  await page.screenshot({
    path: "tmp/login-role-selector.png",
    fullPage: true,
  });
  await writeFile(
    "tmp/login-role-results.json",
    JSON.stringify({ layoutStates, accessibility, errors }, null, 2),
  );
  assert.deepEqual(errors, []);
  assert(
    accessibility.every((scan) => !scan.violations.length),
    "See tmp/login-role-results.json",
  );
  console.log(
    JSON.stringify(
      {
        layoutStates,
        accessibilityScans: accessibility.length,
        violations: 0,
        errors,
        checks: [
          "Role required",
          "Mismatch rejected",
          "Student dashboard",
          "Teacher dashboard",
          "Role selection resets on sign-out",
          "Login theme/language buttons remain removed",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await f.cleanup();
}
