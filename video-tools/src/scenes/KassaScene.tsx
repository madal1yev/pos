import React from "react";
import { interpolate } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { POSScreen } from "../components/POSScreen";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface KassaSceneProps {
  frame: number;
  startFrame: number;
}

const KASSA_DURATION = 7;

export function KassaScene({ frame, startFrame }: KassaSceneProps) {
  const localFrame = frame - startFrame;
  const progress = localFrame / VIDEO.fps / KASSA_DURATION;
  const time = localFrame / VIDEO.fps;

  const phoneScale = interpolate(time, [0, 0.5, 1], [0.5, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phoneOpacity = interpolate(time, [0, 0.3, 1], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phoneRotate = interpolate(time, [0, 0.5], [-5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const bgProgress = interpolate(time, [0, 1, 2], [0, 0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const labels = [
    { text: "1 skaner — 1 soniya", start: 0, end: 2 },
    { text: "Qaytim avtomatik", start: 4, end: 6 },
    { text: "Chek bir zumda", start: 6, end: 7 },
  ];

  const showScanner = time >= 0.5 && time < 3;
  const scannerProgress = showScanner ? interpolate(time, [0.5, 2.5], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const showPayment = time >= 4.5;
  const showReceipt = time >= 6.5;

  const animatedTotal = showReceipt ? interpolate(time, [6.5, 7], [0, 45000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  return (
    <div
      style={{
        width: VIDEO.width,
        height: VIDEO.height,
        position: "relative",
        overflow: "hidden",
        fontFamily: FONTS.inter,
        background: `linear-gradient(180deg, ${COLORS.darkBg} ${bgProgress * 100}%, ${COLORS.lightBg} ${bgProgress * 100}%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.indigo}10 0%, transparent 70%)`,
          filter: "blur(80px)",
          opacity: 1 - bgProgress,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.emerald}10 0%, transparent 70%)`,
          filter: "blur(80px)",
          opacity: bgProgress,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${phoneScale}) rotate(${phoneRotate}deg)`,
          opacity: phoneOpacity,
          zIndex: 10,
        }}
      >
        <PhoneMockup scale={1} showShadow={true}>
          <POSScreen
            showScanner={showScanner}
            scannerProgress={scannerProgress}
            showPayment={showPayment}
            showReceipt={showReceipt}
            animatedTotal={animatedTotal}
          />
        </PhoneMockup>
      </div>

      <div style={{ position: "absolute", bottom: VIDEO.height * 0.12, left: "50%", transform: "translateX(-50%)", zIndex: 20, pointerEvents: "none" }}>
        {labels.map((label, i) => (
          <div
            key={label.text}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              opacity: interpolate(time, [label.start, label.start + 0.3, label.end - 0.3, label.end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translateY: interpolate(time, [label.start, label.start + 0.3], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              top: i * 50,
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
                boxShadow: `0 4px 20px ${COLORS.indigo}20`,
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: COLORS.emerald,
                  boxShadow: `0 0 10px ${COLORS.emerald}`,
                  animation: "pulse 1s infinite",
                }}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: FONT_WEIGHTS.bold,
                  color: COLORS.indigo,
                  fontFamily: FONTS.inter,
                }}
              >
                {label.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: VIDEO.height * 0.08,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: interpolate(time, [0, 0.5, 6.5, 7], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          zIndex: 15,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: SPACING.md,
            padding: `${SPACING.md}px ${SPACING.xl}px`,
            borderRadius: BORDER_RADIUS.full,
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${COLORS.indigo}40`,
            color: COLORS.indigoLight,
            fontSize: 16,
            fontWeight: FONT_WEIGHTS.semibold,
            fontFamily: FONTS.inter,
          }}
        >
          <span>Yechim: </span>
          <span style={{ color: COLORS.white }}>MaxPOS Kassa</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.indigo} strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
    </div>
  );
}