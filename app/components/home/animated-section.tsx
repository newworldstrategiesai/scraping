"use client";

import { LazyMotion, m } from "framer-motion";
import { domAnimation } from "framer-motion";
import { fadeInUp, defaultTransition, viewportOnce } from "@/lib/motion-variants";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedSection({ children, className }: AnimatedSectionProps) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        transition={defaultTransition}
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
