import Image from "next/image";

import { MUSASHI_BG_URL } from "@/lib/constants";

type MusashiBackgroundProps = {
  children: React.ReactNode;
  className?: string;
};

export function MusashiBackground({ children, className = "" }: MusashiBackgroundProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#070707] ${className}`}>
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/musashi-bg.png"
          alt="Miyamoto Musashi duel ukiyo-e (public domain)"
          fill
          priority
          className="object-cover object-center opacity-25 mix-blend-luminosity"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_55%)]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
