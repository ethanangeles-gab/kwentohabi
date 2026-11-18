import { spawn } from "node:child_process";
import { mkdtemp, mkdir } from "node:fs/promises";
import path from "node:path";
import net from "node:net";
await mkdir("tmp", { recursive: true });
const dataDir = await mkdtemp(path.resolve("tmp/qa-browser-"));
const probe = net.createServer();
await new Promise((r) => probe.listen(0, "127.0.0.1", r));
const port = probe.address().port;
await new Promise((r) => probe.close(r));
const server = spawn(process.execPath, ["--import", "tsx", "server.ts"], {
  windowsHide: true,
  env: {
    ...process.env,
    NODE_ENV: "production",
    DATA_DIR: dataDir,
    PORT: String(port),
    GEMINI_API_KEY: "",
    MONTHLY_CHECK_LIMIT: "100",
  },
  stdio: "ignore",
});
const url = `http://127.0.0.1:${port}`;
for (let i = 0; i < 200; i++) {
  try {
    if ((await fetch(url + "/api/health")).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 50));
}
let browser;
try {
  const { chromium } = await import("@playwright/test");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(url);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByLabel("School", { exact: true }).fill("KwentoHabi QA School");
  await page.getByLabel("Teacher / student username").fill("qa-teacher");
  await page
    .getByLabel("Password", { exact: true })
    .fill("qa-classroom-password");
  await page
    .getByRole("button", { name: "Set up school", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  const credentials = await page
    .getByRole("dialog")
    .locator("tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) => ({
        username: row.children[0].textContent,
        password: row.children[1].textContent,
      })),
    );
  await page.getByRole("button", { name: "Close / Isara" }).click();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Check current draft", exact: true })
    .click();
  await page
    .getByText("Last check: limited local parser", { exact: true })
    .waitFor();
  await page.screenshot({ path: "tmp/qa-desktop-canvas.png", fullPage: true });
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const name of [
      "Classroom",
      "Writing canvas",
      "Story wiki",
      "Teacher review",
      "Materials",
      "BMC & Q&A",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      await page.waitForTimeout(150);
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      if (layout.scroll > width + 1)
        throw Error(`Overflow ${name} at ${width}: ${layout.scroll}`);
    }
    await page.getByRole("button", { name: "Filipino", exact: true }).click();
    if ((await page.evaluate(() => document.documentElement.lang)) !== "fil")
      throw Error("Filipino document language missing");
    for (const name of [
      "Silid-aralan",
      "Pagsusulat",
      "Wiki ng kuwento",
      "Gabay ng guro",
      "Mga materyales",
      "BMC & Q&A",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      if (scroll > width + 1)
        throw Error(`Filipino overflow ${name} at ${width}`);
    }
    await page.getByRole("button", { name: "English", exact: true }).click();
    if ((await page.evaluate(() => document.documentElement.lang)) !== "en")
      throw Error("English document language missing");
    if (width === 320) {
      await page
        .getByRole("button", { name: "Teacher review", exact: true })
        .click();
      await page.screenshot({
        path: "tmp/qa-mobile-teacher.png",
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "BMC & Q&A", exact: true }).click();
  await page
    .getByRole("button", { name: "Unit Economics", exact: true })
    .click();
  await page.getByText(/Monthly shortfall: ₱28,550/).waitFor();
  await page.screenshot({ path: "tmp/qa-economics.png", fullPage: true });
  await page.getByRole("button", { name: "Materials", exact: true }).click();
  await page
    .getByRole("button", { name: "Generate feedback", exact: true })
    .click();
  await page.getByText(/Teacher review required. No automated score/).waitFor();
  await page.getByRole("button", { name: "Add material", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page
    .getByRole("dialog")
    .getByLabel("Title", { exact: true })
    .fill("Keyboard test");
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    if (
      !(await page.evaluate(() =>
        document.querySelector("dialog")?.contains(document.activeElement),
      ))
    )
      throw Error("Dialog focus escaped");
  }
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  if (
    (await page.evaluate(() => document.activeElement?.textContent)) !==
    "Add material"
  )
    throw Error("Dialog did not restore focus");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Teacher / student username").fill("maria");
  await page
    .getByLabel("Password", { exact: true })
    .fill(credentials.find((c) => c.username === "maria").password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  if (
    await page
      .getByRole("button", { name: "Teacher review", exact: true })
      .count()
  )
    throw Error("Student teacher navigation exposed");
  const peerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const peer = await peerContext.newPage();
  await peer.goto(url);
  await peer.getByRole("button", { name: "English", exact: true }).click();
  await peer.getByLabel("Teacher / student username").fill("jose");
  await peer
    .getByLabel("Password", { exact: true })
    .fill(credentials.find((c) => c.username === "jose").password);
  await peer.getByRole("button", { name: "Sign in", exact: true }).click();
  await peer
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit below", exact: true })
    .first()
    .click();
  await page.screenshot({ path: "tmp/qa-student-edit.png", fullPage: true });
  const textarea = page.getByRole("textbox", {
    name: "Chapter text",
    exact: true,
  });
  const original = await textarea.inputValue();
  const injected = '<img src=x onerror="document.body.dataset.qaXss=1">';
  await textarea.fill(original + " " + injected);
  await page.getByRole("button", { name: "Save chapter", exact: true }).click();
  await page.getByText("Saved to server.", { exact: true }).waitFor();
  if (await page.evaluate(() => document.body.dataset.qaXss))
    throw Error("XSS executed");
  await page.getByText(injected, { exact: false }).first().waitFor();
  await peer
    .getByText(injected, { exact: false })
    .first()
    .waitFor({ timeout: 15000 });
  await peerContext.close();
  await page.reload();
  await page
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  await page.getByText(injected, { exact: false }).first().waitFor();
  await page.route("**/api/gemini/analyze", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Controlled analysis failure" }),
    }),
  );
  await page
    .getByRole("button", { name: "Check current draft", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Controlled analysis failure" })
    .waitFor();
  await page.unroute("**/api/gemini/analyze");
  await page.route("**/api/gemini/analyze", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page
    .getByRole("button", { name: "Check current draft", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "invalid analysis response" })
    .waitFor();
  await page.unroute("**/api/gemini/analyze");
  await page
    .getByLabel("Chapter text", { exact: true })
    .fill("An unsaved chapter draft.");
  await page.getByRole("button", { name: "Story wiki", exact: true }).click();
  await page
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  if (
    (await page.getByLabel("Chapter text", { exact: true }).inputValue()) !==
    "An unsaved chapter draft."
  )
    throw Error("Draft lost on tab navigation");
  await page.reload();
  await page
    .getByRole("button", { name: "Writing canvas", exact: true })
    .click();
  if (
    (await page.getByLabel("Chapter text", { exact: true }).inputValue()) !==
    "An unsaved chapter draft."
  )
    throw Error("Draft lost on reload");
  console.log(
    JSON.stringify(
      {
        responsiveViews: 60,
        errors,
        checks: [
          "BMC loss",
          "unscored evaluation",
          "dialog Escape and focus return",
          "student role",
          "safe HTML rendering",
          "saved reload",
          "draft tab/reload",
          "authorized session synchronization",
          "HTTP and malformed-response feedback",
        ],
      },
      null,
      2,
    ),
  );
  if (errors.length) throw Error(errors.join("\n"));
  await browser.close();
} finally {
  await browser?.close();
  server.kill();
}
