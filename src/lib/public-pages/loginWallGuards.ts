export const FORBIDDEN_PUBLIC_LOGIN_WALL_PATTERNS = [
  /you must be logged in to view this page/i,
  /you need to be logged in to view this page/i,
  /login required/i,
  /authentication required/i,
  /this page requires authentication/i,
  /create an account to view this page/i,
  /sign in is required to view this page/i,
] as const;

export function containsForbiddenLoginWallCopy(text: string) {
  return FORBIDDEN_PUBLIC_LOGIN_WALL_PATTERNS.some((pattern) => pattern.test(text));
}
