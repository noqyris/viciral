/** Capture the full-page WebGL spiral at several scroll positions. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const out = (n) => new URL(`${n}.png`, OUT).pathname;

const browser = await chromium.launch({
  args: [
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(4500); // let the dynamic three.js canvas mount + render (slow software GL)

const hasCanvas = await page.evaluate(() => !!document.querySelector("canvas"));
const glOk = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  if (!c) return "no-canvas";
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  return gl ? "webgl-ok" : "no-context";
});
console.log("canvas present:", hasCanvas, "| gl:", glOk);

const fracs = [0, 0.16, 0.34, 0.55];
for (let i = 0; i < fracs.length; i++) {
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(f * max));
  }, fracs[i]);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: out(`spiral-${i}`) });
  console.log("shot spiral-" + i + " @", fracs[i]);
}
console.log("errors:", errors.length ? errors.slice(0, 5).join(" | ") : "none");
await browser.close();
