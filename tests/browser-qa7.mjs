// Regression checks for the student/teacher findings in Techno_QA (7).
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { fixture } from "./runtime.mjs";
await mkdir("tmp", { recursive: true });
const f = await fixture();
const url = f.url;
const results = [];
const check = (ok, label) => {
  results.push(`${ok ? "PASS" : "FAIL"} ${label}`);
};
let browser;
const errors = [];
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem("kwentohabi-language"))
      localStorage.setItem("kwentohabi-language", '"tl"');
  });
  await page.goto(url);
  await page.locator('input[name="school"]').fill("School");
  await page.locator('input[name="username"]').fill("qa-teacher");
  await page.locator('input[name="password"]').fill("qa-classroom-password");
  await page
    .getByRole("button", { name: "Ihanda ang paaralan", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: /Isara/ }).click();
  await page.getByText("Gabay sa bawat bagong kuwento.").waitFor();
  await page.screenshot({ path: "tmp/qa7-teacher-home.png", fullPage: true });

  // Keep the requested larger logo and use its row for the school context.
  const headerLayout = await page.locator("header").evaluate((header) => {
    const logo = header.querySelector(".official-logo").getBoundingClientRect();
    const context = header
      .querySelector(".header-context")
      .getBoundingClientRect();
    return {
      logoWidth: logo.width,
      beside: context.top < logo.bottom && context.bottom > logo.top,
    };
  });
  check(
    headerLayout.logoWidth === 240 && headerLayout.beside,
    "large logo and school share the desktop header row",
  );
  check(
    await page
      .locator("header")
      .getByText("School", { exact: true })
      .isVisible(),
    "school name shown in header",
  );

  // Hero buttons
  check(
    (await page
      .getByRole("button", { name: "Pumunta sa Gabay ng guro" })
      .count()) === 1,
    "hero button names Gabay ng guro",
  );
  check(
    (await page.getByRole("button", { name: "Lumikha ng gawain" }).count()) ===
      0,
    "no 'Lumikha ng gawain' label",
  );
  check(
    (await page
      .getByRole("button", { name: "Bagong kuwento", exact: true })
      .count()) === 2,
    "header + hero both say Bagong kuwento",
  );

  // Equal boxes
  const widths = await page
    .locator("section.card.h-full")
    .evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().width)),
    );
  check(
    widths.length === 2 && Math.abs(widths[0] - widths[1]) <= 2,
    `recent/demo boxes equal width (${widths})`,
  );
  const heights = await page
    .locator("section.card.h-full")
    .evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().height)),
    );
  check(
    Math.abs(heights[0] - heights[1]) <= 2,
    `recent/demo boxes equal height (${heights})`,
  );
  // Story grid fills row
  const grid = await page.locator(".story-grid").evaluate((g) => {
    const cards = [...g.children].map((c) => c.getBoundingClientRect());
    const gr = g.getBoundingClientRect();
    return {
      right: Math.round(cards.at(-1).right),
      gridRight: Math.round(gr.right),
      n: cards.length,
    };
  });
  check(
    Math.abs(grid.right - grid.gridRight) <= 2,
    `story cards fill row (${grid.n} cards, ${grid.right}/${grid.gridRight})`,
  );

  // Help menu: highlight, outside close, no privacy, Teacher's guidance reachable
  await page
    .getByRole("button", { name: "Mga materyales", exact: true })
    .click();
  const helpBtn = page.getByRole("button", { name: "Tulong at proyekto" });
  await helpBtn.click();
  const menu = page.locator("#help-menu");
  check(await menu.isVisible(), "help menu opens");
  check(
    (await menu.getByText("Privacy at abiso sa guardian").count()) === 0,
    "privacy removed from help menu",
  );
  check(
    (await helpBtn.getAttribute("class")) === "btn",
    "help button highlighted while open",
  );
  check(
    (await page
      .getByRole("button", { name: "Mga materyales", exact: true })
      .getAttribute("class")) === "btn-light",
    "materials not highlighted while menu open",
  );
  await page.screenshot({ path: "tmp/qa7-help-menu.png" });
  await page.mouse.click(1000, 900);
  check(!(await menu.isVisible()), "outside click closes help menu");
  await helpBtn.click();
  await page
    .getByRole("button", { name: "Wiki ng kuwento", exact: true })
    .click();
  check(!(await menu.isVisible()), "clicking another tab closes help menu");
  await helpBtn.click();
  await page.keyboard.press("Escape");
  check(!(await menu.isVisible()), "Escape closes help menu");
  await helpBtn.click();
  check(
    (await menu.getByRole("button", { name: /^BMC/ }).count()) === 0,
    "BMC removed from help menu",
  );
  await page
    .getByRole("button", { name: "Patnubay para sa guro", exact: true })
    .click();
  check(
    await page
      .getByRole("heading", {
        name: "Gabayan ang mga batang manunulat, isang kabanata sa bawat pagkakataon.",
      })
      .waitFor({ timeout: 8000 })
      .then(
        () => true,
        () => false,
      ),
    "Teacher's guidance reachable from help menu",
  );
  check(
    (await helpBtn.getAttribute("class")) === "btn",
    "help button highlighted on Teacher's guidance view",
  );
  await helpBtn.click();
  await page
    .getByRole("button", { name: "Gabay sa paggamit", exact: true })
    .click();
  check(
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Privacy at abiso sa guardian" })
      .isVisible(),
    "privacy still inside Gabay sa paggamit",
  );
  await page.getByRole("dialog").getByRole("button", { name: /Isara/ }).click();

  // Profile menu has no privacy entry
  await page
    .getByRole("button", { name: "Buksan ang menu ng profile" })
    .click();
  check(
    (await page
      .locator(".profile-dropdown")
      .getByText("Privacy at abiso sa guardian")
      .count()) === 0,
    "privacy removed from profile menu",
  );
  // Rename school
  await page.getByRole("button", { name: "Mga setting ng profile" }).click();
  await page
    .locator('input[name="schoolName"]')
    .fill("Mataas na Paaralang Mabini");
  await page.getByRole("button", { name: "I-save ang paaralan" }).click();
  await page.getByText("Nai-save ang pangalan ng paaralan.").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: /Isara/ }).click();
  check(
    await page
      .locator("header")
      .getByText("Mataas na Paaralang Mabini")
      .isVisible(),
    "renamed school shows in header",
  );

  // New story dialog (teacher): whole class + individual per student
  await page.getByRole("button", { name: "Silid-aralan", exact: true }).click();
  await page
    .locator("header")
    .getByRole("button", { name: "Bagong kuwento", exact: true })
    .click();
  const dlg = page.getByRole("dialog");
  check(
    (await dlg
      .getByRole("option", { name: "Grade 9 – Seksyon Mabini" })
      .count()) === 1,
    "class shown with readable label",
  );
  await dlg.locator('input[name="title"]').fill("Pribadong sanaysay");
  const classSelect = dlg.getByRole("combobox", { name: "Klase", exact: true });
  await dlg.getByLabel(/Buong klase/).check();
  await classSelect.selectOption("rizal");
  check(
    (await dlg.locator('input[name="members"]:checked').count()) === 0,
    "changing class clears previously selected members",
  );
  await classSelect.selectOption("mabini");
  await dlg.locator('input[name="members"]').first().check();
  check(
    await dlg
      .getByLabel(/Buong klase/)
      .evaluate((input) => input.indeterminate),
    "whole-class checkbox shows partial selection",
  );
  await dlg.locator("select").nth(1).selectOption("individual");
  await dlg.getByLabel(/Buong klase/).check();
  const checked = await dlg.locator('input[name="members"]:checked').count();
  check(checked >= 3, `whole class selects all students (${checked})`);
  await page.screenshot({ path: "tmp/qa7-new-story-teacher.png" });
  await dlg.getByRole("button", { name: "Lumikha", exact: true }).click();
  await page.getByText(/Nalikha ang \d+ pribadong kuwento/).waitFor();
  const teacherWorkspace = await (
    await page.request.get(url + "/api/workspace")
  ).json();
  const privateStories = teacherWorkspace.stories.filter(
    (story) => story.title === "Pribadong sanaysay",
  );
  check(
    privateStories.length === checked &&
      privateStories.every(
        (story) =>
          story.mode === "individual" &&
          story.memberIds.length === 1 &&
          story.classId === "mabini",
      ) &&
      new Set(privateStories.map((story) => story.memberIds[0])).size ===
        checked,
    "whole class gets one separate private story per selected student",
  );

  // Teacher creates a learner account with no stories
  const created = await page.evaluate(async () => {
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "bagong-mag-aaral",
        name: "Pao",
        classId: "mabini",
      }),
    });
    return r.json();
  });
  // Student view
  const sp = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  sp.on("pageerror", (e) => errors.push(e.message));
  await sp.addInitScript(() =>
    localStorage.setItem("kwentohabi-language", '"tl"'),
  );
  await sp.goto(url);
  await sp.locator('select[name="role"]').selectOption("student");
  await sp.locator('input[name="username"]').fill(created.username);
  await sp.locator('input[name="password"]').fill(created.password);
  await sp.getByRole("button", { name: "Mag-sign in", exact: true }).click();
  await sp.getByText("Ituloy ang kuwentong ikaw ang naghahabi.").waitFor();
  await sp.screenshot({ path: "tmp/qa7-student-home.png", fullPage: true });
  const storySelect = sp.getByRole("combobox", { name: "Aktibong kuwento" });
  check(await storySelect.isDisabled(), "empty story select disabled");
  check(
    (await storySelect.innerText()).includes("Wala ka pang kuwento"),
    "empty story select has placeholder",
  );
  check(
    (await sp
      .getByRole("button", { name: "Bagong kuwento", exact: true })
      .count()) === 2,
    "student: single hero 'Bagong kuwento' + header",
  );
  check(
    (await sp.getByRole("button", { name: "Simulan ang kuwento" }).count()) ===
      0,
    "duplicate 'Simulan ang kuwento' removed",
  );
  for (const tab of ["Pagsusulat", "Wiki ng kuwento", "Mga materyales"]) {
    await sp.getByRole("button", { name: tab, exact: true }).click();
    check(
      await sp
        .getByRole("heading", { name: "Wala ka pang kuwento", exact: true })
        .isVisible(),
      `student empty state on ${tab}`,
    );
  }
  await sp.screenshot({ path: "tmp/qa7-student-empty.png", fullPage: true });
  await sp
    .locator("header")
    .getByRole("button", { name: "Bagong kuwento", exact: true })
    .click();
  const sd = sp.getByRole("dialog");
  check(
    (await sd.locator("select").count()) === 0,
    "student dialog has no one-option dropdowns",
  );
  check(
    await sd.getByText("Grade 9 – Seksyon Mabini").isVisible(),
    "student dialog shows class label read-only",
  );
  await sp.screenshot({ path: "tmp/qa7-new-story-student.png" });
  await sd.locator('input[name="title"]').fill("Aking kuwento");
  await sd.getByRole("button", { name: "Lumikha", exact: true }).click();
  await sp.locator("#workspace-title", { hasText: "Aking kuwento" }).waitFor();
  check(true, "student creates private story");

  // On phones the picker fills a row and the menu stays beneath its trigger.
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page
      .getByRole("button", { name: "Silid-aralan", exact: true })
      .click();
    await helpBtn.click();
    const bounds = await menu.boundingBox();
    const trigger = await helpBtn.boundingBox();
    check(
      bounds.x >= 0 && bounds.x + bounds.width <= width + 1,
      `help menu fits at ${width}px`,
    );
    check(
      bounds.y >= trigger.y + trigger.height,
      `help menu sits below trigger at ${width}px`,
    );
    if (width === 320)
      await page.screenshot({ path: "tmp/qa7-mobile-help.png" });
    await page.keyboard.press("Escape");
    check(
      await helpBtn.evaluate((button) => button === document.activeElement),
      "Escape restores help trigger focus",
    );
    if (width < 640) {
      const picker = await page
        .getByRole("combobox", { name: "Aktibong kuwento" })
        .boundingBox();
      check(
        picker.width >= width - 34,
        `story picker fills phone width at ${width}px`,
      );
    }
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `teacher fits at ${width}px`,
    );
    await sp.setViewportSize({ width, height: 1000 });
    check(
      await sp.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `student fits at ${width}px`,
    );
    if (width === 320)
      await page.screenshot({ path: "tmp/qa7-mobile-menu-closed.png" });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await helpBtn.click();
  await menu
    .getByRole("button", { name: "Gabay sa paggamit", exact: true })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: /Isara/ }).click();
  check(
    await helpBtn.evaluate((button) => button === document.activeElement),
    "guide dialog restores help trigger focus",
  );

  // Mobile header
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Silid-aralan", exact: true }).click();
  const scroll = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  check(scroll <= 391, `no horizontal overflow at 390px (${scroll})`);
  await page.screenshot({ path: "tmp/qa7-mobile-teacher.png" });
} finally {
  check(errors.length === 0, `no page errors ${errors.join(" | ")}`);
  await browser?.close();
  await f.cleanup();
  await writeFile(
    "tmp/qa7-results.json",
    JSON.stringify({ checks: results, errors }, null, 2),
  );
  console.log(results.join("\n"));
  assert(
    !results.some((result) => result.startsWith("FAIL")),
    "See tmp/qa7-results.json for failed QA checks",
  );
}
