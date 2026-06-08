import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/compare",
    "/leaderboards",
    "/trending"
  ].map((path) => ({
    url: `${env.NEXT_PUBLIC_APP_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7
  }));
}
