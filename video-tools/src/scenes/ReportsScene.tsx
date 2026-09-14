import React from "react";
import { interpolate } from "remotion";
import { ReportsScreen } from "../components/ReportsScreen";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface ReportsSceneProps {
  frame: number;
  startFrame: number;
}

const REPORTS_DURATION = 1.5;

export function ReportsScene({ frame, startFrame }: ReportsSceneProps) {
  const localFrame = frame - startFrame;
  const time = localFrame / VIDEO.fps;

  const containerOpacity = interpolate(time, [0, 0.2, 1.3, 1.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerTranslateY = interpolate(time, [0, 0.3], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerScale = interpolate(time, [0, 0.3], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const chartProgress = interpolate(time, [0.3, 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const labelOpacity = interpolate(time, [0, 0.3, 1.2, 1.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.indigo}10 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          right: -100,
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
            border: `1px solid ${COLORS.indigo}30`,
            boxShadow: SHADOWS.glow,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: COLORS.indigo,
              boxShadow: `0 0 10px ${COLORS.indigo}`,
              animation: "pulse 1.5s infinite",
            }}
          />
          <span style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: COLORS.indigo, fontFamily: FONTS.inter }}>
            Hisobotlar bir tugmada
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
            <ReportsScreen animatedProgress={chartProgress} />
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
          { label: "Jami sotuv", value: "124.5 mln", color: COLORS.indigo },
          { label: "Buyurtmalar", value: "342 ta", color: COLORS.emerald },
          { label: "O'rtacha chek", value: "364k", color: COLORS.amber },
        ].map((item, i) => (
          <div key={item.label}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: SPACING.sm,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: BORDER_RADIUS.full,
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${item.color}30`,
                boxShadow: `0 4px 20px ${item.color}20`,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: FONT_WEIGHTS.medium, color: COLORS.lightTextMuted }}>{item.label}</span>
              <span style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.extrabold, color: item.color, fontFamily: FONTS.inter }}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}