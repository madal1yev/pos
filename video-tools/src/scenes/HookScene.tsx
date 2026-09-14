import React from "react";
import { interpolate } from "remotion";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface HookSceneProps {
  frame: number;
}

export function HookScene({ frame }: HookSceneProps) {
  const progress = frame / VIDEO.fps / 3;

  const titleOpacity = interpolate(progress, [0, 0.15, 0.85, 1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleScale = interpolate(progress, [0, 0.2, 1], [0.8, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleTranslateY = interpolate(progress, [0, 0.2, 1], [40, 0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subOpacity = interpolate(progress, [0.2, 0.4, 0.8, 1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subTranslateY = interpolate(progress, [0.2, 0.4, 1], [30, 0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const flashOpacity = interpolate(progress, [0, 0.05, 0.1, 0.15], [0, 1, 0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const vignetteOpacity = interpolate(progress, [0, 0.3, 1], [0.6, 0.4, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Floating orb animations using Remotion interpolate
  const orb1X = interpolate(progress, [0, 1], [-200, -170], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const orb1Y = interpolate(progress, [0, 1], [-200, -220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const orb2X = interpolate(progress, [0, 1], [-200, -180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const orb2Y = interpolate(progress, [0, 1], [-200, -190], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        width: VIDEO.width,
        height: VIDEO.height,
        background: COLORS.darkBg,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.inter,
      }}
    >
      {/* Background particles/glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${COLORS.indigo}10 0%, transparent 70%)`,
          opacity: vignetteOpacity,
        }}
      />

      {/* Animated gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: orb1Y,
          left: orb1X,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.indigo}15 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: orb2Y,
          right: orb2X,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.amber}10 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />

      {/* Flash effect at start */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.white,
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Main Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px) scale(${titleScale})`,
          textAlign: "center",
          padding: `0 ${SPACING.xl}px`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: FONT_WEIGHTS.extrabold,
            lineHeight: 1.15,
            color: COLORS.white,
            letterSpacing: -1,
            textShadow: `0 0 40px ${COLORS.indigoGlowStrong}, 0 4px 20px rgba(0,0,0,0.4)`,
            fontFamily: FONTS.inter,
          }}
        >
          QANCHA PUL
          <br />
          <span style={{ color: COLORS.indigoLight }}>YO'QOTYAPSIZ?</span>
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subTranslateY}px)`,
          textAlign: "center",
          padding: `0 ${SPACING.xl}px`,
          marginTop: SPACING.lg,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: SPACING.md,
            padding: `${SPACING.md}px ${SPACING.xl}px`,
            borderRadius: BORDER_RADIUS.full,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${COLORS.indigo}30`,
            boxShadow: SHADOWS.glow,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: FONT_WEIGHTS.semibold,
              color: COLORS.indigoLight,
              fontFamily: FONTS.inter,
            }}
          >
            Kassada navbat, daftarda hisob-kitob…
          </span>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: COLORS.emerald,
              boxShadow: `0 0 10px ${COLORS.emerald}`,
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
      </div>

      {/* Decorative X mark animation */}
      <div
        style={{
          position: "absolute",
          bottom: VIDEO.height * 0.15,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: interpolate(progress, [0.4, 0.6, 0.9, 1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          zIndex: 5,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="55" fill="none" stroke={COLORS.red} strokeWidth="4" strokeDasharray="345" strokeDashoffset={interpolate(progress, [0.4, 0.7], [345, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          <line x1="30" y1="30" x2="90" y2="90" stroke={COLORS.red} strokeWidth="6" strokeLinecap="round" opacity={interpolate(progress, [0.55, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          <line x1="90" y1="30" x2="30" y2="90" stroke={COLORS.red} strokeWidth="6" strokeLinecap="round" opacity={interpolate(progress, [0.55, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </svg>
      </div>
    </div>
  );
}