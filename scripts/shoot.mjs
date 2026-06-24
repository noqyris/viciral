/**
 * Quick visual capture of the running app for review.
 * Run:  node scripts/shoot.mjs            (defaults to http://localhost:3000)
 *       BASE_URL=... LOCALE=sr node scripts/shoot.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const LOCALE = process.env.LOCALE || "en";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const out = (n) => new URL(`${n}.png`, OUT).pathname;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await ctx.addCookies([{ name: "locale", value: LOCALE, url: BASE }]);
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

async function settle() {
  // Scroll through the page to trigger IntersectionObserver reveals + slider sweeps.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

async function shotEl(sel, name) {
  try {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100); // let reveal transition + slider sweep finish
    await el.screenshot({ path: out(name) });
    console.log("✓", name);
  } catch (e) {
    console.log("✗", name, e.message);
  }
}

console.log(`Shooting ${BASE} (locale=${LOCALE})…`);
await page.goto(BASE, { waitUntil: "networkidle" });
await settle();

await page.screenshot({ path: out("01-landing-full"), fullPage: true });
console.log("✓ 01-landing-full");

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: out("02-hero") });
console.log("✓ 02-hero");

// Hide the sticky nav so tall element screenshots don't get a nav band stitched
// across them (capture artifact only — the live page is unaffected).
await page.addStyleTag({ content: "header { display: none !important }" });

await shotEl("#before-after", "03-pre-posle");
await shotEl("#modules", "04-moduli");
await shotEl("#cost-of-effort", "05-cena-truda");
await shotEl("#pricing", "06-pricing");
await shotEl("#industries", "08-industrije");

// Login page
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: out("07-login") });
console.log("✓ 07-login");

await browser.close();
console.log(errors.length ? `\nConsole errors:\n- ${errors.slice(0, 10).join("\n- ")}` : "\nNo console errors.");
console.log(`Saved to ${OUT.pathname}`);
