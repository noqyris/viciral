/** Capture the hero scroll choreography at rest vs mid-scroll. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const out = (n) => new URL(`${n}.png`, OUT).pathname;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: out("hero-0-rest") });

// Drive Lenis with real wheel events to ~55% through the hero.
for (let k = 0; k < 6; k++) {
  await page.mouse.wheel(0, 80);
  await page.waitForTimeout(110);
}
await page.waitForTimeout(1300);
const probe = await page.evaluate(() => {
  const t2 = document.querySelector("[data-tile='2']");
  const t0 = document.querySelector("[data-tile='0']");
  const orb = document.querySelector("[data-orb]");
  return {
    scrollY: Math.round(window.scrollY),
    tile2_sy: t2 && getComputedStyle(t2).getPropertyValue("--sy").trim(),
    tile0_sx: t0 && getComputedStyle(t0).getPropertyValue("--sx").trim(),
    orbTop: orb && getComputedStyle(orb).top,
  };
});
await page.screenshot({ path: out("hero-1-mid") });
console.log("probe:", JSON.stringify(probe));
console.log("errors:", errors.length ? errors.slice(0, 4).join(" | ") : "none");

await browser.close();
