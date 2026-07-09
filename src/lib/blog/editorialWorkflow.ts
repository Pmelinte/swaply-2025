export const BLOG_EDITORIAL_STATUSES = [
  "draft",
  "submitted",
  "needs_review",
  "needs_changes",
  "approved",
  "translated",
  "published",
  "archived",
  "rejected",
] as const;

export type BlogEditorialStatus = (typeof BLOG_EDITORIAL_STATUSES)[number];

export const PUBLISHABLE_BLOG_STATUSES: BlogEditorialStatus[] = ["published"];

export const BLOG_STATUS_TRANSITIONS: Record<BlogEditorialStatus, BlogEditorialStatus[]> = {
  draft: ["submitted", "archived"],
  submitted: ["needs_review", "rejected"],
  needs_review: ["needs_changes", "approved", "rejected"],
  needs_changes: ["submitted", "rejected"],
  approved: ["translated", "archived"],
  translated: ["published", "needs_changes", "archived"],
  published: ["archived"],
  archived: [],
  rejected: [],
};

export function isBlogEditorialStatus(value: string): value is BlogEditorialStatus {
  return (BLOG_EDITORIAL_STATUSES as readonly string[]).includes(value);
}

export function canTransitionBlogStatus(from: BlogEditorialStatus, to: BlogEditorialStatus): boolean {
  return BLOG_STATUS_TRANSITIONS[from].includes(to);
}

export function isPublicBlogStatus(status: BlogEditorialStatus): boolean {
  return PUBLISHABLE_BLOG_STATUSES.includes(status);
}
