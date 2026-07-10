import { test as setup } from "@playwright/test";
import { authenticateAndSave, userAAuthFile } from "./two-user-auth.setup";

setup("authenticate dedicated user A", async ({ page }) => {
  await authenticateAndSave(
    page,
    process.env.E2E_USER_A_EMAIL,
    process.env.E2E_USER_A_PASSWORD,
    userAAuthFile,
    "User A",
  );
});
