import { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL ?? "https://southern-tree-services.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", allow: "/dashboard", disallow: [] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
