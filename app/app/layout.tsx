import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://southern-tree-services.vercel.app"
  ),
  title: "Southern Tree & Renovations | Tree Removal & Trimming | Memphis, TN",
  description:
    "Southern Tree & Renovations – affordable, reliable tree services in Memphis, TN. Tree removal, trimming, stump grinding. Free estimates. Same-day emergency service.",
  viewport: { width: "device-width", initialScale: 1, maximumScale: 5 },
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
