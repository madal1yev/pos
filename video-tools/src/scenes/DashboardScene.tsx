import React from "react";
import { interpolate } from "remotion";
import { DashboardScreen } from "../components/DashboardScreen";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface DashboardSceneProps {
  frame: number;
  startFrame: number;
}

const DASHBOARD_DURATION = 1.5;

export function DashboardScene({ frame, startFrame }: DashboardSceneProps) {
  const localFrame = frame - startFrame;
  const time = localFrame / VIDEO.fps;

  const containerOpacity = interpolate(time, [0, 0.2, 1.3, 1.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerTranslateY = interpolate(time, [0, 0.3], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerScale = interpolate(time, [0, 0.3], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cardAnimations = [0, 1, 2, 3].map((i) => {
    const delay = i * 0.1;
    return {
      opacity: interpolate(time, [delay, delay + 0.3, 1.3 - delay, 1.5 - delay], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      translateY: interpolate(time, [delay, delay + 0.3], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      scale: interpolate(time, [delay, delay + 0.2, delay + 0.4], [0.9, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    };
  });

  const todayRevenue = interpolate(time, [0.2, 1], [0, 12450000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const monthlyRevenue = interpolate(time, [0.3, 1.1], [0, 342150000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const totalProducts = interpolate(time, [0.4, 1.2], [0, 1247], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const inventoryValue = interpolate(time, [0.5, 1.3], [0, 89500000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
            Daromad real vaqtda
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
            <DashboardScreen
              animatedValues={{
                todayRevenue: Math.round(todayRevenue),
                monthlyRevenue: Math.round(monthlyRevenue),
                totalProducts: Math.round(totalProducts),
                inventoryValue: Math.round(inventoryValue),
              }}
            />
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
          { label: "Bugun", value: "+12.5%", color: COLORS.emerald },
          { label: "Bu hafta", value: "+8.2%", color: COLORS.emerald },
          { label: "Bu oy", value: "+15.3%", color: COLORS.emerald },
        ].map((item, i) => (
          <div
            key={item.label}
            style={{
              opacity: cardAnimations[i]?.opacity ?? 1,
              transform: `translateY(${cardAnimations[i]?.translateY ?? 0}px) scale(${cardAnimations[i]?.scale ?? 1})`,
            }}
          >
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
              <span style={{ fontSize: 13, fontWeight: FONT_WEIGHTS.medium, color: COLORS.lightTextMuted }}>{item.label}</span>
              <span style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.extrabold, color: item.color, fontFamily: FONTS.inter }}>{item.value}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}