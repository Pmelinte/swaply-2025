export const STORY_BLOG_SEPARATION_RULES = [
  "Stories are connected to completed exchanges or real swap context; Blog posts are editorial guides.",
  "Stories require author consent, partner consent and moderation before public publication.",
  "Blog drafts can be reviewed editorially, but they must not be treated as exchange proof.",
  "Story rewards require validated story publication; Blog rewards are editorial contribution rewards.",
  "Stories must not expose exact locations, private chat, direct contact details or unapproved partner identity.",
] as const;

export function isStoryTableName(tableName: string) {
  return /^stories($|_)|^story_/.test(tableName);
}

export function isBlogTableName(tableName: string) {
  return /^blog($|_)|^blog_/.test(tableName);
}

export function assertStoryTableDoesNotLookLikeBlog(tableName: string) {
  return isStoryTableName(tableName) && !isBlogTableName(tableName);
}
