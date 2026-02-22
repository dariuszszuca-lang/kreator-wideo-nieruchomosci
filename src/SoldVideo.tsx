import React from "react";
import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig,
  Img, interpolate, spring, staticFile,
} from "remotion";
import { getStyle, type BrandConfig, DEFAULT_BRAND } from "./styles";
import { LogoOverlay } from "./LogoOverlay";
import { AudioTrack } from "./AudioTrack";

export type SoldProps = {
  title: string;
  location: string;
  price: string;
  agent: string;
  agentPhone: string;
  photoSrc: string;
  brand?: Partial<BrandConfig>;
  musicSrc?: string;
  musicVolume?: number;
};

// --- SCENE 1: Photo with zoom (90 frames = 3s) ---
const PhotoScene: React.FC<SoldProps> = (props) => {
  const frame = useCurrentFrame();
  const b = { ...DEFAULT_BRAND, ...props.brand };

  const scale = interpolate(frame, [0, 89], [1, 1.15], { extrapolateRight: "clamp" });
  const brightness = interpolate(frame, [60, 89], [0.5, 0.2], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile(props.photoSrc)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})`, filter: `brightness(${brightness})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)" }} />
      <LogoOverlay logoSrc={b.logoSrc} />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 120 }}>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", fontFamily: "system-ui, sans-serif", fontWeight: 300, textAlign: "center", opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" }) }}>
          {props.title}
        </div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.5)", fontFamily: "system-ui, sans-serif", marginTop: 8, opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" }) }}>
          {props.location}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 2: SPRZEDANE! burst (90 frames = 3s) ---
const SoldScene: React.FC<{ brand?: Partial<BrandConfig> }> = ({ brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = { ...DEFAULT_BRAND, ...brand };
  const s = getStyle(b.stylePreset);

  const titleScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 18, config: { damping: 6, mass: 0.8 } });
  const titleRotate = spring({ frame, fps, from: -8, to: 0, durationInFrames: 20, config: { damping: 8 } });
  const flashOpacity = interpolate(frame, [0, 6, 15], [0, 0.8, 0], { extrapolateRight: "clamp" });
  const bgPulse = Math.sin(frame * 0.15) * 0.02 + 1;

  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const speed = 4 + (i % 3) * 2;
    const delay = (i % 4) * 3;
    const startFrame = Math.max(0, frame - delay);
    const x = Math.cos(angle) * startFrame * speed;
    const y = Math.sin(angle) * startFrame * speed - startFrame * 0.5;
    const opacity = interpolate(startFrame, [0, 10, 50], [0, 1, 0], { extrapolateRight: "clamp" });
    const size = 6 + (i % 3) * 4;
    return { x, y, opacity, size, angle: i * 37 };
  });

  const subtitleOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = spring({ frame: frame - 30, fps, from: 30, to: 0, durationInFrames: 15 });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${s.bgGradient1} 0%, #0a0a1a 100%)`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", border: `3px solid ${s.ringColor}0.15)`, transform: `scale(${bgPulse})` }} />
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", border: `2px solid ${s.ringColor}0.08)`, transform: `scale(${bgPulse * 0.97})` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle, ${s.accentColorLight}, transparent 70%)`, opacity: flashOpacity }} />
      {particles.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: p.size, height: p.size, background: i % 2 === 0 ? s.accentColor : s.accentColorLight, borderRadius: i % 3 === 0 ? "50%" : 2, transform: `translate(${p.x}px, ${p.y}px) rotate(${p.angle + frame * 3}deg)`, opacity: p.opacity }} />
      ))}
      <div style={{ textAlign: "center", transform: `scale(${titleScale}) rotate(${titleRotate}deg)` }}>
        <div style={{ fontSize: 90, fontWeight: 900, color: s.accentColor, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: 8, textShadow: `0 4px 30px ${s.ringColor}0.4)` }}>
          SPRZEDANE!
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 200, textAlign: "center", opacity: subtitleOpacity, transform: `translateY(${subtitleY}px)` }}>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.6)", fontFamily: "system-ui, sans-serif", fontWeight: 300, letterSpacing: 4 }}>KOLEJNA UDANA TRANSAKCJA</div>
      </div>
    </AbsoluteFill>
  );
};

// --- SCENE 3: Thank you + agent (60 frames = 2s) ---
const ThankYouScene: React.FC<SoldProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = { ...DEFAULT_BRAND, ...props.brand };
  const s = getStyle(b.stylePreset);

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const nameY = spring({ frame: frame - 15, fps, from: 30, to: 0, durationInFrames: 15 });
  const nameOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${s.bgGradient1} 0%, #0a0a1a 100%)`, justifyContent: "center", alignItems: "center" }}>
      <LogoOverlay logoSrc={b.logoSrc} />
      <div style={{ textAlign: "center", opacity: fadeIn }}>
        <div style={{ fontSize: 36, color: "rgba(255,255,255,0.7)", fontFamily: "system-ui, sans-serif", fontWeight: 300, letterSpacing: 4, marginBottom: 10 }}>DZIEKUJE</div>
        <div style={{ fontSize: 44, fontWeight: 700, color: "white", fontFamily: "system-ui, sans-serif", marginBottom: 50 }}>ZA ZAUFANIE</div>
      </div>
      <div style={{ textAlign: "center", opacity: nameOpacity, transform: `translateY(${nameY}px)` }}>
        <div style={{ width: 200, height: 3, background: `linear-gradient(90deg, transparent, ${s.accentColor}, transparent)`, marginBottom: 30, marginLeft: "auto", marginRight: "auto" }} />
        <div style={{ fontSize: 32, fontWeight: 700, color: s.accentColor, fontFamily: "system-ui, sans-serif", letterSpacing: 2, marginBottom: 12 }}>{props.agent}</div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.5)", fontFamily: "system-ui, sans-serif" }}>{props.agentPhone}</div>
      </div>
      <div style={{ position: "absolute", bottom: 80, textAlign: "center", opacity: interpolate(frame, [25, 40], [0, 0.4], { extrapolateRight: "clamp" }) }}>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.35)", fontFamily: "system-ui, sans-serif" }}>{props.price}</div>
      </div>
    </AbsoluteFill>
  );
};

// --- MAIN (240 frames = 8s) ---
export const SoldVideo: React.FC<SoldProps> = (props) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AudioTrack src={props.musicSrc} volume={props.musicVolume} />
      <Sequence from={0} durationInFrames={90}><PhotoScene {...props} /></Sequence>
      <Sequence from={90} durationInFrames={90}><SoldScene brand={props.brand} /></Sequence>
      <Sequence from={180} durationInFrames={60}><ThankYouScene {...props} /></Sequence>
    </AbsoluteFill>
  );
};
