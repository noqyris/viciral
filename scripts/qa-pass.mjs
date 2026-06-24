/**
 * Comprehensive UI/UX QA pass (read-only; never clicks paid "Generate" actions).
 * Drives Chromium across viewports × locales, collects console/network/overflow/
 * emoji/broken-image/alt data programmatically (cheap), exercises interactions
 * (sliders, anchors, language switch, auth validation, sidebar), saves PNGs to
 * .screenshots/ and a full JSON report to .screenshots/qa-report.json.
 *
 * Run: node scripts/qa-pass.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = new URL("../.screenshots/", import.meta.url);
await mkdir(OUT, { recursive: true });
const shot = (n) => new URL(`${n}.png`, OUT).pathname;

const VIEWPORTS = [
  { id: "390", width: 390, height: 844 },
  { id: "768", width: 768, height: 1024 },
  { id: "1440", width: 1440, height: 900 },
];
const LOCALES = ["en", "sr"];

const MODULE_SLUGS = [
  "social-pack", "cinematic", "brand-kit", "website", "image-tools",
  "short-form", "editor", "avatar", "dubbing", "music",
];
const PUBLIC_ROUTES = ["/", "/login", "/signup"];
const STUDIO_ROUTES = [
  "/studio",
  ...MODULE_SLUGS.map((s) => `/studio/${s}`),
  "/studio/templates", "/studio/calendar", "/studio/history",
  "/studio/brand", "/studio/connections",
];

const report = []; // one entry per (vp,locale,route)
const interactions = []; // named interaction results

// ---- in-page collectors (run in browser) ----
const COLLECT = () => {
  const EMOJI = /\p{Extended_Pictographic}/u;
  const emojiHits = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const txt = node.nodeValue || "";
    if (EMOJI.test(txt) && txt.trim()) {
      const el = node.parentElement;
      emojiHits.push({
        text: txt.trim().slice(0, 50),
        tag: el ? el.tagName.toLowerCase() : "?",
        cls: el ? String(el.className).slice(0, 60) : "",
      });
    }
  }
  const imgs = Array.from(document.images);
  const broken = imgs
    .filter((i) => i.complete && i.naturalWidth === 0)
    .map((i) => i.currentSrc || i.src);
  const noAlt = imgs
    .filter((i) => !i.hasAttribute("alt"))
    .map((i) => i.currentSrc || i.src);
  const de = document.documentElement;
  const overflowX = de.scrollWidth - de.clientWidth;
  // find elements poking past the right edge
  const offenders = [];
  if (overflowX > 1) {
    const vw = window.innerWidth;
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1 && r.left < vw) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || "").slice(0, 50),
          right: Math.round(r.right),
        });
        if (offenders.length >= 6) break;
      }
    }
  }
  // credit pill (studio) — any text like "123 credits"/"123 kredita"
  let creditPill = null;
  for (const el of document.querySelectorAll("span,div")) {
    const t = (el.textContent || "").trim();
    if (/^\d+\s*(credits|kredita)$/i.test(t) || /\b\d+\s*(credits|kredita)\b/.test(t)) {
      if (t.length < 24) { creditPill = t; break; }
    }
  }
  const h1 = document.querySelector("h1");
  return {
    title: document.title,
    h1: h1 ? h1.textContent.trim().slice(0, 80) : null,
    emojiHits,
    broken,
    noAlt: noAlt.slice(0, 8),
    noAltCount: noAlt.length,
    overflowX,
    offenders,
    creditPill,
    bodyChars: document.body.innerText.length,
  };
};

async function settle(page) {
  try {
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
  } catch {}
}

async function visit(ctx, vp, locale, route, { auth = false, full = false } = {}) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failed = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));
  page.on("response", (r) => {
    const s = r.status();
    if (s >= 400) failed.push({ url: r.url().replace(BASE, ""), status: s });
  });
  page.on("requestfailed", (r) => {
    failed.push({ url: r.url().replace(BASE, ""), status: "FAILED:" + (r.failure()?.errorText || "") });
  });

  let status = null;
  let finalUrl = route;
  let err = null;
  try {
    const resp = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 45000 });
    status = resp ? resp.status() : null;
    await page.waitForTimeout(700);
    await settle(page);
    finalUrl = page.url().replace(BASE, "") || "/";
  } catch (e) {
    err = String(e).split("\n")[0].slice(0, 160);
  }

  let data = {};
  try { data = await page.evaluate(COLLECT); } catch (e) { data.collectErr = String(e).slice(0, 120); }

  const slug = route.replace(/\//g, "_").replace(/^_/, "") || "root";
  const name = `${vp.id}-${locale}-${slug}`;
  try {
    await page.screenshot({ path: shot(name), fullPage: full });
  } catch {}

  const entry = {
    route, finalUrl, vp: vp.id, locale, auth, status, err,
    consoleErrors, pageErrors, failed,
    ...data,
    screenshot: name + ".png",
  };
  report.push(entry);
  return { page, entry };
}

async function login(ctx, vp, locale) {
  const page = await ctx.newPage();
  const rec = { vp: vp.id, locale, name: "login-flow", ok: false, notes: [] };
  try {
    // guard: unauth /studio should redirect to /login
    const g = await page.goto(BASE + "/studio", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(400);
    rec.guardRedirect = page.url().replace(BASE, "");
    rec.guardStatus = g ? g.status() : null;

    // go to login, fill + submit good creds
    await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.fill('input[type="email"]', "dev@viciral.local");
    await page.fill('input[type="password"]', "dev12345");
    await Promise.all([
      page.waitForURL("**/studio", { timeout: 30000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(1200);
    rec.afterLogin = page.url().replace(BASE, "");
    rec.ok = page.url().includes("/studio");
  } catch (e) {
    rec.err = String(e).split("\n")[0].slice(0, 160);
  }
  interactions.push(rec);
  await page.close();
  return rec.ok;
}

