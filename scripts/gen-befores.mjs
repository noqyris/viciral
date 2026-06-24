/**
 * Generate authentic "before" frames for the landing's Pre/Posle slider.
 *
 * Takes each real finished example in public/examples/<name>.png and uses
 * Nano Banana *edit* (image-to-image) to produce a raw / amateur "before" of the
 * same scene, so before↔after tells an honest, same-subject story.
 *
 * Run:  node --env-file=.env scripts/gen-befores.mjs
 * Cost: ~$0.0398 per generated image (fal wholesale, on your FAL_KEY).
 */
import { readFile, writeFile } from "node:fs/promises";
import { fal } from "@fal-ai/client";

const MODEL = "fal-ai/nano-banana/edit";
const VARIANTS = 2; // variant A -> <name>-before.png, B -> <name>-before-b.png
const DIR = new URL("../public/examples/", import.meta.url);

const JOBS = [
  {
    name: "website",
    prompt:
      "Turn this polished website into its rough early-draft 'before': a low-fidelity wireframe with plain default system font, black text on white, gray placeholder boxes where images and buttons go, no color, no styling, no polish. Keep the same general page layout regions. Unfinished, boring, amateur.",
  },
  {
    name: "social",
    prompt:
      "Make this look like a dull amateur phone snapshot of the same subject: harsh flat on-camera flash, washed-out colors, slightly blurry, cluttered messy background, crooked framing, no editing or retouching. The boring 'before' photo, clearly unprofessional.",
  },
  {
    name: "cinematic",
    prompt:
      "Make this look like raw, ungraded amateur footage of the same scene: flat low-contrast washed-out colors, dull flat lighting, no cinematic color grade, slight digital noise, plain and amateur. The 'before' of a color grade.",
  },
  {
    name: "brand",
    prompt:
      "Make this look like a rough unstyled first draft of a brand board: plain black text on a white background, default system font, no logo design, no color palette swatches, no layout or styling. The messy, boring 'before'.",
  },
  {
    name: "avatar",
    prompt:
      "Make this look like a plain low-quality webcam selfie of the same person: bad flat indoor lighting, dull colors, slightly blurry and noisy, plain cluttered background, no makeup or styling. An amateur 'before' shot.",
  },
  {
    name: "shortform",
    prompt:
      "Make this look like a dull raw vertical phone clip frame of the same scene: no captions, no text overlays, no graphics, flat amateur lighting, washed-out colors, boring framing. The unedited 'before'.",
  },
];

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing. Run with: node --env-file=.env scripts/gen-befores.mjs");
  process.exit(1);
}
fal.config({ credentials: process.env.FAL_KEY });

async function toFalUrl(name) {
  const buf = await readFile(new URL(`${name}.png`, DIR));
  // Upload to fal storage so the edit endpoint can fetch the reference image.
  const file = new File([buf], `${name}.png`, { type: "image/png" });
  return fal.storage.upload(file);
}

async function editOnce(imageUrl, prompt) {
  const res = await fal.subscribe(MODEL, {
    input: { prompt, image_urls: [imageUrl] },
    logs: false,
  });
  const img = res.data?.images?.[0]?.url;
  if (!img) throw new Error("no image in response");
  return img;
}

async function download(url, outName) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(new URL(`${outName}.png`, DIR), buf);
  return buf.length;
}

const summary = [];
for (const job of JOBS) {
  try {
    process.stdout.write(`\n[${job.name}] uploading reference… `);
    const ref = await toFalUrl(job.name);
    process.stdout.write("ok\n");
    for (let v = 0; v < VARIANTS; v++) {
      const out = v === 0 ? `${job.name}-before` : `${job.name}-before-${String.fromCharCode(97 + v)}`;
      process.stdout.write(`  variant ${v + 1}/${VARIANTS} → editing… `);
      const url = await editOnce(ref, job.prompt);
      const bytes = await download(url, out);
      process.stdout.write(`saved ${out}.png (${(bytes / 1024).toFixed(0)} KB)\n`);
      summary.push({ name: out, ok: true });
    }
  } catch (err) {
    console.error(`  ! ${job.name} failed: ${err.message}`);
    summary.push({ name: job.name, ok: false, error: err.message });
  }
}

const ok = summary.filter((s) => s.ok).length;
console.log(`\nDone. ${ok}/${summary.length} images generated (~$${(ok * 0.0398).toFixed(2)} fal wholesale).`);
