import type { MetadataRoute } from "next";

const siteUrl =
  process.env.SITE_URL || "https://sunsunsunday.hikamers.app";

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
    {
      url: `${siteUrl}/listen`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/download`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/archive/2026-08-10`,
      lastModified: new Date("2026-08-12"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/archive/2026-08-10/timetable`,
      lastModified: new Date("2026-08-12"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/archive/2026-08-10/listen`,
      lastModified: new Date("2026-08-12"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/archive/2026-08-10/download`,
      lastModified: new Date("2026-08-12"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
