import { HomePageClient } from "./home-page-client";
import {
  getAggregateRatingSchema,
  getReviewSchemaItems,
  REVIEWS_FOR_SCHEMA,
  reviewsWithText,
} from "@/data/reviews";

const SITE_NAME = "Southern Tree & Renovations";
const PHONE = "901-728-8065";

export const metadata = {
  title: "Southern Tree & Renovations | Tree Removal & Trimming | Memphis, TN",
  description:
    "Southern Tree & Renovations – affordable, reliable tree removal, tree trimming, stump grinding, and debris haul-off in Memphis, Germantown, Cordova, Bartlett, and Shelby County. Free estimates. Same-day emergency service.",
  keywords: [
    "tree service Memphis TN",
    "tree removal Memphis",
    "tree trimming Memphis",
    "stump grinding Memphis",
    "emergency tree service Memphis",
    "arborist Memphis TN",
    "Southern Tree & Renovations",
  ],
  openGraph: {
    title: "Southern Tree & Renovations | Tree Removal & Trimming | Memphis, TN",
    description:
      "Affordable, reliable tree services in Memphis, TN. Tree removal, trimming, stump grinding. Free estimates. Same-day emergency service.",
    type: "website",
  },
  alternates: { canonical: "/" },
};

function JsonLd() {
  const baseUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const schemaReviews = reviewsWithText
    .slice(0, REVIEWS_FOR_SCHEMA)
    .map((r) => getReviewSchemaItems(r));
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    description:
      "Professional tree removal, tree trimming, stump grinding, debris haul-off, and emergency tree service in Memphis, Germantown, Cordova, Bartlett, and Shelby County.",
    telephone: PHONE,
    address: {
      "@type": "PostalAddress",
      streetAddress: "939 Kelley Road",
      addressLocality: "Memphis",
      addressRegion: "TN",
      postalCode: "38111",
    },
    openingHours: "Mo-Fr 09:00-17:00",
    ...(baseUrl && { url: baseUrl }),
    aggregateRating: getAggregateRatingSchema(),
    review: schemaReviews,
    areaServed: [
      { "@type": "City", name: "Memphis", containedInPlace: { "@type": "State", name: "Tennessee" } },
      { "@type": "City", name: "Germantown", containedInPlace: { "@type": "State", name: "Tennessee" } },
      { "@type": "City", name: "Cordova", containedInPlace: { "@type": "State", name: "Tennessee" } },
      { "@type": "City", name: "Bartlett", containedInPlace: { "@type": "State", name: "Tennessee" } },
      { "@type": "City", name: "Collierville", containedInPlace: { "@type": "State", name: "Tennessee" } },
    ],
    serviceType: ["Tree Removal", "Tree Trimming", "Stump Grinding", "Debris Haul Off", "Emergency Tree Service"],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <HomePageClient />
    </>
  );
}
