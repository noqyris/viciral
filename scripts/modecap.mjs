/** Capture each spiral prominence mode (1/2/3) at the hero + a mid-scroll. */
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

for (const mode of [1, 2, 3]) {
  await page.evaluate((m) => localStorage.setItem("viciral.spiralMode", String(m)), mode);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: out(`mode-${mode}-hero`) });
  await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(max * 0.34));
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out(`mode-${mode}-mid`) });
  console.log("captured mode", mode);
}
await browser.close();
