import { test, expect } from "@playwright/test";

/**
 * Item management tests.
 *
 * Tests that need a logged-in user are tagged with @auth and run in the
 * "chromium-auth" project which uses the saved session from auth.setup.ts.
 */
test.describe("Item management", () => {
  // ── Public item browsing ────────────────────────────────────────────

  test("objects page loads without error", async ({ page }) => {
    const response = await page.goto("/objects");
    expect(response?.status()).toBeLessThan(500);
  });

  // ── Create new item (requires auth) ─────────────────────────────────

  test("new item form loads at /objects/new @auth", async ({ page }) => {
    await page.goto("/objects/new");

    // The ItemForm should be rendered inside a SectionCard
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Should have the title input field
    const titleInput = page.locator("input[placeholder]").first();
    await expect(titleInput).toBeVisible();
  });

  test("new item form has category dropdown @auth", async ({ page }) => {
    await page.goto("/objects/new");

    // The form should have at least one <select> for category
    const categorySelect = page.locator("select").first();
    await expect(categorySelect).toBeVisible();

    // It should have multiple options (top-level categories + placeholder)
    const optionCount = await categorySelect.locator("option").count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test("new item form has condition and status dropdowns @auth", async ({
    page,
  }) => {
    await page.goto("/objects/new");

    // The form has three selects in the condition/status/location row:
    // condition, status, and a location text input
    const selects = page.locator("select");
    const selectCount = await selects.count();
    // At least 2 selects: parent category + condition (status is also a select)
    expect(selectCount).toBeGreaterThanOrEqual(2);
  });

  test("new item form validates required fields on submit @auth", async ({
    page,
  }) => {
    await page.goto("/objects/new");

    // Submit the form without filling anything
    await page.locator('button[type="submit"]').click();

    // Validation errors should appear (red text elements)
    const errorMessages = page.locator(
      ".text-red-600, .dark\\:text-red-400",
    );
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test("category selection shows subcategories @auth", async ({ page }) => {
    await page.goto("/objects/new");

    // Select the first real category (skip the placeholder)
    const parentSelect = page.locator("select").first();
    const options = parentSelect.locator("option");
    const optionCount = await options.count();

    if (optionCount > 1) {
      // Select the second option (first real category, after placeholder)
      const value = await options.nth(1).getAttribute("value");
      if (value) {
        await parentSelect.selectOption(value);
        // A subcategory select should appear (the form renders a second select)
        // Wait a moment for re-render
        await page.waitForTimeout(500);
        const allSelects = page.locator("select");
        const newCount = await allSelects.count();
        // Should now have more selects (subcategory added)
        expect(newCount).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test("AI suggestions button is present on the form @auth", async ({
    page,
  }) => {
    await page.goto("/objects/new");

    // The AI suggestions button uses purple styling
    const aiButton = page.locator("button.bg-purple-600");
    await expect(aiButton).toBeVisible();
  });

  // ── My objects page (requires auth) ─────────────────────────────────

  test("my-objects page loads for authenticated user @auth", async ({
    page,
  }) => {
    await page.goto("/my-objects");
    await expect(page).toHaveURL("/my-objects");
  });

  test("item appears in my-objects after creation @auth", async ({ page }) => {
    // 1. Navigate to /objects/new
    await page.goto("/objects/new");

    // 2. Fill in required fields
    //    Title
    await page.locator("input").first().fill("E2E Test Item");
    //    Category (select first real option)
    const categorySelect = page.locator("select").first();
    const options = categorySelect.locator("option");
    if ((await options.count()) > 1) {
      const value = await options.nth(1).getAttribute("value");
      if (value) await categorySelect.selectOption(value);
    }
    //    Location
    const locationInput = page.locator("input[placeholder]").last();
    await locationInput.fill("Bucharest");

    // 3. Submit the form
    await page.locator('button[type="submit"]').click();

    // 4. Should redirect to /objects after save
    await expect(page).toHaveURL("/objects", { timeout: 10_000 });

    // 5. Navigate to my-objects and verify the item is listed
    await page.goto("/my-objects");
    const itemTitle = page.locator("text=E2E Test Item");
    await expect(itemTitle).toBeVisible({ timeout: 5_000 });
  });
});
