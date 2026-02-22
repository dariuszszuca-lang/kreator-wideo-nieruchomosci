import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { AudioTrack } from "./AudioTrack";

// --- CONFIG ---
type PlotConfig = {
  plotImage: string;       // zdjecie dzialki
  wireframeImage: string;  // wireframe overlay
  renderImage: string;     // gotowy render domu
  ctaImage: string;        // render z CTA
  area: string;            // metraz np "3 456 m2"
  ctaText: string;         // np "KUP TA DZIALKE I WYBUDUJ DOM MARZEN"
  agentName: string;
  agentPhone: string;
};

// --- SCENE 1: Empty Plot with Ken Burns (0-59, 2s) ---
const PlotScene: React.FC<{ plotImage: string }> = ({ plotImage }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 59], [1, 1.08], { extrapolateRight: "clamp" });
  const brightness = interpolate(frame, [0, 59], [1, 0.85], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(plotImage)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: `brightness(${brightness})`,
        }}
      />
    </AbsoluteFill>
  );
};

// --- SCENE 2: Boundary Drawing + Golden Glow (60-149, 3s) ---
const BoundaryScene: React.FC<{ plotImage: string }> = ({ plotImage }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 89], [1.08, 1.15], { extrapolateRight: "clamp" });

  // Boundary draw progress (0 to 1)
  const drawProgress = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: "clamp" });

  // White to gold transition
  const goldProgress = interpolate(frame, [45, 70], [0, 1], { extrapolateRight: "clamp" });

  // Glow intensity
  const glowPulse = interpolate(frame, [50, 70, 89], [0, 1, 0.7], { extrapolateRight: "clamp" });

  const borderColor = goldProgress < 0.5
    ? `rgba(255, 255, 255, ${0.6 + drawProgress * 0.4})`
    : `rgba(${212 + (255 - 212) * (1 - goldProgress)}, ${175 + (215 - 175) * (1 - goldProgress)}, ${37 + (0 - 37) * (1 - goldProgress)}, 1)`;

  // SVG boundary path points (trapezoid shape on the plot)
  const perimeter = 2 * (600 + 400);
  const dashOffset = perimeter * (1 - drawProgress);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(plotImage)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: "brightness(0.8)",
        }}
      />
      {/* Dark overlay for contrast */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.15)" }} />
      {/* Boundary SVG */}
      <AbsoluteFill>
        <svg width="1080" height="1080" viewBox="0 0 1080 1080">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation={8 * glowPulse} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow2">
              <feGaussianBlur stdDeviation={20 * glowPulse} result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Outer glow layer */}
          {glowPulse > 0 && (
            <polygon
              points="240,200 840,200 840,800 240,800"
              fill="none"
              stroke={`rgba(212,175,55,${glowPulse * 0.3})`}
              strokeWidth="12"
              filter="url(#glow2)"
              strokeDasharray={perimeter}
              strokeDashoffset={dashOffset}
            />
          )}
          {/* Main boundary line */}
          <polygon
            points="240,200 840,200 840,800 240,800"
            fill="none"
            stroke={borderColor}
            strokeWidth="5"
            strokeLinejoin="round"
            filter={glowPulse > 0 ? "url(#glow)" : undefined}
            strokeDasharray={perimeter}
            strokeDashoffset={dashOffset}
          />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 3: Area Number with Burst (150-209, 2s) ---