async function testAuthValidation(ctx, vp, locale) {
  const page = await ctx.newPage();
  const rec = { vp: vp.id, locale, name: "auth-validation", notes: [] };
  try {
    await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 45000 });
    // Google button present?
    rec.googleBtn = await page.locator("button", { hasText: /Google/i }).count();
    // empty submit -> HTML5 invalid, stays on /login
    await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(300);
    rec.emailInvalidOnEmpty = await page.evaluate(() => {
      const el = document.querySelector('input[type="email"]');
      return el ? !el.validity.valid : null;
    });
    rec.stillOnLogin = page.url().includes("/login");
    // bad creds -> error banner
    await page.fill('input[type="email"]', "dev@viciral.local");
    await page.fill('input[type="password"]', "wrong-password-xyz");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);
    rec.errorBanner = await page.locator(".text-red-300, [class*='red']").first().textContent().catch(() => null);
    rec.errorShown = !!(rec.errorBanner && rec.errorBanner.trim());
  } catch (e) {
    rec.err = String(e).split("\n")[0].slice(0, 160);
  }
  interactions.push(rec);
  await page.close();
}

async function testLandingInteractions(ctx, vp, locale) {
  const page = await ctx.newPage();
  const rec = { vp: vp.id, locale, name: "landing-interactions", notes: [] };
  try {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(600);

    // --- before/after auto-reveal: scroll #pre-posle into view, read --pos of each .ba
    await page.locator("#before-after").scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1600); // let 1200ms sweep finish
    rec.sliderPositions = await page.$$eval(".ba", (els) =>
      els.map((el) => getComputedStyle(el).getPropertyValue("--pos").trim())
    );

    // --- keyboard on first range
    const range = page.locator(".ba-range").first();
    await range.focus().catch(() => {});
    const before = await range.evaluate((el) => el.value).catch(() => null);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(150);
    const after = await range.evaluate((el) => el.value).catch(() => null);
    rec.keyboardSlider = { before, after, changed: before !== after };

    // --- drag the first .ba
    const ba = page.locator(".ba").first();
    const box = await ba.boundingBox();
    let dragChanged = null;
    if (box) {
      const posBefore = await ba.evaluate((el) => getComputedStyle(el).getPropertyValue("--pos"));
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(150);
      const posAfter = await ba.evaluate((el) => getComputedStyle(el).getPropertyValue("--pos"));
      dragChanged = { posBefore: posBefore.trim(), posAfter: posAfter.trim(), changed: posBefore !== posAfter };
    }
    rec.dragSlider = dragChanged;

    // --- nav anchors (desktop only; nav links hidden < md)
    if (vp.width >= 768) {
      const anchors = ["#modules", "#examples", "#cost-of-effort"];
      rec.anchors = {};
      for (const a of anchors) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const link = page.locator(`a[href="${a}"]`).first();
        const cnt = await link.count();
        if (!cnt) { rec.anchors[a] = "NO-LINK"; continue; }
        await link.click().catch(() => {});
        await page.waitForTimeout(700);
        const res = await page.evaluate((sel) => {
          const id = sel.slice(1);
          const el = document.getElementById(id);
          if (!el) return "NO-TARGET";
          const r = el.getBoundingClientRect();
          return { hash: location.hash, top: Math.round(r.top), inView: r.top > -50 && r.top < window.innerHeight };
        }, a);
        rec.anchors[a] = res;
      }
    }

    // --- language switch toggle + persist
    await page.evaluate(() => window.scrollTo(0, 0));
    const other = locale === "en" ? "SR" : "EN";
    const btn = page.locator("button", { hasText: new RegExp(`^${other}$`) }).first();
    const beforeText = await page.locator("body").innerText().catch(() => "");
    await btn.click().catch(() => {});
    await page.waitForTimeout(1200);
    const cookieAfter = (await ctx.cookies()).find((c) => c.name === "locale")?.value;
    const afterText = await page.locator("body").innerText().catch(() => "");
    rec.langSwitch = {
      cookieAfter,
      textChanged: beforeText.slice(0, 400) !== afterText.slice(0, 400),
    };
    // persist across reload
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    rec.langPersistCookie = (await ctx.cookies()).find((c) => c.name === "locale")?.value;
    // restore locale cookie for cleanliness
    await ctx.addCookies([{ name: "locale", value: locale, url: BASE }]);
  } catch (e) {
    rec.err = String(e).split("\n")[0].slice(0, 160);
  }
  interactions.push(rec);
  await page.close();
}

