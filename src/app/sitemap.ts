import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://melvynthierrybellefond.xyz";
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/cv`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
