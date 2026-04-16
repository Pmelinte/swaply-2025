import { cookies } from "next/headers";

// Callers only ever look up flat string keys; nested objects (e.g. explore.filterDrawer)
// exist in the JSON but are never accessed through this helper.
type Messages = Record<string, Record<string, string>>;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cast = (m: any): Messages => m as Messages;
  try {
    return cast((await import(`../../messages/${locale}.json`)).default);
  } catch {
    return cast((await import("../../messages/en.json")).default);
  }
}
