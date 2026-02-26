"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Review } from "@/data/reviews";

interface TestimonialCarouselProps {
  reviews: Review[];
  /** Max number of reviews to show in carousel (default all) */
  max?: number;
  className?: string;
}

export function TestimonialCarousel({ reviews, max, className }: TestimonialCarouselProps) {
  const items = max ? reviews.slice(0, max) : reviews;
  const [index, setIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = i + delta;
        if (next < 0) return items.length - 1;
        if (next >= items.length) return 0;
        return next;
      });
      setIsAutoPlaying(false);
    },
    [items.length]
  );

  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [isAutoPlaying, items.length, go]);

  if (items.length === 0) return null;

  const current = items[index];
  const hasMultiple = items.length > 1;

  return (
    <section
      className={cn("relative", className)}
      aria-label="Customer testimonials"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="flex items-stretch gap-4">
        {hasMultiple && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 self-center rounded-full"
            aria-label="Previous testimonial"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Card className="min-h-[140px] flex-1 border-border bg-card text-card-foreground">
          <CardContent className="flex flex-col justify-center p-6">
            <blockquote className="text-foreground">
              <p className="text-base leading-relaxed md:text-lg">
                &ldquo;{current.reviewText.trim()}&rdquo;
              </p>
            </blockquote>
            <footer className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <cite className="not-italic font-medium text-foreground">{current.reviewer}</cite>
              <span aria-hidden>·</span>
              <span>{current.reviewDate}</span>
            </footer>
            {current.ownerResponse && (
              <p className="mt-3 border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Response: </span>
                {current.ownerResponse}
              </p>
            )}
          </CardContent>
        </Card>
        {hasMultiple && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 self-center rounded-full"
            aria-label="Next testimonial"
            onClick={() => go(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
      {hasMultiple && (
        <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Testimonial index">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Testimonial ${i + 1}`}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === index
                  ? "bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              onClick={() => {
                setIndex(i);
                setIsAutoPlaying(false);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
