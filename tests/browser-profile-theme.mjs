import { setLanguage } from "./language.mjs";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fixture } from "./runtime.mjs";

await mkdir("tmp", { recursive: true });
const f = await fixture();
let browser;
const errors = [],
  scans = [];
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
  });
  await context.addInitScript(() =>
    localStorage.setItem("kwentohabi-language", '"en"'),
  );
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const theme = async (expected) => {
    await page.locator(`html[data-theme="${expected}"]`).waitFor();
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).colorScheme,
      ),
      expected,
    );
  };
  const scan = async (label) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    scans.push({
      label,
      violations: result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    });
  };
  const menu = () =>
    page.getByRole("button", { name: "Open profile menu", exact: true });
  const openSettings = async () => {
    await menu().click();
    await page
      .getByRole("button", { name: "Profile settings", exact: true })
      .click();
    return page.getByRole("dialog", { name: "Profile settings", exact: true });
  };
  await page.goto(f.url);
  await theme("dark");
  await scan("Dark school sign-in/setup");
  assert.equal(
    await page.getByRole("switch").count(),
    0,
    "No theme switch on sign-in/setup",
  );
  await page.reload();
  await theme("dark");
  const response = await context.request.post(f.url + "/api/setup", {
    data: {
      school: "Profile & Theme School",
      username: "theme-teacher",
      password: "profile-theme-password",
    },
  });
  assert(response.ok());
  const accounts = (await response.json()).accounts;
  await page.reload();
  await menu().waitFor();
  await menu().click();
  await page.getByRole("switch", { name: "Dark mode", exact: true }).click();
  await theme("light");
  await page.keyboard.press("Escape");
  await page.reload();
  await theme("light");
  const bounds = await menu().boundingBox();
  assert(bounds.x > 1200, "Profile avatar is at the top right on desktop");
  await menu().click();
  assert.equal(await menu().getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await menu().getAttribute("aria-expanded"), "false");
  assert(
    await menu().evaluate((element) => element === document.activeElement),
  );
  let dialog = await openSettings();
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#127a72";
    ctx.fillRect(0, 0, 24, 24);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "profile.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await dialog
    .getByRole("button", { name: "Remove picture", exact: true })
    .waitFor();
  await dialog
    .getByRole("textbox", { name: "Display name", exact: true })
    .fill("Teacher Mayumi");
  await page.route("**/api/profile", async (route) => {
    await route.fulfill({
      status: 500,
      json: { error: "Profile save unavailable. Please retry." },
    });
  });
  await dialog
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await page.unroute("**/api/profile");
  await dialog
    .getByRole("alert")
    .filter({ hasText: "Profile save unavailable" })
    .waitFor();
  assert.equal(
    await dialog
      .getByRole("textbox", { name: "Display name", exact: true })
      .inputValue(),
    "Teacher Mayumi",
  );
  await dialog
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await dialog.getByText("Profile saved.", { exact: true }).waitFor();
  assert(
    (await menu().locator("img").getAttribute("src")).startsWith(
      "data:image/jpeg;base64,",
    ),
  );
  await scan("Light profile settings");
  await page.screenshot({
    path: "tmp/profile-settings-light.png",
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Dark", exact: true }).click();
  await theme("dark");
  await dialog
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  const passwordDialog = page.getByRole("dialog", {
    name: "Change password",
    exact: true,
  });
  await passwordDialog
    .getByLabel("Current password", { exact: true })
    .waitFor();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    assert(
      await passwordDialog.evaluate(
        (element) => document.activeElement.closest("dialog") === element,
      ),
      "Keyboard stays in the password dialog",
    );
  }
  await page.keyboard.press("Escape");
  await passwordDialog.waitFor({ state: "detached" });
  assert(
    await dialog.isVisible(),
    "Closing password settings returns to profile settings",
  );
  await scan("Dark profile settings");
  await page.screenshot({
    path: "tmp/profile-settings-dark.png",
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Close / Isara", exact: true })
    .click();
  await page.reload();
  await theme("dark");
  assert(
    (await menu().locator("img").getAttribute("src")).startsWith(
      "data:image/jpeg;base64,",
    ),
  );
  assert((await page.locator("header").innerText()).includes("Teacher Mayumi"));
  const sibling = await context.newPage();
  await sibling.goto(f.url);
  await sibling.locator('html[data-theme="dark"]').waitFor();
  await menu().click();
  await page.getByRole("switch", { name: "Dark mode", exact: true }).click();
  await sibling.locator('html[data-theme="light"]').waitFor();
  await sibling.close();
  await page.keyboard.press("Escape");
  for (const selectedTheme of ["light", "dark"]) {
    await menu().click();
    const toggle = page.getByRole("switch", { name: "Dark mode", exact: true });
    if (
      (await toggle.getAttribute("aria-checked")) !==
      String(selectedTheme === "dark")
    )
      await toggle.click();
    await page.keyboard.press("Escape");
    await theme(selectedTheme);
    for (const view of [
      "Classroom",
      "Writing canvas",
      "Story wiki",
      "Teacher review",
      "Materials",
    ]) {
      await page.getByRole("button", { name: view, exact: true }).click();
      await scan(`${selectedTheme}: ${view}`);
    }
    await page.getByText("Help & project", { exact: true }).click();
    await page
      .getByRole("button", { name: "Teacher's guidance", exact: true })
      .click();
    await scan(`${selectedTheme}: Teacher's guidance`);
  }
  await page.getByRole("button", { name: "Classroom", exact: true }).click();
  let layoutStates = 0;
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of ["en", "tl"]) {
      await setLanguage(page, language);
      const trigger = page.getByRole("button", {
        name:
          language === "en"
            ? "Open profile menu"
            : "Buksan ang menu ng profile",
        exact: true,
      });
      await trigger.click();
      const panel = page.locator(".profile-dropdown");
      assert(await panel.isVisible());
      assert((await panel.boundingBox()).x >= 0);
      await page
        .getByRole("button", {
          name:
            language === "en" ? "Profile settings" : "Mga setting ng profile",
          exact: true,
        })
        .click();
      dialog = page.getByRole("dialog");
      for (const mode of ["light", "dark"]) {
        await dialog
          .getByRole("button", {
            name:
              mode === "light"
                ? language === "en"
                  ? "Light"
                  : "Maliwanag"
                : language === "en"
                  ? "Dark"
                  : "Madilim",
            exact: true,
          })
          .click();
        await theme(mode);
        assert(
          (await page.evaluate(() => document.documentElement.scrollWidth)) <=
            width + 1,
          `Page overflow: ${width}/${language}/${mode}`,
        );
        assert(
          await dialog.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
          `Dialog overflow: ${width}/${language}/${mode}`,
        );
        layoutStates++;
      }
      if (width === 390 && language === "en")
        await page.screenshot({
          path: "tmp/profile-settings-mobile-dark.png",
          fullPage: true,
        });
      await dialog
        .getByRole("button", { name: "Close / Isara", exact: true })
        .click();
    }
  }
  await setLanguage(page, "en");
  dialog = await openSettings();
  await dialog
    .getByRole("button", { name: "Remove picture", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await dialog.getByText("Profile saved.", { exact: true }).waitFor();
  await dialog
    .getByRole("button", { name: "Close / Isara", exact: true })
    .click();
  assert.equal(await menu().locator("img").count(), 0);
  await menu().click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("switch").count(),
    0,
    "No theme switch on login after sign-out",
  );
  await theme("dark");
  const student = accounts.find((account) => account.username === "maria");
  await page
    .getByRole("combobox", { name: "Sign in as", exact: true })
    .selectOption("student");
  await page.getByLabel(/username/i).fill(student.username);
  await page.getByLabel(/^Password\s*\*?$/).fill(student.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  dialog = await openSettings();
  await dialog
    .getByRole("textbox", { name: "Display name", exact: true })
    .fill("Maria Rivera");
  await dialog
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await dialog.getByText("Profile saved.", { exact: true }).waitFor();
  await scan("Dark student profile settings");
  await dialog
    .getByRole("button", { name: "Close / Isara", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  await scan("Dark student writing canvas");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.restoreThemeStorage = () => {
      Storage.prototype.setItem = original;
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "kwentohabi-theme")
        throw new DOMException("Storage full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await menu().click();
  await page.getByRole("switch", { name: "Dark mode", exact: true }).click();
  await theme("light");
  await page
    .getByText(
      "Theme applied. Browser storage is unavailable, so it may reset when you reload.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("button", { name: "Profile settings", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByText(
      "Theme applied. Browser storage is unavailable, so it may reset when you reload.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close / Isara", exact: true })
    .click();
  await page.evaluate(() => window.restoreThemeStorage());
  const result = { layoutStates, scans, errors };
  await writeFile(
    "tmp/profile-theme-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        layoutStates,
        scans: scans.map((scan) => ({
          label: scan.label,
          violations: scan.violations.length,
        })),
        errors,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, []);
  assert(
    scans.every((scan) => !scan.violations.length),
    "See tmp/profile-theme-results.json for accessibility details",
  );
} finally {
  await browser?.close();
  await f.cleanup();
}
