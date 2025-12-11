import { test, expect } from "@playwright/test";

test("User can log in", async ({ page }) => {
  await page.goto(
    "https://erudition-ml-integreated-production.up.railway.app/login"
  );
  await page.fill('input[name="email"]', "psalmieljoshua.jose@my.jru.edu");
  await page.fill('input[name="password"]', "Test321!!");

  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ]);

  await expect(page).toHaveURL(/client/);
});