const AreaScene: React.FC<{ plotImage: string; area: string }> = ({ plotImage, area }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Number scale in with bounce
  const numScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20, config: { damping: 8 } });
  const numOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // Light burst
  const burstScale = interpolate(frame, [5, 25], [0, 3], { extrapolateRight: "clamp" });
  const burstOpacity = interpolate(frame, [5, 15, 30], [0, 0.8, 0], { extrapolateRight: "clamp" });

  // Glow pulse on boundary
  const glowPulse = Math.sin(frame * 0.15) * 0.15 + 0.85;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(plotImage)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.15)",
          filter: "brightness(0.75)",
        }}
      />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.2)" }} />
      {/* Golden boundary (static, glowing) */}
      <AbsoluteFill>
        <svg width="1080" height="1080" viewBox="0 0 1080 1080">
          <defs>
            <filter id="glowArea">
              <feGaussianBlur stdDeviation={10 * glowPulse} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon
            points="240,200 840,200 840,800 240,800"
            fill="none"
            stroke="rgba(212,175,55,0.9)"
            strokeWidth="5"
            strokeLinejoin="round"
            filter="url(#glowArea)"
          />
        </svg>
      </AbsoluteFill>
      {/* Light burst */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,200,0.9), rgba(212,175,55,0.3), transparent)",
            transform: `scale(${burstScale})`,
            opacity: burstOpacity,
          }}
        />
      </AbsoluteFill>
      {/* Area number */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
            transform: `scale(${numScale})`,
            opacity: numOpacity,
            textShadow: "0 0 40px rgba(212,175,55,0.6), 0 4px 20px rgba(0,0,0,0.5)",
            letterSpacing: 4,
          }}
        >
          {area}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 4: Wireframe Building (210-329, 4s) - THE WOW EFFECT ---
const WireframeScene: React.FC<{ plotImage: string; wireframeImage: string }> = ({
  plotImage,
  wireframeImage,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wireframe reveal from bottom to top
  const revealProgress = interpolate(frame, [0, 80], [0, 1], { extrapolateRight: "clamp" });

  // Glow intensity increases as wireframe builds
  const glowIntensity = interpolate(frame, [0, 60, 119], [0.3, 0.8, 1], { extrapolateRight: "clamp" });

  // Subtle zoom
  const scale = interpolate(frame, [0, 119], [1.15, 1.2], { extrapolateRight: "clamp" });

  // Clip the wireframe from bottom
  const clipY = 100 - revealProgress * 100;

  // Scanline effect (building line)
  const scanlineY = interpolate(frame, [0, 80], [100, 0], { extrapolateRight: "clamp" });
  const scanlineOpacity = frame < 80 ? 1 : interpolate(frame, [80, 95], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Background: plot photo darkened */}
      <Img
        src={staticFile(plotImage)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: "brightness(0.5)",
        }}
      />
      {/* Wireframe image revealed from bottom */}
      <AbsoluteFill
        style={{
          clipPath: `inset(${clipY}% 0 0 0)`,
          filter: `brightness(${0.8 + glowIntensity * 0.4}) drop-shadow(0 0 ${15 * glowIntensity}px rgba(212,175,55,0.5))`,
        }}
      >
        <Img
          src={staticFile(wireframeImage)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />
      </AbsoluteFill>
      {/* Scanning build line */}
      {scanlineOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: `${scanlineY}%`,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #D4AF37, #F5E6A3, #D4AF37, transparent)",
            boxShadow: "0 0 30px 10px rgba(212,175,55,0.4)",
            opacity: scanlineOpacity,
          }}
        />
      )}
      {/* Golden boundary */}
      <AbsoluteFill>
        <svg width="1080" height="1080" viewBox="0 0 1080 1080">
          <defs>
            <filter id="glowWire">
              <feGaussianBlur stdDeviation={8} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon
            points="240,200 840,200 840,800 240,800"
            fill="none"
            stroke={`rgba(212,175,55,${glowIntensity * 0.8})`}
            strokeWidth="4"
            strokeLinejoin="round"
            filter="url(#glowWire)"
          />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 5: Materialize - Wireframe to Full Render (330-419, 3s) ---
