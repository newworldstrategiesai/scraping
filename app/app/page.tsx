import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { ContactForm } from "@/components/contact-form";
import { AnimatedHero } from "@/components/home/animated-hero";
import { AnimatedSection } from "@/components/home/animated-section";
import { AnimatedServiceCards } from "@/components/home/animated-service-cards";
import {
  getAggregateRatingSchema,
  getReviewSchemaItems,
  REVIEWS_FOR_SCHEMA,
  reviewsWithText,
} from "@/data/reviews";

const SITE_NAME = "Southern Tree & Renovations";
const AREA = "Memphis, TN";
const PHONE = "901-728-8065";
const ADDRESS = "939 Kelley Road, Memphis, Tennessee 38111";
const HOURS = "9:00 am – 5:00 pm";

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
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-foreground">
            {SITE_NAME}
          </Link>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${PHONE.replace(/\D/g, "")}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {PHONE}
            </a>
            <Button asChild size="sm">
              <a href={`tel:${PHONE.replace(/\D/g, "")}`}>Free Estimate</a>
            </Button>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Client Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <AnimatedHero siteName={SITE_NAME} phone={PHONE} />

        {/* Services */}
        <section id="services" className="py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <AnimatedSection>
              <h2 className="text-3xl font-semibold text-foreground">Tree Services in Memphis, TN</h2>
              <p className="mt-2 text-muted-foreground">
                From routine tree trimming to emergency tree removal and stump grinding – we serve {AREA} and surrounding communities.
              </p>
              <AnimatedServiceCards />
            </AnimatedSection>
          </div>
        </section>

        {/* Service area */}
        <section className="border-t border-border bg-muted/20 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <AnimatedSection>
              <h2 className="text-3xl font-semibold text-foreground">Serving Memphis & the Mid-South</h2>
              <p className="mt-2 text-muted-foreground">
                We provide tree removal, tree trimming, and stump removal throughout the Memphis, TN area, including Germantown, Bartlett, Collierville, Cordova, and surrounding communities.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Why choose us */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <AnimatedSection>
              <h2 className="text-3xl font-semibold text-foreground">About Southern Tree & Renovations</h2>
              <p className="mt-4 text-muted-foreground">
                We have been providing quality tree services for over a decade. Our team of skilled professionals is passionate about what we do. We take pride in our work and strive to exceed our customers' expectations. We believe in a personalized approach to tree care – we work with you to develop a plan that meets your unique needs and budget.
              </p>
              <ul className="mt-6 space-y-4 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary font-medium">•</span>
                  Over a decade of quality tree services
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-medium">•</span>
                  Free estimates – no obligation
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-medium">•</span>
                  Same-day and emergency tree service
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-medium">•</span>
                  Personalized plans tailored to your needs and budget
                </li>
              </ul>
            </AnimatedSection>
          </div>
        </section>

        {/* Testimonials */}
        <section id="reviews" className="border-t border-border bg-muted/20 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <AnimatedSection>
              <h2 className="text-3xl font-semibold text-foreground">What Our Customers Say</h2>
              <p className="mt-2 text-muted-foreground">
                Real reviews from Memphis-area homeowners and businesses.
              </p>
              <div className="mt-10">
                <TestimonialCarousel reviews={reviewsWithText} max={24} />
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Contact / Get a quote */}
        <section id="contact" className="border-t border-border py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <AnimatedSection>
              <h2 className="text-3xl font-semibold text-foreground">Get a Free Quote</h2>
              <p className="mt-2 text-muted-foreground">
                Name, phone, address, and optional email and message. We&apos;ll get back to you soon.
              </p>
              <div className="mt-10 max-w-xl">
                <ContactForm />
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-primary text-primary-foreground py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <AnimatedSection>
              <h2 className="text-2xl font-semibold md:text-3xl">Get a Free Quote</h2>
              <p className="mt-4 text-primary-foreground/90">
                We stay in constant communication until the job is done. Give us a call for a free quote or questions.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-8">
                <a href={`tel:${PHONE.replace(/\D/g, "")}`}>{PHONE}</a>
              </Button>
            </AnimatedSection>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <AnimatedSection>
          <div className="mx-auto max-w-5xl px-4 flex flex-col gap-4 text-sm text-muted-foreground">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-medium text-foreground">{SITE_NAME}</span>
              <Link href="/login" className="hover:text-foreground">
                Client Login
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(ADDRESS)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                {ADDRESS}
              </a>
              <a href={`tel:${PHONE.replace(/\D/g, "")}`} className="hover:text-foreground">
                {PHONE}
              </a>
            </div>
            <p className="text-center sm:text-left">Open: {HOURS}</p>
          </div>
          </AnimatedSection>
        </footer>
      </main>
    </>
  );
}
