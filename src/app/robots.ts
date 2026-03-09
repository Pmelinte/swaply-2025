import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/profile", "/chat", "/change", "/my-objects"],
      },
    ],
    sitemap: "https://swaply.app/sitemap.xml",
  };
}
