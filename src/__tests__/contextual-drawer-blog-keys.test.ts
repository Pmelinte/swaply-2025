import { describe, expect, it } from "vitest";
import { contextualDrawerConfigs } from "@/lib/drawer/contextualDrawerConfig";

describe("contextual drawer blog keys", () => {
  it("does not use the missing about.blog key that produced Vercel runtime warnings", () => {
    const blogConfig = contextualDrawerConfigs.blog;
    const keys = [
      blogConfig.titleKey,
      ...blogConfig.sections.map((section) => section.titleKey),
      ...blogConfig.sections.flatMap((section) => section.items.map((item) => item.labelKey)),
    ];

    expect(keys).not.toContain("about.blog");
    expect(keys).toContain("blog.pageTitle");
    expect(keys).toContain("blog.allArticles");
  });
});
