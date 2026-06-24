/** Screenshot a single section by id (e.g. SECTION=pricing). */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3001";
const ID = process.env.SECTION || "pricing";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(4500);
await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: "center" }), ID);
await page.waitForTimeout(1500);
const el = await page.$(`#${ID}`);
if (el) await el.screenshot({ path: new URL(`section-${ID}.png`, OUT).pathname });
else console.log("section not found:", ID);
console.log("done", ID);
await browser.close();
