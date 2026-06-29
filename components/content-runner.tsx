"use client";

import { useState } from "react";
import { ImageIcon, Clapperboard, FileText } from "lucide-react";
import { ImageRunner } from "@/components/image-runner";
import { VideoRunner } from "@/components/video-runner";
import { SocialPackRunner } from "@/components/social-pack-runner";
import { useLocale } from "@/components/locale-context";

const TABS = [
  { id: "image", icon: ImageIcon, sr: "Slika", en: "Image" },
  { id: "video", icon: Clapperboard, sr: "Video", en: "Video" },
  { id: "post", icon: FileText, sr: "Objava", en: "Post" },
] as const;

/**
 * Content builder — one surface, pick WHAT to make (Image / Video / Post). Each
 * tab reuses the existing brand-aware runner; everything inherits the active
 * brand's context (look-alike) via the shared brand-context keystone.
 */
export function ContentRunner({ socialAuto }: { socialAuto: boolean }) {
  const locale = useLocale();
  const [tab, setTab] = useState<string>("image");

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {TABS.map((tb) => {
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <tb.icon className="size-4" aria-hidden />
              {locale === "sr" ? tb.sr : tb.en}
            </button>
          );
        })}
      </div>

      {tab === "image" && <ImageRunner />}
      {tab === "video" && <VideoRunner />}
      {tab === "post" && <SocialPackRunner supportsAuto={socialAuto} />}
    </div>
  );
}
