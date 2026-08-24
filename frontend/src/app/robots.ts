import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/pos/", "/account/"],
    },
    sitemap: "https://vasanthissignature.in/sitemap.xml",
  };
}
