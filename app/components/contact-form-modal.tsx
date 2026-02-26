"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contact-form";

interface ContactFormModalProps {
  open: boolean;
  onClose: () => void;
}

export function ContactFormModal({ open, onClose }: ContactFormModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  if (!open) return null;

  function handleSuccess() {
    setShowSuccess(true);
  }

  function handleClose() {
    setShowSuccess(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <div className="flex flex-none items-center justify-between border-b border-border px-4 py-3">
        <h2 id="form-modal-title" className="text-lg font-semibold text-foreground">
          Get a Free Quote
        </h2>
        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close">
          <span className="text-xl leading-none">×</span>
        </Button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-6">
        {showSuccess ? (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 py-16 text-center">
            <div
              className="rounded-full bg-green-100 p-4 dark:bg-green-900/30"
              aria-hidden
            >
              <span className="text-4xl text-green-600 dark:text-green-400">✓</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-foreground">
                Thank you!
              </h3>
              <p className="text-muted-foreground">
                We&apos;ll be in touch soon with your free quote.
              </p>
            </div>
            <Button onClick={handleClose} size="lg">
              Close
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-xl">
            <ContactForm onSuccess={handleSuccess} />
          </div>
        )}
      </div>
    </div>
  );
}
