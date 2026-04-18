/**
 * Client-side moderation helpers for chat messages.
 * Detects external contact patterns and abusive signals.
 */

// Patterns that suggest attempting to move conversation off-platform
const CONTACT_PATTERNS = [
  /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i,          // email
  /\b(\+?[0-9][\d\s\-().]{7,15}[0-9])\b/,     // phone number
  /whatsapp|telegram|signal|wechat|viber/i,      // messenger apps
  /t\.me\//i,                                    // Telegram link
];

// Patterns that indicate file types we don't allow
const BLOCKED_EXTENSIONS_RE = /\.(exe|bat|sh|cmd|zip|rar|7z|tar|msi|dmg)$/i;

export interface ModerationResult {
  allowed: boolean;
  warning?: string;
  blocked?: boolean;
}

/**
 * Check a message text for policy violations.
 * Returns a result with allowed status and optional warning.
 */
export function moderateMessageText(text: string): ModerationResult {
  const hasContactInfo = CONTACT_PATTERNS.some((re) => re.test(text));

  if (hasContactInfo) {
    return {
      allowed: true, // allowed but with warning
      warning: "contactInfoWarning",
    };
  }

  return { allowed: true };
}

/**
 * Check if a filename is allowed.
 */
export function isFileAllowed(filename: string): boolean {
  return !BLOCKED_EXTENSIONS_RE.test(filename);
}

/**
 * Extract any external links from text.
 */
export function extractExternalLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s]+/gi) ?? [];
  return matches.filter(
    (url) => !url.includes("swaply") && !url.includes("localhost"),
  );
}
