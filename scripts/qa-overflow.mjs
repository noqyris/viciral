import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();

async function check(ctx, route, label) {
  const p = await ctx.newPage();
  await p.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const de = document.documentElement;
    window.scrollTo(99999, 0);
    const scrolledX = window.scrollX;
    window.scrollTo(0, 0);
    return {
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      diff: de.scrollWidth - de.clientWidth,
      realScrollX: scrolledX, // >0 means user CAN actually scroll right
      htmlOverflowX: getComputedStyle(de).overflowX,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
    };
  });
  console.log(`${label} ${route}:`, JSON.stringify(r));
  await p.close();
}

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "locale", value: "en", url: BASE }]);
await check(ctx, "/", "390/en");

// login then history
const lp = await ctx.newPage();
await lp.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
await lp.fill('input[type="email"]', "dev@viciral.local");
await lp.fill('input[type="password"]', "dev12345");
await Promise.all([lp.waitForURL("**/studio", { timeout: 30000 }).catch(() => {}), lp.click('button[type="submit"]')]);
await lp.waitForTimeout(1000);
await lp.close();
await check(ctx, "/studio/history", "390/en");
await check(ctx, "/studio", "390/en");

// tablet
const ctx2 = await b.newContext({ viewport: { width: 768, height: 1024 } });
await ctx2.addCookies([{ name: "locale", value: "en", url: BASE }]);
await check(ctx2, "/", "768/en");

await b.close();
