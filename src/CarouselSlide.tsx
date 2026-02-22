import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { getStyle, type BrandConfig, DEFAULT_BRAND } from "./styles";
import { LogoOverlay } from "./LogoOverlay";

export type CarouselProps = {
  slideType: "cover" | "photo" | "details" | "cta";
  title: string;
  location: string;
  price: string;
  area: string;
  rooms: string;
  floor: string;
  year: string;
  features: string[];
  agent: string;
  agentPhone: string;
  photoSrc: string;
  photoLabel: string;
  slideNumber: number;
  totalSlides: number;
  brand?: Partial<BrandConfig>;
};

const SlideNum: React.FC<{ n: number; total: number }> = ({ n, total }) => (
  <div style={{ position: "absolute", bottom: 40, right: 50, fontSize: 22, color: "rgba(255,255,255,0.35)", fontFamily: "system-ui, sans-serif" }}>
    {n} / {total}
  </div>
);

// --- COVER SLIDE ---
const CoverSlide: React.FC<CarouselProps> = (props) => {
  const b = { ...DEFAULT_BRAND, ...props.brand };
  const s = getStyle(b.stylePreset);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile(props.photoSrc)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.4)", transform: "scale(1.05)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)" }} />
      <LogoOverlay logoSrc={b.logoSrc} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.15, textShadow: "0 4px 20px rgba(0,0,0,0.5)", fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: 4, marginBottom: 24 }}>
          {b.headline}
        </div>
        <div style={{ width: 300, height: 4, background: `linear-gradient(90deg, ${s.accentColor}, ${s.accentColorLight}, ${s.accentColor})`, marginBottom: 28, borderRadius: 2 }} />
        <div style={{ fontSize: 30, color: "rgba(255,255,255,0.85)", textAlign: "center", fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 300, letterSpacing: 2, marginBottom: 16 }}>
          {props.title}
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", textAlign: "center", fontFamily: "system-ui, sans-serif", fontWeight: 300, marginBottom: 40 }}>
          {props.location}
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: s.accentColor, fontFamily: "system-ui, -apple-system, sans-serif", textShadow: `0 2px 15px ${s.ringColor}0.3)` }}>
          {props.price}
        </div>
      </AbsoluteFill>
      <SlideNum n={1} total={props.totalSlides} />
    </AbsoluteFill>
  );
};

// --- PHOTO SLIDE ---
const PhotoSlide: React.FC<CarouselProps> = (props) => {
  const b = { ...DEFAULT_BRAND, ...props.brand };
  const s = getStyle(b.stylePreset);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile(props.photoSrc)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }} />
      <LogoOverlay logoSrc={b.logoSrc} />
      <div style={{ position: "absolute", bottom: 60, left: 50 }}>
        <div style={{ background: `linear-gradient(135deg, ${s.accentColor}, ${s.accentColorLight})`, width: 50, height: 4, borderRadius: 2, marginBottom: 14 }} />
        <div style={{ fontSize: 38, fontWeight: 700, color: "white", fontFamily: "system-ui, -apple-system, sans-serif", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
          {props.photoLabel}
        </div>
      </div>
      <SlideNum n={props.slideNumber} total={props.totalSlides} />
    </AbsoluteFill>
  );
};

// --- DETAILS SLIDE ---
const DetailsSlide: React.FC<CarouselProps> = (props) => {
  const b = { ...DEFAULT_BRAND, ...props.brand };
  const s = getStyle(b.stylePreset);

  const details = [
    { icon: "📐", label: "Powierzchnia", value: props.area },
    { icon: "🏠", label: "Pokoje", value: props.rooms },
    { icon: "🏢", label: "Pietro", value: props.floor },
    { icon: "📅", label: "Rok budowy", value: props.year },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${s.bgGradient1} 0%, ${s.bgGradient2} 50%, ${s.bgGradient3} 100%)`, padding: 60, justifyContent: "center" }}>
      <LogoOverlay logoSrc={b.logoSrc} />
      <div style={{ fontSize: 40, fontWeight: 800, color: s.accentColor, marginBottom: 16, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: 4 }}>SZCZEGOLY</div>
      <div style={{ width: 70, height: 4, background: `linear-gradient(90deg, ${s.accentColor}, ${s.accentColorLight})`, marginBottom: 40, borderRadius: 2 }} />
      {details.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginRight: 22, width: 60 }}>{d.icon}</div>
          <div>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", fontFamily: "system-ui, sans-serif", fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const }}>{d.label}</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: "white", fontFamily: "system-ui, sans-serif" }}>{d.value}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap" as const }}>
        {props.features.map((f, i) => (
          <span key={i} style={{ display: "inline-block", background: s.tagBg, border: `1px solid ${s.tagBorder}`, color: s.accentColor, padding: "10px 20px", borderRadius: 50, fontSize: 22, fontWeight: 600, marginRight: 10, marginBottom: 10, fontFamily: "system-ui, sans-serif" }}>{f}</span>
        ))}
      </div>
      <SlideNum n={props.slideNumber} total={props.totalSlides} />
    </AbsoluteFill>
  );
};

// --- CTA SLIDE ---
const CtaSlide: React.FC<CarouselProps> = (props) => {
  const b = { ...DEFAULT_BRAND, ...props.brand };
  const s = getStyle(b.stylePreset);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${s.bgGradient1} 0%, #0a0a1a 100%)`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", border: `2px solid ${s.ringColor}0.12)` }} />
      <div style={{ position: "absolute", width: 550, height: 550, borderRadius: "50%", border: `1px solid ${s.ringColor}0.06)` }} />
      <LogoOverlay logoSrc={b.logoSrc} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, color: "rgba(255,255,255,0.55)", fontFamily: "system-ui, sans-serif", fontWeight: 300, letterSpacing: 6, marginBottom: 16 }}>
          {b.ctaSubtext}
        </div>
        <div style={{ fontSize: 50, fontWeight: 800, color: "white", fontFamily: "system-ui, sans-serif", marginBottom: 40 }}>
          {b.ctaText}
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: s.accentColor, fontFamily: "system-ui, sans-serif", letterSpacing: 3, marginBottom: 20 }}>
          {props.agentPhone}
        </div>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.6)", fontFamily: "system-ui, sans-serif", fontWeight: 400 }}>
          {props.agent}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 80, textAlign: "center" }}>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.35)", fontFamily: "system-ui, sans-serif" }}>{props.price}</div>
      </div>
      <SlideNum n={props.slideNumber} total={props.totalSlides} />
    </AbsoluteFill>
  );
};

// --- MAIN ---
export const CarouselSlide: React.FC<CarouselProps> = (props) => {
  switch (props.slideType) {
    case "cover": return <CoverSlide {...props} />;
    case "photo": return <PhotoSlide {...props} />;
    case "details": return <DetailsSlide {...props} />;
    case "cta": return <CtaSlide {...props} />;
    default: return <CoverSlide {...props} />;
  }
};
