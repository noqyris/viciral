/** Functional check for the scroll-FX (GSAP + Lenis) across all sections. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const out = (n) => new URL(`${n}.png`, OUT).pathname;
const browser = await chromium.launch();

// 1) Active FX: init, errors, reel pin setup, and assemble cards end visible.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const cls = await page.evaluate(() => document.documentElement.className);
  const reel = await page.evaluate(() => {
    const s = document.querySelector("#reel");
    const inner = s?.firstElementChild;
    return { hasHeight: !!s && s.style.height !== "" && parseInt(s.style.height) > window.innerHeight, sticky: getComputedStyle(inner).position };
  });

  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.55);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180));
    }
  });
  await page.waitForTimeout(1000);
  const op = await page.evaluate(() =>
    [...document.querySelectorAll("[data-fx='assemble']")].map((el) => Number(getComputedStyle(el).opacity.slice(0, 4))),
  );
  console.log("lenis+fx active:", cls.includes("lenis") && cls.includes("fx"));
  console.log("reel pin set:", reel.hasHeight, "| inner position:", reel.sticky);
  console.log(`assemble cards visible: ${op.filter((o) => o > 0.9).length}/${op.length}`);
  console.log("console errors:", errors.length ? errors.slice(0, 6).join(" | ") : "none");
  await ctx.close();
}

// 2) Reduced-motion: FX off, reel must fall back (no inline height), cards static.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const reel = await page.evaluate(() => document.querySelector("#reel")?.style.height || "");
  const op = await page.evaluate(() =>
    [...document.querySelectorAll("[data-fx='assemble']")].map((el) => Number(getComputedStyle(el).opacity.slice(0, 4))),
  );
  console.log(`\n[reduced] reel inline height (should be empty): "${reel}"`);
  console.log(`[reduced] cards visible (should be all): ${op.filter((o) => o > 0.9).length}/${op.length}`);
  await ctx.close();
}

// 3) Screenshots: modules (assembled) + reel header.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  for (const [sel, name] of [["#modules", "10-moduli"], ["#reel", "11-reel"]]) {
    try {
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.locator(sel).screenshot({ path: out(name) });
      console.log("shot", name);
    } catch (e) {
      console.log("shot fail", name, e.message);
    }
  }
  await ctx.close();
}

await browser.close();