const MaterializeScene: React.FC<{
  wireframeImage: string;
  renderImage: string;
}> = ({ wireframeImage, renderImage }) => {
  const frame = useCurrentFrame();

  // Crossfade from wireframe to render
  const renderOpacity = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });

  // Flash at the start of materialization
  const flashOpacity = interpolate(frame, [0, 8, 25], [0.6, 0.3, 0], { extrapolateRight: "clamp" });

  // Scale settle
  const scale = interpolate(frame, [0, 89], [1.2, 1.12], { extrapolateRight: "clamp" });

  // Glow decreases as render solidifies
  const glowIntensity = interpolate(frame, [0, 60], [1, 0.3], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Wireframe (fading out) */}
      <Img
        src={staticFile(wireframeImage)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: `brightness(${0.8 + glowIntensity * 0.3}) drop-shadow(0 0 ${10 * glowIntensity}px rgba(212,175,55,0.4))`,
        }}
      />
      {/* Render (fading in) */}
      <AbsoluteFill style={{ opacity: renderOpacity }}>
        <Img
          src={staticFile(renderImage)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />
      </AbsoluteFill>
      {/* Flash overlay */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle, rgba(255,255,200,0.6), transparent 70%)",
          opacity: flashOpacity,
        }}
      />
      {/* Boundary glow fading */}
      <AbsoluteFill>
        <svg width="1080" height="1080" viewBox="0 0 1080 1080">
          <defs>
            <filter id="glowMat">
              <feGaussianBlur stdDeviation={12 * glowIntensity} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon
            points="240,200 840,200 840,800 240,800"
            fill="none"
            stroke={`rgba(212,175,55,${glowIntensity * 0.7})`}
            strokeWidth="4"
            strokeLinejoin="round"
            filter="url(#glowMat)"
          />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 6: Full Render Zoom + CTA (420-509, 3s) ---
const CTAScene: React.FC<{
  ctaImage: string;
  ctaText: string;
  agentName: string;
  agentPhone: string;
}> = ({ ctaImage, ctaText, agentName, agentPhone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 89], [1.12, 1.05], { extrapolateRight: "clamp" });

  // CTA text animation
  const textY = spring({ frame: frame - 15, fps, from: 80, to: 0, durationInFrames: 20 });
  const textOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  // Agent info
  const infoOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });
  const infoY = spring({ frame: frame - 40, fps, from: 30, to: 0, durationInFrames: 15 });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(ctaImage)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      {/* Dark gradient at bottom for text */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
        }}
      />
      {/* CTA Text */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          left: 40,
          right: 40,
          textAlign: "center",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1.2,
            textShadow: "0 2px 15px rgba(0,0,0,0.5)",
          }}
        >
          {ctaText.split(" ").map((word, i) => (
            <span key={i} style={{ color: i === 2 ? "#D4AF37" : "white" }}>
              {word}{" "}
            </span>
          ))}
        </div>
      </div>
      {/* Agent info */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 40,
          right: 40,
          textAlign: "center",
          opacity: infoOpacity,
          transform: `translateY(${infoY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: "#D4AF37",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          {agentName} | {agentPhone}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- MAIN COMPOSITION ---
// Total: 510 frames = 17s at 30fps
// Plot: 0-59 (2s) | Boundary: 60-149 (3s) | Area: 150-209 (2s) |
// Wireframe: 210-329 (4s) | Materialize: 330-419 (3s) | CTA: 420-509 (3s)
export const PlotBuildVideo: React.FC<{ config: PlotConfig; musicSrc?: string; musicVolume?: number }> = ({ config, musicSrc, musicVolume }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AudioTrack src={musicSrc} volume={musicVolume} />
      {/* Scene 1: Empty plot */}
      <Sequence from={0} durationInFrames={60}>
        <PlotScene plotImage={config.plotImage} />
      </Sequence>

      {/* Scene 2: Boundary drawing + gold glow */}
      <Sequence from={60} durationInFrames={90}>
        <BoundaryScene plotImage={config.plotImage} />
      </Sequence>

      {/* Scene 3: Area number burst */}
      <Sequence from={150} durationInFrames={60}>
        <AreaScene plotImage={config.plotImage} area={config.area} />
      </Sequence>

      {/* Scene 4: Wireframe building (THE WOW) */}
      <Sequence from={210} durationInFrames={120}>
        <WireframeScene plotImage={config.plotImage} wireframeImage={config.wireframeImage} />
      </Sequence>

      {/* Scene 5: Materialize */}
      <Sequence from={330} durationInFrames={90}>
        <MaterializeScene wireframeImage={config.wireframeImage} renderImage={config.renderImage} />
      </Sequence>

      {/* Scene 6: CTA */}
      <Sequence from={420} durationInFrames={90}>
        <CTAScene
          ctaImage={config.ctaImage}
          ctaText={config.ctaText}
          agentName={config.agentName}
          agentPhone={config.agentPhone}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
