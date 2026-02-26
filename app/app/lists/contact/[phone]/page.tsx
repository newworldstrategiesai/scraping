import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { getContactByPhone } from "@/lib/actions/contact";
import { normalizePhone } from "@/lib/utils/phone";
import { ContactView } from "../contact-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Lists | Lead Automation",
  description: "Contact profile, activity, and notes",
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone: phoneParam } = await params;
  const phone = normalizePhone(phoneParam);
  if (phone.length < 10) notFound();

  const contact = await getContactByPhone(phone);
  if (!contact) notFound();

  return (
    <>
      <Nav currentPath="/lists" />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/lists">← Lists</Link>
          </Button>
        </div>
        <ContactView initialContact={contact} />
      </main>
    </>
  );
}
