"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitForm } from "@/lib/actions/submissions";
import { cn } from "@/lib/utils";

export function ContactForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await submitForm({
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || undefined,
      message: String(formData.get("message") ?? "").trim() || undefined,
    });
    if (result.ok) {
      setStatus("success");
      form.reset();
      onSuccess?.();
    } else {
      setStatus("error");
      setErrorMessage(result.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name *</Label>
          <Input
            id="contact-name"
            name="name"
            required
            placeholder="Your name"
            disabled={status === "loading"}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone *</Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            required
            placeholder="(901) 555-0123"
            disabled={status === "loading"}
            className="bg-background"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-address">Address</Label>
        <Input
          id="contact-address"
          name="address"
          placeholder="Street, city, zip"
          disabled={status === "loading"}
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          disabled={status === "loading"}
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          placeholder="Tell us about your tree service needs..."
          disabled={status === "loading"}
          className={cn(
            "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-md border px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-50 md:text-sm"
          )}
        />
      </div>
      {status === "success" && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          Thanks! We&apos;ll be in touch soon.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
