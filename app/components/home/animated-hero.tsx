"use client";

import { LazyMotion, m } from "framer-motion";
import { domAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from "@/lib/motion-variants";

interface AnimatedHeroProps {
  siteName: string;
  phone: string;
  onOpenForm?: () => void;
}

export function AnimatedHero({ siteName, phone, onOpenForm }: AnimatedHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-muted/30 py-12 sm:py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <LazyMotion features={domAnimation}>
          <m.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <m.h1
              variants={staggerItem}
              transition={defaultTransition}
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {siteName}
            </m.h1>
            <m.p
              variants={staggerItem}
              transition={defaultTransition}
              className="mt-4 text-xl text-muted-foreground md:text-2xl"
            >
              Memphis Tree Service
            </m.p>
            <m.p
              variants={staggerItem}
              transition={defaultTransition}
              className="mt-6 max-w-2xl mx-auto text-muted-foreground"
            >
              We offer affordable and reliable services for all your tree needs. Licensed, insured. Free estimates. Same-day emergency tree service for Memphis and Shelby County.
            </m.p>
            <m.div
              variants={staggerItem}
              transition={defaultTransition}
              className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4"
            >
              {onOpenForm ? (
                <Button size="lg" onClick={onOpenForm} className="min-h-[48px] w-full sm:w-auto sm:min-h-10">
                  Schedule a Consultation
                </Button>
              ) : (
                <Button asChild size="lg" className="min-h-[48px] w-full sm:w-auto sm:min-h-10">
                  <a href={`tel:${phone.replace(/\D/g, "")}`}>Schedule a Consultation</a>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="min-h-[48px] w-full sm:w-auto sm:min-h-10">
                <a href="#services">Our Services</a>
              </Button>
            </m.div>
          </m.div>
        </LazyMotion>
      </div>
    </section>
  );
}
