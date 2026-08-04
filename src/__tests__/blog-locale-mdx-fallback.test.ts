import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const blogDbSource = readFileSync(
  join(process.cwd(), "src/lib/blog-db.ts"),
  "utf8",
);
const blogPageSource = readFileSync(
  join(process.cwd(), "src/app/[locale]/blog/page.tsx"),
  "utf8",
);

describe("V1-07.5 Blog locale and MDX fallback contract", () => {
  it("queries the requested locale and English fallback", () => {
    expect(blogDbSource).toContain(
      'query.in("locale", [requestedLocale, "en"])',
    );
    expect(blogDbSource).toContain('query.eq("locale", "en")');
    expect(blogDbSource).not.toContain('.eq("locale", "en")\n    .eq');
  });

  it("prefers a requested-locale row over the English row for one slug", () => {
    expect(blogDbSource).toContain("preferRequestedLocale");
    expect(blogDbSource).toContain("post.sourceLang === requestedLocale");
    expect(blogDbSource).toContain("selected.set(post.slug, post)");
  });

  it("falls back to repository MDX when Supabase is unavailable or empty", () => {
    expect(blogDbSource).toContain("return getAllPosts(requestedLocale)");
    expect(blogDbSource).toContain(
      "return posts.length > 0 ? posts : getAllPosts(requestedLocale)",
    );
    expect(blogDbSource).toContain(
      "return posts[0] ?? getPostBySlug(slug, requestedLocale)",
    );
  });

  it("keeps categories on the same locale-aware source as the visible posts", () => {
    expect(blogPageSource).toContain("getAllCategoriesDB(locale)");
    expect(blogPageSource).toContain("Promise.all([");
  });

  it("does not introduce Blog feedback, rewards or editorial persistence early", () => {
    expect(blogDbSource).not.toContain("blog_feedback");
    expect(blogDbSource).not.toContain("swapleni_ledger");
    expect(blogDbSource).not.toContain("editorial_status");
  });
});
