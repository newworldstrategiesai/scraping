import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import {
  getAggregateRatingSchema,
  getReviewSchemaItems,
  REVIEWS_FOR_SCHEMA,
  reviewsWithText,
} from "@/data/reviews";

const SITE_NAME = "Southern Tree Services";
const AREA = "Memphis, TN";
const PHONE_PLACEHOLDER = "(901) 555-0123";

export const metadata = {
  title: "Southern Tree Services | Tree Removal, Trimming & Stump Removal | Memphis, TN",
  description:
    "Southern Tree Services – professional tree removal, tree trimming, and stump removal in Memphis, TN. Licensed, insured, free estimates. Same-day emergency tree service. Call for a free quote.",
  keywords: [
    "tree service Memphis TN",
    "tree removal Memphis",
    "tree trimming Memphis",
    "stump removal Memphis",
    "emergency tree service Memphis",
    "arborist Memphis TN",
    "Southern Tree Services",
  ],
  openGraph: {
    title: "Southern Tree Services | Tree Removal & Trimming | Memphis, TN",
    description:
      "Professional tree removal, trimming, and stump removal in Memphis, TN. Free estimates. Same-day emergency service.",
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
      "Professional tree removal, tree trimming, stump removal, and emergency tree service in Memphis, TN and surrounding areas.",
    ...(baseUrl && { url: baseUrl }),
    aggregateRating: getAggregateRatingSchema(),
    review: schemaReviews,
    areaServed: [
      { "@type": "City", name: "Memphis", containedInPlace: { "@type": "State", name: "Tennessee" } },
      { "@type": "City", name: "Germantown", containedInPlace: { "@type": "State", name: "Tennessee" } },
      { "@type": "City", name: "Bartlett", containedInPlace: { "@type": "State", name: "Tennessee" } },
      { "@type": "City", name: "Collierville", containedInPlace: { "@type": "State", name: "Tennessee" } },
    ],
    serviceType: ["Tree Removal", "Tree Trimming", "Stump Removal", "Emergency Tree Service"],
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
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-foreground">
            {SITE_NAME}
          </Link>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${PHONE_PLACEHOLDER.replace(/\D/g, "")}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {PHONE_PLACEHOLDER}
            </a>
            <Button asChild size="sm">
              <a href={`tel:${PHONE_PLACEHOLDER.replace(/\D/g, "")}`}>Free Estimate</a>
            </Button>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Client Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-muted/30 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {SITE_NAME}
            </h1>
            <p className="mt-4 text-xl text-muted-foreground md:text-2xl">
              Tree Removal, Trimming & Stump Removal in {AREA}
            </p>
            <p className="mt-6 max-w-2xl mx-auto text-muted-foreground">
              Licensed and insured. Free estimates. Same-day emergency tree service for Memphis and the greater metro area.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <a href={`tel:${PHONE_PLACEHOLDER.replace(/\D/g, "")}`}>Call for Free Estimate</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#services">Our Services</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl font-semibold text-foreground">Tree Services in Memphis, TN</h2>
            <p className="mt-2 text-muted-foreground">
              From routine tree trimming to emergency tree removal and stump grinding – we serve {AREA} and surrounding communities.
            </p>
            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Tree Removal",
                  desc: "Safe, professional tree removal in Memphis. We handle large and hazardous trees with care.",
                },
                {
                  title: "Tree Trimming",
                  desc: "Expert tree trimming and pruning to keep your property healthy and looking its best.",
                },
                {
                  title: "Stump Removal",
                  desc: "Stump grinding and stump removal so you can reclaim your yard.",
                },
                {
                  title: "Emergency Tree Service",
                  desc: "Storm damage? Fallen limbs? Same-day emergency tree service when you need it most.",
                },
              ].map((s) => (
                <li key={s.title} className="rounded-lg border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Service area */}
        <section className="border-t border-border bg-muted/20 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl font-semibold text-foreground">Serving Memphis & the Mid-South</h2>
            <p className="mt-2 text-muted-foreground">
              We provide tree removal, tree trimming, and stump removal throughout the Memphis, TN area, including Germantown, Bartlett, Collierville, Cordova, and surrounding communities.
            </p>
          </div>
        </section>

        {/* Why choose us */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl font-semibold text-foreground">Why Choose Southern Tree Services?</h2>
            <ul className="mt-8 space-y-4 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-medium">•</span>
                Licensed and insured for your peace of mind
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-medium">•</span>
                Free estimates – no obligation
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-medium">•</span>
                Same-day and emergency tree service available
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-medium">•</span>
                Professional equipment and experienced crew
              </li>
            </ul>
          </div>
        </section>

        {/* Testimonials */}
        <section id="reviews" className="border-t border-border bg-muted/20 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl font-semibold text-foreground">What Our Customers Say</h2>
            <p className="mt-2 text-muted-foreground">
              Real reviews from Memphis-area homeowners and businesses.
            </p>
            <div className="mt-10">
              <TestimonialCarousel reviews={reviewsWithText} max={24} />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-primary text-primary-foreground py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h2 className="text-2xl font-semibold md:text-3xl">Get a Free Estimate Today</h2>
            <p className="mt-4 text-primary-foreground/90">
              Call for tree removal, tree trimming, or stump removal in Memphis, TN.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <a href={`tel:${PHONE_PLACEHOLDER.replace(/\D/g, "")}`}>{PHONE_PLACEHOLDER}</a>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{SITE_NAME}</span>
            <span>{AREA}</span>
            <Link href="/dashboard" className="hover:text-foreground">
              Client Login
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
