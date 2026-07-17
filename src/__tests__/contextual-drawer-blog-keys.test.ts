import { describe, expect, it } from "vitest";
import { contextualDrawerConfigs } from "@/lib/drawer/contextualDrawerConfig";

describe("contextual drawer blog keys", () => {
  it("uses the existing blog translation keys", () => {
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
