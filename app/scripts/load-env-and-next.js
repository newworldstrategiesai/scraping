/**
 * Load repo root .env before starting Next, so Supabase and other vars work
 * when running from app/ (Next only loads app/.env* by default).
 */
const path = require("path");
const { spawnSync } = require("child_process");

const appDir = path.resolve(__dirname, "..");
const rootEnv = path.resolve(appDir, "..", ".env");

require("dotenv").config({ path: rootEnv });

const nextBin = path.join(appDir, "node_modules", ".bin", "next");
const args = process.argv.slice(2);
const result = spawnSync(process.execPath, [nextBin, ...args], {
  stdio: "inherit",
  env: process.env,
  cwd: appDir,
});

process.exit(result.status ?? 1);
