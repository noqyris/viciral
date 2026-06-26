/** Screenshot a route at desktop + iPhone widths. PATHS="/login,/signup". */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3001";
const PATHS = (process.env.PATHS || "/login").split(",");
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const out = (n) => new URL(`${n}.png`, OUT).pathname;
const slug = (p) => p.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "") || "root";

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=swiftshader"],
});

for (const p of PATHS) {
  // desktop
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const dpage = await dctx.newPage();
  await dpage.goto(BASE + p, { waitUntil: "networkidle" });
  await dpage.waitForTimeout(2500);
  await dpage.screenshot({ path: out(`p-${slug(p)}-desktop`) });
  await dctx.close();
  // mobile
  const mctx = await browser.newContext({ ...devices["iPhone 14 Pro"] });
  const mpage = await mctx.newPage();
  await mpage.goto(BASE + p, { waitUntil: "networkidle" });
  await mpage.waitForTimeout(2500);
  await mpage.screenshot({ path: out(`p-${slug(p)}-mobile`) });
  await mctx.close();
  console.log("shot", p);
}
await browser.close();
