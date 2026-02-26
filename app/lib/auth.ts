/** Admin emails (comma-separated). Example: ADMIN_EMAILS=admin@example.com,owner@example.com */
const ADMIN_EMAILS = process.env.ADMIN_EMAILS ?? "";

const allowedEmails = new Set(
  ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return allowedEmails.has(email.trim().toLowerCase());
}
