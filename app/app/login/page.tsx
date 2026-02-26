import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Login | Lead Automation",
  description: "Admin login for Lead Automation dashboard",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = searchParams.then((p) => p.next);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Lead Automation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to access the dashboard</p>
        </div>
        <LoginForm next={next} />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
