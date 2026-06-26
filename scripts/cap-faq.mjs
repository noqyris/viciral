/** Verify the FAQ accordion: default-open, mid-transition, and toggled state. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const out = (n) => new URL(`${n}.png`, OUT).pathname;

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
await page.evaluate(() => document.getElementById("faq")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(900);

const btns = page.locator("#faq button[aria-controls]");
const n = await btns.count();
console.log("faq buttons:", n);

// 1) default (item 0 open)
await page.screenshot({ path: out("faq-1-default"), clip: { x: 0, y: 0, width: 1000, height: 900 } });

// 2) click item 0 to CLOSE — capture mid-collapse (~140ms into the 300ms anim)
await btns.nth(0).click();
await page.waitForTimeout(140);
await page.screenshot({ path: out("faq-2-mid-close"), clip: { x: 0, y: 0, width: 1000, height: 900 } });
await page.waitForTimeout(400);
await page.screenshot({ path: out("faq-3-all-closed"), clip: { x: 0, y: 0, width: 1000, height: 900 } });

// 3) open item 2 — capture mid-open then settled
await btns.nth(2).click();
await page.waitForTimeout(150);
await page.screenshot({ path: out("faq-4-mid-open"), clip: { x: 0, y: 0, width: 1000, height: 900 } });
await page.waitForTimeout(400);
await page.screenshot({ path: out("faq-5-item2-open"), clip: { x: 0, y: 0, width: 1000, height: 900 } });
console.log("done");
await browser.close();
