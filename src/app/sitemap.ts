import type { MetadataRoute } from "next";

const siteUrl =
  process.env.SITE_URL || "https://sunsunsunday.hikamer.f5.si";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${siteUrl}/timetable`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];
}
