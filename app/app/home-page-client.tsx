"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactFormModal } from "@/components/contact-form-modal";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { ContactForm } from "@/components/contact-form";
import { AnimatedHero } from "@/components/home/animated-hero";
import { AnimatedSection } from "@/components/home/animated-section";
import { AnimatedServiceCards } from "@/components/home/animated-service-cards";
import { reviewsWithText } from "@/data/reviews";

const SITE_NAME = "Southern Tree & Renovations";
const AREA = "Memphis, TN";
const PHONE = "901-728-8065";
const ADDRESS = "939 Kelley Road, Memphis, Tennessee 38111";
const HOURS = "9:00 am – 5:00 pm";

export function HomePageClient() {
  const [formModalOpen, setFormModalOpen] = useState(false);

  return (
    <>
      <header className="border-b border-border bg-card/80 sticky top-0 z-40 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-foreground">
            {SITE_NAME}
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">{PHONE}</span>
            <Button size="sm" onClick={() => setFormModalOpen(true)}>
              Free Estimate
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
        <AnimatedHero
          siteName={SITE_NAME}
          phone={PHONE}
          onOpenForm={() => setFormModalOpen(true)}
        />

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

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <AnimatedSection>
              <h2 className="text-3xl font-semibold text-foreground">About Southern Tree & Renovations</h2>
              <p className="mt-4 text-muted-foreground">
                We have been providing quality tree services for over a decade. Our team of skilled professionals is passionate about what we do. We take pride in our work and strive to exceed our customers&apos; expectations. We believe in a personalized approach to tree care – we work with you to develop a plan that meets your unique needs and budget.
              </p>
              <ul className="mt-6 space-y-4 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-medium text-primary">•</span>
                  Over a decade of quality tree services
                </li>
                <li className="flex gap-3">
                  <span className="font-medium text-primary">•</span>
                  Free estimates – no obligation
                </li>
                <li className="flex gap-3">
                  <span className="font-medium text-primary">•</span>
                  Same-day and emergency tree service
                </li>
                <li className="flex gap-3">
                  <span className="font-medium text-primary">•</span>
                  Personalized plans tailored to your needs and budget
                </li>
              </ul>
            </AnimatedSection>
          </div>
        </section>

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

        <section className="border-t border-border bg-primary py-16 md:py-20 text-primary-foreground">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <AnimatedSection>
              <h2 className="text-2xl font-semibold md:text-3xl">Get a Free Quote</h2>
              <p className="mt-4 text-primary-foreground/90">
                We stay in constant communication until the job is done. Request a free quote or ask us a question.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-8"
                onClick={() => setFormModalOpen(true)}
              >
                Request a Free Quote
              </Button>
            </AnimatedSection>
          </div>
        </section>

        <footer className="border-t border-border py-8">
          <AnimatedSection>
            <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-sm text-muted-foreground">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <span className="font-medium text-foreground">{SITE_NAME}</span>
                <Link href="/login" className="hover:text-foreground">
                  Client Login
                </Link>
              </div>
              <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(ADDRESS)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {ADDRESS}
                </a>
                <button
                  type="button"
                  onClick={() => setFormModalOpen(true)}
                  className="hover:text-foreground"
                >
                  {PHONE}
                </button>
              </div>
              <p className="text-center sm:text-left">Open: {HOURS}</p>
            </div>
          </AnimatedSection>
        </footer>
      </main>

      <ContactFormModal open={formModalOpen} onClose={() => setFormModalOpen(false)} />
    </>
  );
}
