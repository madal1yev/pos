import React from "react";
import { interpolate } from "remotion";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface ProblemSceneProps {
  frame: number;
  startFrame: number;
}

const PROBLEM_DURATION = 5;

export function ProblemScene({ frame, startFrame }: ProblemSceneProps) {
  const localFrame = frame - startFrame;
  const progress = localFrame / VIDEO.fps / PROBLEM_DURATION;

  const titleOpacity = interpolate(localFrame / VIDEO.fps, [0, 0.5, 4.5, 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleTranslateY = interpolate(localFrame / VIDEO.fps, [0, 0.5], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const chips = ["Navbat", "Xato hisob", "Yo'qolgan cheklar"];
  const chipAnimations = chips.map((_, i) => {
    const delay = i * 0.4;
    const chipProgress = localFrame / VIDEO.fps - delay;
    return {
      opacity: interpolate(chipProgress, [0, 0.3, 4.5 - delay, 5 - delay], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      translateY: interpolate(chipProgress, [0, 0.3], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      scale: interpolate(chipProgress, [0, 0.2, 0.4], [0.8, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    };
  });

  const bgOpacity = interpolate(progress, [0, 0.2, 1], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const paperOpacity = interpolate(progress, [0, 0.3, 0.8, 1], [1, 1, 0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const paperScale = interpolate(progress, [0, 0.3, 1], [1, 1.05, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const paperRotate = interpolate(progress, [0, 1], [-2, 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${COLORS.darkCard} 0%, ${COLORS.darkBg} 70%)`,
          opacity: bgOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${paperRotate}deg) scale(${paperScale})`,
          opacity: paperOpacity,
          pointerEvents: "none",
        }}
      >
        <NotebookPaper />
      </div>

      <WarningLines progress={progress} />

      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`,
          textAlign: "center",
          padding: `0 ${SPACING.xl}px`,
          marginBottom: SPACING.xl,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: FONT_WEIGHTS.extrabold,
            lineHeight: 1.2,
            color: COLORS.amber,
            letterSpacing: -0.5,
            textShadow: `0 0 30px ${COLORS.amber}60, 0 4px 20px rgba(0,0,0,0.5)`,
            fontFamily: FONTS.inter,
          }}
        >
          Daftar hisobi o'tmishda
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.md, zIndex: 10 }}>
        {chips.map((chip, i) => (
          <div
            key={chip}
            style={{
              opacity: chipAnimations[i].opacity,
              transform: `translateY(${chipAnimations[i].translateY}px) scale(${chipAnimations[i].scale})`,
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
                border: `1px solid ${COLORS.amber}40`,
                boxShadow: `0 0 30px ${COLORS.amber}20`,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: COLORS.amber,
                  boxShadow: `0 0 15px ${COLORS.amber}`,
                  animation: `pulse 1.5s infinite ${i * 0.2}s`,
                }}
              />
              <span
                style={{
                  fontSize: 20,
                  fontWeight: FONT_WEIGHTS.bold,
                  color: COLORS.white,
                  fontFamily: FONTS.inter,
                  letterSpacing: 0.5,
                }}
              >
                {chip}
              </span>
              <div
                style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={COLORS.emerald}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    opacity: interpolate(chipAnimations[i].opacity, [0, 0.8, 1], [0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                    transform: `scale(${interpolate(chipAnimations[i].opacity, [0.8, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
                  }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: VIDEO.height * 0.08,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: interpolate(progress, [0.7, 0.9, 1], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACING.sm,
            padding: `${SPACING.sm}px ${SPACING.lg}px`,
            borderRadius: BORDER_RADIUS.full,
            background: "rgba(99, 102, 241, 0.2)",
            border: `1px solid ${COLORS.indigo}40`,
            color: COLORS.indigoLight,
            fontSize: 14,
            fontWeight: FONT_WEIGHTS.medium,
            fontFamily: FONTS.inter,
          }}
        >
          <span>Yechim kelmoqda</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function NotebookPaper() {
  return (
    <svg width="400" height="500" viewBox="0 0 400 500" style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }}>
      <defs>
        <filter id="paperShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="15" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>
      <rect x="0" y="0" width="400" height="500" rx="8" fill="#fffdf5" filter="url(#paperShadow)" />
      <line x1="40" y1="60" x2="360" y2="60" stroke="#e8d5b7" strokeWidth="2" />
      <line x1="40" y1="100" x2="360" y2="100" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="140" x2="360" y2="140" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="180" x2="360" y2="180" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="220" x2="360" y2="220" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="260" x2="360" y2="260" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="300" x2="360" y2="300" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="340" x2="360" y2="340" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="380" x2="360" y2="380" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="420" x2="360" y2="420" stroke="#e8d5b7" strokeWidth="1" />
      <line x1="40" y1="460" x2="360" y2="460" stroke="#e8d5b7" strokeWidth="2" />
      <line x1="80" y1="75" x2="200" y2="75" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="80" y1="115" x2="250" y2="115" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="80" y1="155" x2="180" y2="155" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <circle cx="320" cy="75" r="8" fill="#dc2626" opacity="0.5" />
      <circle cx="320" cy="115" r="8" fill="#dc2626" opacity="0.5" />
      <circle cx="320" cy="155" r="8" fill="#dc2626" opacity="0.5" />
    </svg>
  );
}

function WarningLines({ progress }: { progress: number }) {
  const lines = 8;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${(i / lines) * 100}%`,
            width: 2,
            height: "100%",
            background: `linear-gradient(to bottom, transparent, ${COLORS.amber}30, transparent)`,
            opacity: 0.3,
            animation: `scanLine 3s linear infinite ${i * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}