import { chromium, devices } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:3001";
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });
const ctx = await browser.newContext({ ...devices["iPhone 14 Pro"] });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(4500);
const info = await page.evaluate(() => {
  const docW = document.documentElement.clientWidth;
  const clipsX = (cs) => cs.overflowX !== "visible"; // hidden/clip/auto/scroll all contain children
  const found = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= docW + 1) continue;
    // is it clipped by any ancestor before the root?
    let clipped = false;
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      if (clipsX(getComputedStyle(n))) { clipped = true; break; }
    }
    if (clipped) continue;
    found.push({ right: Math.round(r.right), w: Math.round(r.width), tag: el.tagName,
      cls: (el.getAttribute("class") || "").slice(0, 75) });
  }
  found.sort((a, b) => b.right - a.right);
  return { docW, scrollW: document.documentElement.scrollWidth, found: found.slice(0, 12) };
});
console.log("docW", info.docW, "scrollW", info.scrollW);
console.log("UNCLIPPED OVERFLOWERS:\n" + JSON.stringify(info.found, null, 1));
await browser.close();