// ----------------- run -----------------
const browser = await chromium.launch();
console.log(`QA pass against ${BASE}`);

for (const vp of VIEWPORTS) {
  for (const locale of LOCALES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.width < 768,
      hasTouch: vp.width < 768,
    });
    await ctx.addCookies([{ name: "locale", value: locale, url: BASE }]);
    console.log(`\n── ${vp.id} / ${locale} ──`);

    // public routes (landing full page)
    for (const r of PUBLIC_ROUTES) {
      const { page } = await visit(ctx, vp, locale, r, { full: r === "/" });
      await page.close();
      process.stdout.write(`  ${r}\n`);
    }

    // landing interactions (run on 1440 + 390 only to save time)
    if (vp.id === "1440" || vp.id === "390") {
      await testLandingInteractions(ctx, vp, locale);
      await testAuthValidation(ctx, vp, locale);
    }

    // auth + guard + login
    const ok = await login(ctx, vp, locale);
    process.stdout.write(`  login ok=${ok}\n`);

    if (ok) {
      for (const r of STUDIO_ROUTES) {
        const { page } = await visit(ctx, vp, locale, r, { auth: true });
        await page.close();
        process.stdout.write(`  ${r}\n`);
      }
      // unknown slug -> 404
      const { page } = await visit(ctx, vp, locale, "/studio/__nope__", { auth: true });
      await page.close();
    }

    await ctx.close();
  }
}

await browser.close();
await writeFile(new URL("qa-report.json", OUT), JSON.stringify({ report, interactions }, null, 2));

// ---- concise stdout summary ----
const totalConsole = report.reduce((a, e) => a + e.consoleErrors.length, 0);
const totalPageErr = report.reduce((a, e) => a + e.pageErrors.length, 0);
console.log("\n\n================ SUMMARY ================");
console.log(`pages visited: ${report.length}, console errors: ${totalConsole}, page errors: ${totalPageErr}`);

