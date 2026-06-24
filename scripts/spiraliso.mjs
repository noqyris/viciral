/** Isolate the spiral: hide page content, screenshot just the 3D background. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const out = (n) => new URL(`${n}.png`, OUT).pathname;

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(4500);

// brightness probe of the canvas (average luminance of a downscaled read)
const info = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  if (!c) return { err: "no canvas" };
  return { w: c.width, h: c.height, styleZ: getComputedStyle(c.parentElement).zIndex };
});
console.log("canvas:", JSON.stringify(info));

// hide all content so only the fixed background canvas shows
await page.evaluate(() => {
  for (const el of document.body.children) {
    const c = el;
    if (c.querySelector && c.querySelector("canvas")) continue; // keep the spiral wrapper
    if (c.tagName === "HEADER" || c.tagName === "MAIN" || c.tagName === "FOOTER" || c.tagName === "NAV") c.style.visibility = "hidden";
  }
  document.querySelectorAll("header, main, footer").forEach((e) => (e.style.visibility = "hidden"));
});
await page.waitForTimeout(400);
await page.screenshot({ path: out("iso-0") });

for (const f of [0.3, 0.6]) {
  await page.evaluate((ff) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(ff * max));
  }, f);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out(`iso-${f}`) });
}
console.log("done");
await browser.close();
