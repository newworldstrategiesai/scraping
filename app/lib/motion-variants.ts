/** Shared Framer Motion variants for Southern Tree home page. Short durations, respect reduced motion. */

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const staggerContainer = {
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export const defaultTransition = { duration: 0.4, ease: "easeOut" } as const;

export const viewportOnce = { once: true, amount: 0.2, margin: "0px 0px -40px 0px" } as const;
