import React from "react";
import { interpolate } from "remotion";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface CTASceneProps {
  frame: number;
  startFrame: number;
}

const CTA_DURATION = 5; // 0:21-0:26

export function CTAScene({ frame, startFrame }: CTASceneProps) {
  const localFrame = frame - startFrame;
  const time = localFrame / VIDEO.fps;

  // Background transition from light to gradient
  const bgProgress = interpolate(time, [0, 1, 3, 5], [0, 0.3, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Logo animation
  const logoScale = interpolate(time, [0, 0.5, 0.8], [0, 1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoOpacity = interpolate(time, [0, 0.3, 5], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoRotate = interpolate(time, [0, 0.5], [-10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sparkleOpacity = interpolate(time, [0.5, 0.8, 1.2], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Title animation
  const titleOpacity = interpolate(time, [0.6, 0.9, 5], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleTranslateY = interpolate(time, [0.6, 0.9], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Subtitle animation
  const subtitleOpacity = interpolate(time, [0.9, 1.2, 5], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleTranslateY = interpolate(time, [0.9, 1.2], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Button animation
  const buttonOpacity = interpolate(time, [1.2, 1.5, 5], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const buttonTranslateY = interpolate(time, [1.2, 1.5], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const buttonPulse = interpolate(time, [1.5, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Languages animation
  const langOpacity = interpolate(time, [1.8, 2.1, 5], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const langTranslateY = interpolate(time, [1.8, 2.1], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Features badges
  const featureAnimations = ["Tezkor", "Aniq", "Real vaqtda", "Har joyda"].map((_, i) => {
    const delay = 2.2 + i * 0.15;
    return {
      opacity: interpolate(time, [delay, delay + 0.3, 5], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      translateY: interpolate(time, [delay, delay + 0.3], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      scale: interpolate(time, [delay, delay + 0.2, delay + 0.4], [0.8, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    };
  });

  // Final fade
  const finalOpacity = interpolate(time, [4.5, 5], [1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        width: VIDEO.width,
        height: VIDEO.height,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.inter,
        background: `linear-gradient(135deg, 
          ${interpolate(bgProgress, [0, 1], [COLORS.lightBg, COLORS.indigo])}, 
          ${interpolate(bgProgress, [0, 1], [COLORS.lightBg, COLORS.indigoDark])}
        )`,
      }}
    >
      {/* Animated background particles */}
      <BackgroundParticles count={20} progress={time} />

      {/* Glowing orbs */}
      <div
        style={{
          position: "absolute",
          top: -300,
          left: -300,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.white}15 0%, transparent 70%)`,
          filter: "blur(150px)",
          opacity: bgProgress,
          animation: "float 10s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300,
          right: -300,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.indigoLight}20 0%, transparent 70%)`,
          filter: "blur(150px)",
          opacity: bgProgress,
          animation: "float 12s ease-in-out infinite reverse",
        }}
      />

      {/* Main Content */}
      <div
        style={{
          opacity: finalOpacity,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: SPACING.lg,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: BORDER_RADIUS.xl,
              background: `linear-gradient(135deg, ${COLORS.white}, ${COLORS.white}ee)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 60px ${COLORS.white}60, 0 20px 40px rgba(0,0,0,0.2)`,
              position: "relative",
            }}
          >
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={COLORS.indigo} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          {/* Sparkle effects */}
          <div
            style={{
              position: "absolute",
              inset: -20,
              opacity: sparkleOpacity,
              pointerEvents: "none",
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: COLORS.white,
                  boxShadow: `0 0 10px ${COLORS.white}`,
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-80px)`,
                  animation: `sparkleSpin 2s linear infinite ${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleTranslateY}px)`,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 52,
              fontWeight: FONT_WEIGHTS.extrabold,
              lineHeight: 1.1,
              color: COLORS.white,
              letterSpacing: -1,
              textShadow: `0 0 40px ${COLORS.white}40, 0 4px 20px rgba(0,0,0,0.3)`,
              fontFamily: FONTS.inter,
            }}
          >
            MaxPOS
          </h1>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleTranslateY}px)`,
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: FONT_WEIGHTS.normal,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.9)",
              fontFamily: FONTS.inter,
            }}
          >
            Do'koningiz uchun to'liq yechim — kassa, ombor, qarzdorlar va hisobotlar bitta tizimda
          </p>
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: buttonOpacity,
            transform: `translateY(${buttonTranslateY}px)`,
          }}
        >
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: SPACING.md,
              padding: `${SPACING.md}px ${SPACING.xxl}px`,
              borderRadius: BORDER_RADIUS.full,
              background: COLORS.white,
              border: "none",
              color: COLORS.indigo,
              fontSize: 22,
              fontWeight: FONT_WEIGHTS.extrabold,
              fontFamily: FONTS.inter,
              cursor: "pointer",
              boxShadow: `0 0 40px ${COLORS.white}50, 0 10px 30px rgba(0,0,0,0.2)`,
              animation: `buttonPulse 2s ease-in-out infinite`,
            }}
          >
            <span>Bugun boshlang</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Languages */}
        <div
          style={{
            opacity: langOpacity,
            transform: `translateY(${langTranslateY}px)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: BORDER_RADIUS.full,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(20px)",
              border: `1px solid rgba(255,255,255,0.2)`,
            }}
          >
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: FONT_WEIGHTS.medium }}>
              🇺🇿 O'zbek
            </span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>·</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: FONT_WEIGHTS.medium }}>
              🇷🇺 Русский
            </span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>·</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: FONT_WEIGHTS.medium }}>
              🇬🇧 English
            </span>
          </div>
        </div>

        {/* Feature badges */}
        <div style={{ display: "flex", gap: SPACING.md, flexWrap: "wrap", justifyContent: "center", marginTop: SPACING.md }}>
          {["Tezkor", "Aniq", "Real vaqtda", "Har joyda"].map((feature, i) => (
            <div
              key={feature}
              style={{
                opacity: featureAnimations[i].opacity,
                transform: `translateY(${featureAnimations[i].translateY}px) scale(${featureAnimations[i].scale})`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: SPACING.xs,
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  borderRadius: BORDER_RADIUS.full,
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(20px)",
                  border: `1px solid rgba(255,255,255,0.2)`,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: COLORS.emerald,
                    boxShadow: `0 0 8px ${COLORS.emerald}`,
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.white, fontFamily: FONTS.inter }}>
                  {feature}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, -30px); }
        }
        @keyframes sparkleSpin {
          from { transform: translate(-50%, -50%) rotate(0deg) translateY(-80px) rotate(0deg); opacity: 1; }
          to { transform: translate(-50%, -50%) rotate(360deg) translateY(-80px) rotate(-360deg); opacity: 0; }
        }
        @keyframes buttonPulse {
          0%, 100% { box-shadow: 0 0 40px ${COLORS.white}50, 0 10px 30px rgba(0,0,0,0.2); transform: scale(1); }
          50% { box-shadow: 0 0 60px ${COLORS.white}80, 0 15px 40px rgba(0,0,0,0.3); transform: scale(1.02); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function BackgroundParticles({ count, progress }: { count: number; progress: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const delay = (i / count) * 5;
        const size = 4 + (i % 4) * 3;
        const x = (i * 137) % 100;
        const y = (i * 73) % 100;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `rgba(255,255,255,${0.3 + (i % 3) * 0.2})`,
              animation: `particleFloat 8s ease-in-out infinite ${delay}s`,
              opacity: progress > 1 ? 1 : progress,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(20px, -30px) scale(1.2); opacity: 0.8; }
          50% { transform: translate(-10px, -60px) scale(0.8); opacity: 0.5; }
          75% { transform: translate(-20px, -30px) scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}