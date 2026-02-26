import type { NextConfig } from "next";
import path from "path";

// When running from app/, Next.js only loads app/.env*. Load repo root .env
// so Supabase (and other) vars work locally without duplicating app/.env.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
