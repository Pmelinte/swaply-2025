import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { userAAuthFile, userBAuthFile } from "./two-user-auth.setup";

test.describe("Train C two-user authenticated baseline", () => {
  test("dedicated sessions are distinct and both can open the profile route", async ({ browser }) => {
    const stateA = JSON.parse(readFileSync(userAAuthFile, "utf8"));
    const stateB = JSON.parse(readFileSync(userBAuthFile, "utf8"));

    expect(JSON.stringify(stateA)).not.toBe(JSON.stringify(stateB));

    const contextA = await browser.newContext({ storageState: stateA });
    const contextB = await browser.newContext({ storageState: stateB });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto("/en/profile", { waitUntil: "networkidle" });
    await pageB.goto("/en/profile", { waitUntil: "networkidle" });

    await expect(pageA).toHaveURL(/\/en\/profile/);
    await expect(pageB).toHaveURL(/\/en\/profile/);
    await expect(pageA.locator('input[type="email"]')).toHaveCount(0);
    await expect(pageB.locator('input[type="email"]')).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });
});
