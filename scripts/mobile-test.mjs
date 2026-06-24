/** iPhone emulation: capture key sections + report horizontal-overflow culprits. */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3001";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const out = (n) => new URL(`${n}.png`, OUT).pathname;

const iphone = devices["iPhone 14 Pro"];
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ ...iphone });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(4500);

// horizontal-overflow probe — the classic "broke on mobile" cause
const report = await page.evaluate(() => {
  const docW = document.documentElement.clientWidth;
  const culprits = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed") continue; // full-bleed bg layers are meant to span
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > docW + 1) {
      culprits.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute("class") || "").slice(0, 70),
        right: Math.round(r.right),
        w: Math.round(r.width),
      });
    }
  }
  return {
    viewport: docW,
    scrollW: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth - docW,
    culprits: culprits.slice(0, 25),
  };
});
console.log("viewport:", report.viewport, "| scrollW:", report.scrollW, "| overflowPx:", report.overflow);
console.log("culprits:", JSON.stringify(report.culprits, null, 1));

// top of page (hero)
await page.screenshot({ path: out("m-hero") });

for (const id of ["examples", "before-after", "modules", "how-it-works", "pricing"]) {
  await page.evaluate((x) => document.getElementById(x)?.scrollIntoView({ block: "start" }), id);
  await page.waitForTimeout(900);
  await page.screenshot({ path: out(`m-${id}`) });
}
console.log("errors:", errors.length ? errors.slice(0, 4).join(" | ") : "none");
await browser.close();
