import React from "react";
import { Audio, staticFile, useVideoConfig, interpolate } from "remotion";

/**
 * Cicha muzyka w tle z płynnym fade in/out.
 * Użycie: <AudioTrack src={musicSrc} volume={0.15} />
 */
export const AudioTrack: React.FC<{ src?: string; volume?: number }> = ({
  src,
  volume = 0.15,
}) => {
  const { durationInFrames } = useVideoConfig();

  if (!src) return null;

  // Fade = max 1s (30 frames), ale nie więcej niż 25% długości wideo
  const fade = Math.min(30, Math.floor(durationInFrames / 4));

  return (
    <Audio
      src={staticFile(src)}
      volume={(f) =>
        interpolate(
          f,
          [0, fade, durationInFrames - fade, durationInFrames],
          [0, volume, volume, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )
      }
    />
  );
};
