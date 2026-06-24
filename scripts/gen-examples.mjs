/**
 * Generate extra showcase examples (after + matching raw "before").
 *   MODE=after  node --env-file=.env scripts/gen-examples.mjs   (text->image, ~$0.0398 each)
 *   MODE=before node --env-file=.env scripts/gen-examples.mjs   (edits each <name>.png -> <name>-before.png)
 * Stops if it would exceed BUDGET (default $1.20) to protect the fal balance.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fal } from "@fal-ai/client";

const MODE = process.env.MODE || "after";
const BUDGET = Number(process.env.BUDGET || "1.20");
const PRICE = 0.0398;
const DIR = new URL("../public/examples/", import.meta.url);

const ITEMS = [
  {
    name: "skincare",
    aspect: "1:1",
    after:
      "Premium product photography: a frosted glass skincare serum bottle with a gold dropper on a cream marble surface, soft eucalyptus leaf shadows, warm minimal beige tones, studio softbox lighting, high-end cosmetics advertisement, ultra sharp, photorealistic.",
    before:
      "Make this look like a dull amateur phone snapshot of the same bottle on a cluttered bathroom counter, harsh flash, washed-out colors, crooked framing, no styling.",
  },
  {
    name: "food",
    aspect: "16:9",
    after:
      "Cinematic food photography: a gourmet plated truffle pasta in a dark moody fine-dining restaurant, dramatic warm rim light, gentle rising steam, shallow depth of field, rich shadows, Michelin-star menu shot, photorealistic.",
    before:
      "Make this look like a dull amateur phone photo of the same dish on a plain kitchen table, flat harsh overhead light, washed out, unappetizing, no styling.",
  },
  {
    name: "saas",
    aspect: "16:9",
    after:
      "A sleek modern SaaS landing-page hero: a clean analytics dashboard UI with charts and glassmorphism cards on a laptop, soft violet-to-blue gradient backdrop, professional web design mockup, crisp and premium.",
    before:
      "Turn this into a plain low-fidelity wireframe of the same page: gray placeholder boxes, default system font, black text on white, no color, no styling, an unfinished draft.",
  },
  {
    name: "realestate",
    aspect: "16:9",
    after:
      "Architectural interior photography: a luxury modern living room with floor-to-ceiling windows, warm sunset light, designer furniture and plants, real estate listing hero, wide angle, photorealistic, magazine quality.",
    before:
      "Make this look like a messy amateur phone photo of the same room: cluttered, dim uneven lighting, crooked angle, unstaged and boring.",
  },
  {
    name: "fashion",
    aspect: "9:16",
    after:
      "Editorial fashion photography: a stylish model in an elegant camel autumn coat against a minimalist studio backdrop, soft directional light, full-body magazine look, photorealistic, high fashion.",
    before:
      "Make this look like an amateur mirror selfie of the same outfit: bad bedroom lighting, cluttered background, phone visible, slightly blurry, no styling.",
  },
  {
    name: "fitness",
    aspect: "9:16",
    after:
      "Vibrant vertical fitness reel still: an energetic woman in athletic wear mid-workout in a bright modern gym, dynamic motion, bold colorful lighting, motivational social-media content, photorealistic.",
    before:
      "Make this a dull raw vertical phone clip frame of the same scene: no text overlay, flat lighting, washed-out colors, boring framing, unedited.",
  },
];

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing. Run: MODE=after node --env-file=.env scripts/gen-examples.mjs");
  process.exit(1);
}
fal.config({ credentials: process.env.FAL_KEY });

async function download(url, outName) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  await writeFile(new URL(`${outName}.png`, DIR), Buffer.from(await r.arrayBuffer()));
}

async function genAfter(item) {
  const res = await fal.subscribe("fal-ai/nano-banana", {
    input: { prompt: item.after, num_images: 1, aspect_ratio: item.aspect },
    logs: false,
  });
  const url = res.data?.images?.[0]?.url;
  if (!url) throw new Error("no image");
  await download(url, item.name);
}

async function genBefore(item) {
  const buf = await readFile(new URL(`${item.name}.png`, DIR));
  const ref = await fal.storage.upload(new File([buf], `${item.name}.png`, { type: "image/png" }));
  const res = await fal.subscribe("fal-ai/nano-banana/edit", {
    input: { prompt: item.before, image_urls: [ref] },
    logs: false,
  });
  const url = res.data?.images?.[0]?.url;
  if (!url) throw new Error("no image");
  await download(url, `${item.name}-before`);
}

let spent = 0;
let n = 0;
for (const item of ITEMS) {
  if (spent + PRICE > BUDGET) {
    console.log(`\nStopping — next call would exceed BUDGET $${BUDGET.toFixed(2)}.`);
    break;
  }
  try {
    process.stdout.write(`[${MODE}] ${item.name}… `);
    if (MODE === "before") await genBefore(item);
    else await genAfter(item);
    spent += PRICE;
    n++;
    console.log(`ok ($${spent.toFixed(2)} so far)`);
  } catch (e) {
    console.error(`! ${item.name} failed: ${e.message}`);
  }
}
console.log(`\nDone. ${n} ${MODE} images, ~$${(n * PRICE).toFixed(2)} fal wholesale.`);
