import React from "react";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, VIDEO } from "../utils/theme";

interface PhoneMockupProps {
  children: React.ReactNode;
  scale?: number;
  rotation?: number;
  showShadow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const PHONE_WIDTH = 420;
const PHONE_HEIGHT = 880;
const PHONE_BORDER_RADIUS = 40;
const NOTCH_WIDTH = 160;
const NOTCH_HEIGHT = 24;

export function PhoneMockup({
  children,
  scale = 1,
  rotation = 0,
  showShadow = true,
  className = "",
  style = {},
}: PhoneMockupProps) {
  const phoneStyle: React.CSSProperties = {
    position: "relative",
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: PHONE_BORDER_RADIUS,
    background: COLORS.black,
    overflow: "hidden",
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    transformOrigin: "center center",
    boxShadow: showShadow
      ? `${SHADOWS.xl}, 0 0 0 1px ${COLORS.darkBorder}, ${SHADOWS.glowStrong}`
      : "none",
    ...style,
  };

  const screenStyle: React.CSSProperties = {
    position: "absolute",
    top: NOTCH_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
    background: COLORS.lightBg,
    borderRadius: `0 0 ${PHONE_BORDER_RADIUS}px ${PHONE_BORDER_RADIUS}px`,
    overflow: "hidden",
  };

  const notchStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: NOTCH_WIDTH,
    height: NOTCH_HEIGHT,
    background: COLORS.black,
    borderRadius: `0 0 ${BORDER_RADIUS.md}px ${BORDER_RADIUS.md}px`,
    zIndex: 10,
  };

  const dynamicIslandStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    left: "50%",
    transform: "translateX(-50%)",
    width: 120,
    height: 5,
    background: COLORS.darkBorder,
    borderRadius: BORDER_RADIUS.full,
    opacity: 0.5,
  };

  const sideButtonStyle: React.CSSProperties = {
    position: "absolute",
    right: -4,
    top: PHONE_HEIGHT * 0.2,
    width: 4,
    height: 80,
    background: COLORS.darkBorder,
    borderRadius: `0 ${BORDER_RADIUS.sm}px ${BORDER_RADIUS.sm}px 0`,
  };

  const volumeButtonStyle: React.CSSProperties = {
    position: "absolute",
    left: -4,
    top: PHONE_HEIGHT * 0.15,
    width: 4,
    height: 120,
    background: COLORS.darkBorder,
    borderRadius: `${BORDER_RADIUS.sm}px 0 0 ${BORDER_RADIUS.sm}px`,
  };

  return (
    <div className={className} style={phoneStyle} role="img" aria-label="Phone mockup">
      {showShadow && (
        <div
          style={{
            position: "absolute",
            inset: -20,
            background: "radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)",
            borderRadius: PHONE_BORDER_RADIUS + 20,
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={notchStyle}>
        <div style={dynamicIslandStyle} />
      </div>
      <div style={sideButtonStyle} />
      <div style={volumeButtonStyle} />
      <div style={screenStyle}>{children}</div>
    </div>
  );
}

export function PhoneFrame({
  children,
  scale = 1,
  rotation = 0,
  style = {},
}: Omit<PhoneMockupProps, "showShadow" | "className">) {
  return (
    <PhoneMockup
      scale={scale}
      rotation={rotation}
      showShadow={false}
      style={{
        background: "transparent",
        boxShadow: "none",
        border: `2px solid ${COLORS.darkBorder}`,
        ...style,
      }}
    >
      {children}
    </PhoneMockup>
  );
}

export { PHONE_WIDTH, PHONE_HEIGHT, PHONE_BORDER_RADIUS };