/** X-ray: keep layout intact (no hiding), just dim content so the FULL spiral
 *  shows through. Logs the page's scroll fraction so we know what the canvas sees. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3001";
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

// dim everything except the spiral canvas so we see the full spiral through it
await page.addStyleTag({ content: "main,header,footer,nav{opacity:.12 !important}" });

for (const f of [0, 0.08, 0.2]) {
  const info = await page.evaluate((ff) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(ff * max));
    return { max, scrollY: window.scrollY, frac: max > 0 ? window.scrollY / max : 0 };
  }, f);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out(`xray-${f}`) });
  console.log(`xray-${f}`, JSON.stringify(info));
}
await browser.close();
