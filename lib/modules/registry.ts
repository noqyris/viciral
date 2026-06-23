import type { ModuleDef } from "./types";
import { socialPackModule } from "./social-pack";
import { cinematicModule } from "./cinematic";
import { brandKitModule } from "./brand-kit";
import { websiteModule } from "./website";
import { imageToolsModule } from "./image-tools";
import { shortFormModule } from "./short-form";
import { editorModule } from "./editor";
import { avatarModule } from "./avatar";
import { dubbingModule } from "./dubbing";
import { musicModule } from "./music";

/**
 * Module registry. The hub and the studio runner render from this list, so
 * adding a module = adding its definition here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MODULES: ModuleDef<any>[] = [
  socialPackModule,
  cinematicModule,
  brandKitModule,
  websiteModule,
  imageToolsModule,
  shortFormModule,
  editorModule,
  avatarModule,
  dubbingModule,
  musicModule,
];

export function getModuleDef(slug: string): ModuleDef | undefined {
  return MODULES.find((m) => m.slug === slug);
}
