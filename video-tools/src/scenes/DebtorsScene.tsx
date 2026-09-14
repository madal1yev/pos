import React from "react";
import { interpolate } from "remotion";
import { DebtorsScreen } from "../components/DebtorsScreen";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface DebtorsSceneProps {
  frame: number;
  startFrame: number;
}

const DEBTORS_DURATION = 1.5;

export function DebtorsScene({ frame, startFrame }: DebtorsSceneProps) {
  const localFrame = frame - startFrame;
  const time = localFrame / VIDEO.fps;

  const containerOpacity = interpolate(time, [0, 0.2, 1.3, 1.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerTranslateY = interpolate(time, [0, 0.3], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerScale = interpolate(time, [0, 0.3], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const scrollProgress = interpolate(time, [0.5, 1.3], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const labelOpacity = interpolate(time, [0, 0.3, 1.2, 1.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const badgeAnimations = [0, 1, 2].map((i) => {
    const delay = i * 0.2;
    return {
      opacity: interpolate(time, [delay, delay + 0.3, 1.3 - delay, 1.5 - delay], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      translateY: interpolate(time, [delay, delay + 0.3], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      scale: interpolate(time, [delay, delay + 0.2, delay + 0.4], [0.9, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    };
  });

  return (
    <div
      style={{
        width: VIDEO.width,
        height: VIDEO.height,
        background: COLORS.lightBg,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.inter,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.red}08 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.emerald}08 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: VIDEO.height * 0.05,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: labelOpacity,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: SPACING.sm,
            padding: `${SPACING.sm}px ${SPACING.lg}px`,
            borderRadius: BORDER_RADIUS.full,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${COLORS.red}30`,
            boxShadow: `0 4px 20px ${COLORS.red}20`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: COLORS.red,
              boxShadow: `0 0 10px ${COLORS.red}`,
              animation: "pulse 1.5s infinite",
            }}
          />
          <span style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: COLORS.red, fontFamily: FONTS.inter }}>
            Qarzdorlar, smenalar, backup
          </span>
        </div>
      </div>

      <div
        style={{
          opacity: containerOpacity,
          transform: `translateY(${containerTranslateY}px) scale(${containerScale})`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 440,
            height: 900,
            borderRadius: 44,
            background: COLORS.black,
            boxShadow: SHADOWS.xl,
            overflow: "hidden",
            border: `1px solid ${COLORS.darkBorder}`,
          }}
        >
          <div style={{ height: 24, background: COLORS.black }} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <DebtorsScreen animatedScroll={scrollProgress} />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: VIDEO.height * 0.08,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: SPACING.md,
          opacity: interpolate(time, [0.5, 0.8, 1.3, 1.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          zIndex: 20,
        }}
      >
        {[
          { label: "Jami qarz", value: "17.2 mln", color: COLORS.red, icon: "💰" },
          { label: "Smenalar", value: "To'g'ri", color: COLORS.emerald, icon: "✅" },
          { label: "Backup", value: "Bugun", color: COLORS.indigo, icon: "💾" },
        ].map((item, i) => (
          <div
            key={item.label}
            style={{
              opacity: badgeAnimations[i].opacity,
              transform: `translateY(${badgeAnimations[i].translateY}px) scale(${badgeAnimations[i].scale})`,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: SPACING.xs,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: BORDER_RADIUS.full,
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${item.color}30`,
                boxShadow: `0 4px 20px ${item.color}20`,
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 12, fontWeight: FONT_WEIGHTS.medium, color: COLORS.lightTextMuted }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: FONT_WEIGHTS.extrabold, color: item.color, fontFamily: FONTS.inter }}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}