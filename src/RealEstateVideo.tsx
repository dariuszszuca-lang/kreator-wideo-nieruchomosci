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
import {
  getStyle,
  getTempoFrames,
  type BrandConfig,
  type EffectsConfig,
  DEFAULT_BRAND,
  DEFAULT_EFFECTS,
} from "./styles";
import { LogoOverlay } from "./LogoOverlay";

type Listing = {
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
  photos: { src: string; label: string }[];
};

type Props = {
  listing: Listing;
  brand?: Partial<BrandConfig>;
  effects?: Partial<EffectsConfig>;
};

// --- INTRO SCENE ---
const IntroScene: React.FC<Props & { dur: number }> = ({
  listing,
  brand,
  effects,
  dur,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = { ...DEFAULT_BRAND, ...brand };
  const e = { ...DEFAULT_EFFECTS, ...effects };
  const s = getStyle(b.stylePreset);

  const titleY = spring({ frame, fps, from: 80, to: 0, durationInFrames: 25 });
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineWidth = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 400,
    durationInFrames: 20,
  });
  const locOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const locY = spring({
    frame: frame - 25,
    fps,
    from: 30,
    to: 0,
    durationInFrames: 20,
  });
  const priceScale = spring({
    frame: frame - 45,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
    config: { damping: 8 },
  });
  const bgScale = interpolate(frame, [0, dur - 1], [1, 1.15], {
    extrapolateRight: "clamp",
  });

  // Text position
  const justify =
    e.textPosition === "top"
      ? "flex-start"
      : e.textPosition === "bottom"
        ? "flex-end"
        : "center";
  const padTop = e.textPosition === "top" ? "180px" : "60px";
  const padBottom = e.textPosition === "bottom" ? "180px" : "60px";

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(listing.photos[0].src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bgScale})`,
            filter: "brightness(0.35)",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      <LogoOverlay logoSrc={b.logoSrc} />
      <AbsoluteFill
        style={{
          justifyContent: justify,
          alignItems: "center",
          paddingTop: padTop,
          paddingBottom: padBottom,
          paddingLeft: "60px",
          paddingRight: "60px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
            lineHeight: 1.1,
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: 6,
          }}
        >
          {b.headline}
        </div>
        <div
          style={{
            width: lineWidth,
            height: 4,
            background: `linear-gradient(90deg, ${s.accentColor}, ${s.accentColorLight}, ${s.accentColor})`,
            marginTop: 30,
            marginBottom: 30,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            opacity: locOpacity,
            transform: `translateY(${locY}px)`,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 300,
            letterSpacing: 2,
          }}
        >
          {listing.location}
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: s.accentColor,
            marginTop: 50,
            transform: `scale(${priceScale})`,
            fontFamily: "system-ui, -apple-system, sans-serif",
            textShadow: `0 2px 15px ${s.ringColor}0.3)`,
          }}
        >
          {listing.price}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- PHOTO SCENE with configurable transitions ---
const PhotoScene: React.FC<{
  photo: { src: string; label: string };
  direction: "left" | "right" | "up";
  brand?: Partial<BrandConfig>;
  effects?: Partial<EffectsConfig>;
  dur: number;
}> = ({ photo, direction, brand, effects, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = { ...DEFAULT_BRAND, ...brand };
  const e = { ...DEFAULT_EFFECTS, ...effects };
  const s = getStyle(b.stylePreset);
  const last = dur - 1;

  // Ken Burns (always active)
  const kenBurns = interpolate(frame, [0, last], [1, 1.18], {
    extrapolateRight: "clamp",
  });
  const panX =
    direction === "left"
      ? interpolate(frame, [0, last], [0, -35], { extrapolateRight: "clamp" })
      : direction === "right"
        ? interpolate(frame, [0, last], [0, 35], { extrapolateRight: "clamp" })
        : 0;
  const panY =
    direction === "up"
      ? interpolate(frame, [0, last], [0, -25], { extrapolateRight: "clamp" })
      : 0;

  // Transition type
  let wrapTransform = "";
  let wrapOpacity = 1;

  if (e.transition === "slide") {
    const slideIn = spring({
      frame,
      fps,
      from: 1080,
      to: 0,
      durationInFrames: 12,
    });
    wrapTransform = `translateX(${slideIn}px)`;
    wrapOpacity = interpolate(frame, [0, 8], [0, 1], {
      extrapolateRight: "clamp",
    });
  } else if (e.transition === "fade") {
    wrapOpacity = interpolate(frame, [0, 18], [0, 1], {
      extrapolateRight: "clamp",
    });
  } else if (e.transition === "zoom") {
    const zoomIn = spring({
      frame,
      fps,
      from: 1.6,
      to: 1,
      durationInFrames: 18,
      config: { damping: 14 },
    });
    wrapTransform = `scale(${zoomIn})`;
    wrapOpacity = interpolate(frame, [0, 10], [0, 1], {
      extrapolateRight: "clamp",
    });
  }

  // Overlay style
  let overlayStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "35%",
    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
  };

  if (e.overlay === "light") {
    overlayStyle.background = "linear-gradient(transparent, rgba(0,0,0,0.35))";
  } else if (e.overlay === "none") {
    overlayStyle.background = "transparent";
  } else if (e.overlay === "cinematic") {
    overlayStyle = {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(rgba(0,0,0,0.35), transparent 25%, transparent 75%, rgba(0,0,0,0.7))",
    };
  } else if (e.overlay === "gradient") {
    overlayStyle = {
      position: "absolute",
      inset: 0,
      background: `linear-gradient(135deg, ${s.bgGradient1}cc, transparent 50%, ${s.bgGradient3}cc)`,
    };
  }

  // Label position
  const labelPos: React.CSSProperties =
    e.textPosition === "top"
      ? { position: "absolute", top: 140, left: 60 }
      : { position: "absolute", bottom: 140, left: 60 };

  const labelY = spring({
    frame: frame - 15,
    fps,
    from: 50,
    to: 0,
    durationInFrames: 15,
  });
  const labelOpacity = interpolate(frame, [15, 28], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: wrapOpacity }}>
      <AbsoluteFill
        style={{ overflow: "hidden", transform: wrapTransform }}
      >
        <Img
          src={staticFile(photo.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${kenBurns}) translate(${panX}px, ${panY}px)`,
          }}
        />
      </AbsoluteFill>
      <div style={overlayStyle} />
      <LogoOverlay logoSrc={b.logoSrc} />
      <div
        style={{
          ...labelPos,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${s.accentColor}, ${s.accentColorLight})`,
            width: 60,
            height: 4,
            borderRadius: 2,
            marginBottom: 16,
          }}
        />
        <div
          style={{
            fontSize: 50,
            fontWeight: 700,
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {photo.label}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- DETAILS SCENE ---
const DetailsScene: React.FC<Props & { dur: number }> = ({
  listing,
  brand,
  effects,
  dur,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = { ...DEFAULT_BRAND, ...brand };
  const s = getStyle(b.stylePreset);

  const details = [
    { icon: "\u{1F4D0}", label: "Powierzchnia", value: listing.area },
    { icon: "\u{1F3E0}", label: "Pokoje", value: listing.rooms },
    { icon: "\u{1F3E2}", label: "Pietro", value: listing.floor },
    { icon: "\u{1F4C5}", label: "Rok budowy", value: listing.year },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${s.bgGradient1} 0%, ${s.bgGradient2} 50%, ${s.bgGradient3} 100%)`,
        padding: 60,
        justifyContent: "center",
      }}
    >
      <LogoOverlay logoSrc={b.logoSrc} />
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: s.accentColor,
          marginBottom: 20,
          opacity: interpolate(frame, [0, 12], [0, 1], {
            extrapolateRight: "clamp",
          }),
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: 4,
        }}
      >
        SZCZEGOLY
      </div>
      <div
        style={{
          width: 80,
          height: 4,
          background: `linear-gradient(90deg, ${s.accentColor}, ${s.accentColorLight})`,
          marginBottom: 50,
          borderRadius: 2,
          opacity: interpolate(frame, [5, 18], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
      {details.map((d, i) => {
        const delay = 12 + i * 10;
        const slideX = spring({
          frame: frame - delay,
          fps,
          from: -200,
          to: 0,
          durationInFrames: 15,
        });
        const itemOpacity = interpolate(frame, [delay, delay + 8], [0, 1], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 36,
              opacity: itemOpacity,
              transform: `translateX(${slideX}px)`,
            }}
          >
            <div style={{ fontSize: 56, marginRight: 28, width: 75 }}>
              {d.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 26,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 400,
                  letterSpacing: 2,
                  textTransform: "uppercase" as const,
                }}
              >
                {d.label}
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: "white",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {d.value}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 30 }}>
        {listing.features.map((f, i) => {
          const delay2 = 52 + i * 6;
          const fOpacity = interpolate(frame, [delay2, delay2 + 8], [0, 1], {
            extrapolateRight: "clamp",
          });
          const fScale = spring({
            frame: frame - delay2,
            fps,
            from: 0.5,
            to: 1,
            durationInFrames: 10,
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                background: s.tagBg,
                border: `1px solid ${s.tagBorder}`,
                color: s.accentColor,
                padding: "12px 24px",
                borderRadius: 50,
                fontSize: 28,
                fontWeight: 600,
                marginRight: 14,
                marginBottom: 14,
                opacity: fOpacity,
                transform: `scale(${fScale})`,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {f}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// --- OUTRO / CTA ---
const OutroScene: React.FC<Props & { dur: number }> = ({
  listing,
  brand,
  effects,
  dur,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = { ...DEFAULT_BRAND, ...brand };
  const s = getStyle(b.stylePreset);

  const titleScale = spring({
    frame,
    fps,
    from: 0.3,
    to: 1,
    durationInFrames: 18,
    config: { damping: 8 },
  });
  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const contactY = spring({
    frame: frame - 20,
    fps,
    from: 50,
    to: 0,
    durationInFrames: 15,
  });
  const contactOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const pulse = Math.sin(frame * 0.1) * 0.03 + 1;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${s.bgGradient1} 0%, #0a0a1a 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: `2px solid ${s.ringColor}0.12)`,
          transform: `scale(${pulse})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 650,
          height: 650,
          borderRadius: "50%",
          border: `1px solid ${s.ringColor}0.06)`,
          transform: `scale(${pulse * 0.97})`,
        }}
      />
      <LogoOverlay logoSrc={b.logoSrc} />
      <div
        style={{
          textAlign: "center",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        <div
          style={{
            fontSize: 44,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 300,
            letterSpacing: 6,
            marginBottom: 20,
          }}
        >
          {b.ctaSubtext}
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {b.ctaText}
        </div>
      </div>
      <div
        style={{
          marginTop: 50,
          textAlign: "center",
          opacity: contactOpacity,
          transform: `translateY(${contactY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: s.accentColor,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: 3,
            marginBottom: 25,
          }}
        >
          {listing.agentPhone}
        </div>
        <div
          style={{
            fontSize: 34,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 400,
          }}
        >
          {listing.agent}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          opacity: interpolate(frame, [35, 50], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          {listing.price}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- MAIN COMPOSITION (dynamic duration based on tempo) ---
export const RealEstateVideo: React.FC<Props> = ({
  listing,
  brand,
  effects,
}) => {
  const e = { ...DEFAULT_EFFECTS, ...effects };
  const t = getTempoFrames(e.tempo);

  // Randomize photo directions based on listing title hash
  const hash = listing.title
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const allDirs: ("left" | "right" | "up")[] = ["left", "right", "up"];
  const directions = listing.photos.map(
    (_, i) => allDirs[(hash + i * 7) % 3]
  );

  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={cursor} durationInFrames={t.intro}>
        <IntroScene
          listing={listing}
          brand={brand}
          effects={effects}
          dur={t.intro}
        />
      </Sequence>
      {listing.photos.map((photo, i) => {
        const from = t.intro + i * t.photo;
        return (
          <Sequence key={i} from={from} durationInFrames={t.photo}>
            <PhotoScene
              photo={photo}
              direction={directions[i]}
              brand={brand}
              effects={effects}
              dur={t.photo}
            />
          </Sequence>
        );
      })}
      <Sequence
        from={t.intro + listing.photos.length * t.photo}
        durationInFrames={t.details}
      >
        <DetailsScene
          listing={listing}
          brand={brand}
          effects={effects}
          dur={t.details}
        />
      </Sequence>
      <Sequence
        from={t.intro + listing.photos.length * t.photo + t.details}
        durationInFrames={t.outro}
      >
        <OutroScene
          listing={listing}
          brand={brand}
          effects={effects}
          dur={t.outro}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
