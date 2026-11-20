// Switches the app language through Profile settings (the only language control).
export async function setLanguage(page, language) {
  const target = language === "en" ? "en" : "fil";
  if ((await page.locator("html").getAttribute("lang")) === target) return;
  await page
    .getByRole("button", {
      name: /^(Open profile menu|Buksan ang menu ng profile)$/,
    })
    .click();
  await page
    .getByRole("button", {
      name: /^(Profile settings|Mga setting ng profile)$/,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: /^(Profile settings|Mga setting ng profile)$/,
  });
  await dialog
    .getByRole("button", {
      name: language === "en" ? "English" : "Filipino",
      exact: true,
    })
    .click();
  await page.waitForFunction(
    (value) => document.documentElement.lang === value,
    target,
  );
  await dialog
    .getByRole("button", { name: "Close / Isara", exact: true })
    .click();
}
