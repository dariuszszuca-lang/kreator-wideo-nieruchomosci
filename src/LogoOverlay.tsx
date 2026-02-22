import React from "react";
import { Img, staticFile } from "remotion";

// Logo overlay — prawy górny róg, półprzezroczyste
export const LogoOverlay: React.FC<{ logoSrc?: string }> = ({ logoSrc }) => {
  if (!logoSrc) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 30,
        right: 30,
        zIndex: 100,
        opacity: 0.85,
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
      }}
    >
      <Img
        src={staticFile(logoSrc)}
        style={{
          maxWidth: 120,
          maxHeight: 60,
          objectFit: "contain",
        }}
      />
    </div>
  );
};
