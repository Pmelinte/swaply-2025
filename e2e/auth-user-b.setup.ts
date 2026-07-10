import { test as setup } from "@playwright/test";
import { authenticateAndSave, userBAuthFile } from "./two-user-auth.setup";

setup("authenticate dedicated user B", async ({ page }) => {
  await authenticateAndSave(
    page,
    process.env.E2E_USER_B_EMAIL,
    process.env.E2E_USER_B_PASSWORD,
    userBAuthFile,
    "User B",
  );
});
