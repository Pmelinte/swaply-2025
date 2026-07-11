import { expect, test, type Locator, type Page } from "@playwright/test";

type ProfileSnapshot = {
  avatarUrl: string;
  bio: string;
  city: string;
  countryCode: string;
  displayName: string;
  languageLabels: string[];
  regionCode: string;
};

type LocationSelection = Pick<
  ProfileSnapshot,
  "city" | "countryCode" | "regionCode"
>;

const profilePath = "/en/profile";

function profileControls(page: Page) {
  const locationSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Localization", exact: true }),
  });
  const locationSelects = locationSection.locator("select");

  return {
    addLanguage: page.getByLabel("Add language", { exact: true }),
    avatarUrl: page.getByLabel("Avatar (URL)", { exact: true }),
    bio: page.getByLabel("Short description (bio)", { exact: true }),
    city: locationSelects.nth(2),
    country: locationSelects.nth(0),
    displayName: page.getByLabel("Display name", { exact: true }),
    region: locationSelects.nth(1),
    save: page.getByRole("button", { name: "Save profile", exact: true }),
  };
}

async function languageLabels(page: Page): Promise<string[]> {
  return page
    .getByRole("button", { name: /^Remove language / })
    .evaluateAll((buttons) =>
      buttons
        .map((button) => button.getAttribute("aria-label"))
        .filter((label): label is string => Boolean(label)),
    );
}

async function readProfile(page: Page): Promise<ProfileSnapshot> {
  const controls = profileControls(page);

  await expect(controls.displayName).toBeVisible();
  await expect(controls.country).toBeVisible({ timeout: 30_000 });

  return {
    avatarUrl: await controls.avatarUrl.inputValue(),
    bio: await controls.bio.inputValue(),
    city: await controls.city.inputValue(),
    countryCode: await controls.country.inputValue(),
    displayName: await controls.displayName.inputValue(),
    languageLabels: await languageLabels(page),
    regionCode: await controls.region.inputValue(),
  };
}

async function setLocation(page: Page, location: LocationSelection) {
  const controls = profileControls(page);

  await controls.country.selectOption(location.countryCode);
  if (!location.countryCode) return;

  await expect(controls.region).toBeEnabled();
  await controls.region.selectOption(location.regionCode);
  if (!location.regionCode) return;

  await expect(controls.city).toBeEnabled();
  await controls.city.selectOption(location.city);
}

async function saveProfile(page: Page) {
  const responsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "POST" &&
      new URL(response.url()).pathname.endsWith("/rest/v1/profiles")
    );
  });

  await profileControls(page).save.click();
  const response = await responsePromise;
  const responseBody = response.ok() ? "" : await response.text();

  expect(response.ok(), `Profile save failed: ${response.status()} ${responseBody}`).toBe(true);
  await expect(page.getByRole("alert")).toContainText("Profile saved successfully!");
}

async function expectAvatarLoaded(avatar: Locator, expectedUrl: string) {
  await expect(avatar).toHaveAttribute("src", expectedUrl);
  await expect
    .poll(() =>
      avatar.evaluate((image) => {
        const element = image as HTMLImageElement;
        return element.complete && element.naturalWidth > 0;
      }),
    )
    .toBe(true);
}

test.describe("Train C Batch 51 profile", () => {
  test.describe.configure({ retries: 0 });

  test("user can edit and persist profile fields, then restore the original profile", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await page.goto(profilePath, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/profile/);

    const original = await readProfile(page);
    const controls = profileControls(page);
    const origin = new URL(page.url()).origin;
    const primaryAvatar = `${origin}/icons/icon-512x512.png`;
    const alternateAvatar = `${origin}/logo-swaply.svg`;
    const temporaryAvatar =
      original.avatarUrl === primaryAvatar ? alternateAvatar : primaryAvatar;
    const temporaryDisplayName =
      original.displayName === "Swaply E2E Profile 51"
        ? "Swaply E2E Profile 51 Alternate"
        : "Swaply E2E Profile 51";
    const temporaryBio =
      original.bio === "Batch 51 profile persistence check."
        ? "Batch 51 alternate profile persistence check."
        : "Batch 51 profile persistence check.";
    const temporaryLocation: LocationSelection =
      original.countryCode === "CA"
        ? { countryCode: "GB", regionCode: "ENG", city: "London" }
        : { countryCode: "CA", regionCode: "ON", city: "Toronto" };

    const languageOption = controls.addLanguage.locator('option:not([value=""])').first();
    const languageValue = await languageOption.getAttribute("value");
    expect(languageValue, "The E2E profile must have one unselected language.").toBeTruthy();

    let addedLanguageLabel: string | null = null;
    let mutationStarted = false;

    try {
      mutationStarted = true;
      await controls.displayName.fill(temporaryDisplayName);
      await controls.avatarUrl.fill(temporaryAvatar);
      await controls.bio.fill(temporaryBio);
      await controls.addLanguage.selectOption(languageValue!);
      await setLocation(page, temporaryLocation);

      const changedLanguageLabels = await languageLabels(page);
      addedLanguageLabel =
        changedLanguageLabels.find((label) => !original.languageLabels.includes(label)) ?? null;
      expect(addedLanguageLabel, "Adding a spoken language must create a removable chip.").toBeTruthy();

      await saveProfile(page);
      await page.reload({ waitUntil: "domcontentloaded" });

      const persisted = await readProfile(page);
      expect(persisted.displayName).toBe(temporaryDisplayName);
      expect(persisted.avatarUrl).toBe(temporaryAvatar);
      expect(persisted.bio).toBe(temporaryBio);
      expect(persisted.countryCode).toBe(temporaryLocation.countryCode);
      expect(persisted.regionCode).toBe(temporaryLocation.regionCode);
      expect(persisted.city).toBe(temporaryLocation.city);
      expect(persisted.languageLabels).toContain(addedLanguageLabel);

      await expectAvatarLoaded(page.getByRole("img", { name: "Avatar", exact: true }), temporaryAvatar);
    } finally {
      if (mutationStarted) {
        await page.goto(profilePath, { waitUntil: "domcontentloaded" });
        const restoreControls = profileControls(page);

        await expect(restoreControls.displayName).toBeVisible();
        await restoreControls.displayName.fill(original.displayName);
        await restoreControls.avatarUrl.fill(original.avatarUrl);
        await restoreControls.bio.fill(original.bio);

        if (addedLanguageLabel) {
          const addedLanguageButton = page.getByRole("button", {
            name: addedLanguageLabel,
            exact: true,
          });
          if (await addedLanguageButton.isVisible()) {
            await addedLanguageButton.click();
          }
        }

        await setLocation(page, original);
        await saveProfile(page);
        await page.reload({ waitUntil: "domcontentloaded" });

        const restored = await readProfile(page);
        expect(restored.displayName).toBe(original.displayName);
        expect(restored.avatarUrl).toBe(original.avatarUrl);
        expect(restored.bio).toBe(original.bio);
        expect(restored.countryCode).toBe(original.countryCode);
        expect(restored.regionCode).toBe(original.regionCode);
        expect(restored.city).toBe(original.city);
        expect(restored.languageLabels).toEqual(original.languageLabels);
      }
    }
  });
});
