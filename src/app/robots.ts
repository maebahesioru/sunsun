import type { MetadataRoute } from "next";

const siteUrl =
  process.env.SITE_URL || "https://sunsunsunday.hikamer.f5.si";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
