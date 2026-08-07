import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(os.homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
  path.join(os.homedir(), ".cache/puppeteer/chrome"),
];

export async function findChrome(): Promise<string> {
  for (const c of CANDIDATES) {
    if (!c) continue;
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      try {
        const found = execSync(
          `find ${c} -name "chrome" -type f 2>/dev/null | head -1`,
        )
          .toString()
          .trim();
        if (found) return found;
      } catch {
        /* continue */
      }
    }
  }
  throw new Error(
    "Chrome not found. Set CHROME_PATH to your Chrome/Chromium binary.",
  );
}
