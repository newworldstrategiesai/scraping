"use client";

import { LazyMotion, m } from "framer-motion";
import { domAnimation } from "framer-motion";
import { staggerContainer, staggerItem, defaultTransition, viewportOnce } from "@/lib/motion-variants";

const services = [
  {
    title: "Tree Removal & Trimming",
    desc: "Professional tree removals for hazardous or unwanted trees, crane tree removal, expert tree trimming and pruning. Memphis, Germantown, Cordova, Bartlett, and Shelby County.",
  },
  {
    title: "Stump Grinding",
    desc: "Professional stump grinding in Memphis and Shelby County. We restore the beauty of your landscape with state-of-the-art equipment.",
  },
  {
    title: "Debris Haul Off",
    desc: "Tree care, debris hauling, and junk removal. Storm cleanup and full removal – we clear everything away and leave your property clean.",
  },
  {
    title: "Emergency Tree Service",
    desc: "Storm damage? Fallen limbs? Around-the-clock emergency tree service for urgent situations.",
  },
];

export function AnimatedServiceCards() {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.ul
        className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        {services.map((s) => (
          <m.li
            key={s.title}
            variants={staggerItem}
            transition={defaultTransition}
            className="rounded-lg border border-border bg-card p-6"
          >
            <h3 className="font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </m.li>
        ))}
      </m.ul>
    </LazyMotion>
  );
}
