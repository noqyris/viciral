import { describe, expect, it } from "vitest";
import { TEMPLATES, templatesFor, getTemplate } from "./registry";
import { getModuleDef } from "@/lib/modules/registry";

// Required fields a user fills in (URLs / names) that templates intentionally omit.
function fillRequired(slug: string): Record<string, unknown> {
  switch (slug) {
    case "website":
      return { siteName: "Primer brenda" };
    case "avatar":
      return { imageUrl: "https://example.com/portret.png" };
    case "short-form":
      return { mediaUrl: "https://example.com/video.mp4" };
    case "image-tools":
      return { imageUrl: "https://example.com/slika.png" };
    case "dubbing":
      return { videoUrl: "https://example.com/video.mp4" };
    default:
      return {};
  }
}

describe("templates registry", () => {
  it("every template targets a real, available module", () => {
    for (const t of TEMPLATES) {
      const mod = getModuleDef(t.moduleSlug);
      expect(mod, t.id).toBeDefined();
      expect(mod!.status).toBe("available");
    }
  });

  it("every template's inputs are valid for its module's input schema (no drift)", () => {
    for (const t of TEMPLATES) {
      const mod = getModuleDef(t.moduleSlug)!;
      const candidate = { ...fillRequired(t.moduleSlug), ...t.inputs };
      const parsed = mod.inputSchema.safeParse(candidate);
      expect(
        parsed.success,
        `${t.id}: ${parsed.success ? "" : JSON.stringify(parsed.error.issues)}`,
      ).toBe(true);
    }
  });

  it("helpers filter by slug and scope id to its module", () => {
    expect(templatesFor("social-pack").length).toBeGreaterThan(0);
    expect(templatesFor("does-not-exist")).toEqual([]);
    const first = TEMPLATES[0];
    expect(getTemplate(first.id, first.moduleSlug)?.id).toBe(first.id);
    expect(getTemplate(first.id, "wrong-slug")).toBeUndefined();
    expect(getTemplate("nope")).toBeUndefined();
  });
});