console.log("\n-- ROUTES with console/page errors --");
for (const e of report) {
  if (e.consoleErrors.length || e.pageErrors.length || e.err) {
    console.log(`  ${e.vp}/${e.locale} ${e.route} -> status=${e.status} err=${e.err || ""}`);
    e.pageErrors.slice(0, 3).forEach((x) => console.log(`     PAGEERR: ${x}`));
    e.consoleErrors.slice(0, 3).forEach((x) => console.log(`     CONSOLE: ${x}`));
  }
}

console.log("\n-- FAILED REQUESTS (non-expected) --");
for (const e of report) {
  const f = e.failed.filter((x) => !String(x.url).includes("__nope__"));
  if (f.length) console.log(`  ${e.vp}/${e.locale} ${e.route}: ${JSON.stringify(f.slice(0, 5))}`);
}

console.log("\n-- HORIZONTAL OVERFLOW --");
for (const e of report) {
  if (e.overflowX > 1) console.log(`  ${e.vp}/${e.locale} ${e.route}: +${e.overflowX}px ${JSON.stringify(e.offenders?.slice(0,3) || [])}`);
}

console.log("\n-- EMOJI-AS-ICON HITS --");
const emojiSeen = new Set();
for (const e of report) {
  for (const h of e.emojiHits || []) {
    const k = h.text + h.tag;
    if (emojiSeen.has(k)) continue;
    emojiSeen.add(k);
    console.log(`  ${e.route} <${h.tag}> "${h.text}" (.${h.cls})`);
  }
}
if (!emojiSeen.size) console.log("  none");

console.log("\n-- BROKEN IMAGES --");
for (const e of report) {
  if (e.broken?.length) console.log(`  ${e.vp}/${e.locale} ${e.route}: ${JSON.stringify(e.broken.slice(0,4))}`);
}

console.log("\n-- IMAGES MISSING ALT (count) --");
for (const e of report) {
  if (e.noAltCount) console.log(`  ${e.vp}/${e.locale} ${e.route}: ${e.noAltCount} (${JSON.stringify(e.noAlt.slice(0,3))})`);
}

console.log("\n-- AUTH GUARD / LOGIN --");
for (const r of interactions.filter((i) => i.name === "login-flow")) {
  console.log(`  ${r.vp}/${r.locale}: guard->${r.guardRedirect} (status ${r.guardStatus}), afterLogin=${r.afterLogin}, ok=${r.ok} ${r.err || ""}`);
}

console.log("\n-- AUTH VALIDATION --");
for (const r of interactions.filter((i) => i.name === "auth-validation")) {
  console.log(`  ${r.vp}/${r.locale}: googleBtn=${r.googleBtn}, emptyInvalid=${r.emailInvalidOnEmpty}, stillOnLogin=${r.stillOnLogin}, errorShown=${r.errorShown} "${(r.errorBanner||'').trim().slice(0,40)}" ${r.err || ""}`);
}

console.log("\n-- LANDING INTERACTIONS --");
for (const r of interactions.filter((i) => i.name === "landing-interactions")) {
  console.log(`  ${r.vp}/${r.locale}:`);
  console.log(`     sliderPositions=${JSON.stringify(r.sliderPositions)}`);
  console.log(`     keyboard=${JSON.stringify(r.keyboardSlider)} drag=${JSON.stringify(r.dragSlider)}`);
  if (r.anchors) console.log(`     anchors=${JSON.stringify(r.anchors)}`);
  console.log(`     langSwitch=${JSON.stringify(r.langSwitch)} persistCookie=${r.langPersistCookie}`);
  if (r.err) console.log(`     ERR=${r.err}`);
}

console.log("\n-- CREDIT PILL (studio pages) --");
const pills = new Set();
for (const e of report) {
  if (e.auth && e.creditPill) pills.add(`${e.vp}/${e.locale}:${e.creditPill}`);
}
console.log("  " + ([...pills].slice(0, 8).join("  |  ") || "NONE FOUND"));

console.log("\n-- STUDIO ROUTE STATUSES --");
for (const e of report) {
  if (e.auth && (e.status !== 200 || e.finalUrl !== e.route)) {
    console.log(`  ${e.vp}/${e.locale} ${e.route} -> status=${e.status} final=${e.finalUrl}`);
  }
}
console.log("\nDone. Full JSON at .screenshots/qa-report.json");
