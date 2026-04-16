import { cookies } from "next/headers";

type Messages = Record<string, Record<string, string | Record<string, string>>>;

/**
 * Load translation messages server-side.
 * Reads the user's preferred locale from the "locale" cookie,
 * falling back to English.
 */
export async function getMessages(): Promise<Messages> {
  let locale = "en";
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("locale")?.value;
    if (localeCookie) locale = localeCookie;
  } catch {
    // cookies() can throw in some contexts — use default
  }

  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch {
    return (await import("../../messages/en.json")).default;
  }
}
