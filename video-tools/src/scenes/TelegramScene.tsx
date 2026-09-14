import React from "react";
import { interpolate } from "remotion";
import { TelegramBotScreen } from "../components/TelegramBotScreen";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface TelegramSceneProps {
  frame: number;
  startFrame: number;
}

const TELEGRAM_DURATION = 3; // Part of the 0:19.5-0:21 section, but let's make it a quick 2s showcase

export function TelegramScene({ frame, startFrame }: TelegramSceneProps) {
  const localFrame = frame - startFrame;
  const time = localFrame / VIDEO.fps;

  const containerOpacity = interpolate(time, [0, 0.2, 1.8, 2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerTranslateY = interpolate(time, [0, 0.3], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerScale = interpolate(time, [0, 0.3], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Message animations
  const messageProgress = interpolate(time, [0.4, 1.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Show client bot first, then admin bot
  const showClientBot = time < 1;
  const showAdminBot = time >= 0.8;

  // Label
  const labelOpacity = interpolate(time, [0, 0.3, 1.7, 2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
      {/* Background glows */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, #0088cc15 0%, transparent 70%)`,
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
          background: `radial-gradient(circle, #ff980010 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />

      {/* Label */}
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
            border: `1px solid #0088cc30`,
            boxShadow: `0 4px 20px #0088cc20`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#0088cc",
              boxShadow: `0 0 10px #0088cc`,
              animation: "pulse 1.5s infinite",
            }}
          />
          <span style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: "#0088cc", fontFamily: FONTS.inter }}>
            Telegram bot integratsiyasi
          </span>
        </div>
      </div>

      {/* Dual Phone Frames */}
      <div
        style={{
          opacity: containerOpacity,
          transform: `translateY(${containerTranslateY}px) scale(${containerScale})`,
          display: "flex",
          gap: SPACING.lg,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* Client Bot Phone */}
        <div
          style={{
            opacity: showClientBot ? 1 : 0.3,
            transform: showClientBot ? "scale(1)" : "scale(0.9)",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              width: 280,
              height: 600,
              borderRadius: 32,
              background: COLORS.black,
              boxShadow: SHADOWS.xl,
              overflow: "hidden",
              border: `1px solid ${COLORS.darkBorder}`,
            }}
          >
            <div style={{ height: 24, background: COLORS.black }} />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <TelegramBotScreen
                showClientBot={true}
                showAdminBot={false}
                messageProgress={messageProgress}
              />
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: SPACING.sm, fontSize: 12, fontWeight: FONT_WEIGHTS.medium, color: COLORS.lightTextMuted }}>
            @foodsPOS_bot (Mijoz)
          </div>
        </div>

        {/* Admin Bot Phone */}
        <div
          style={{
            opacity: showAdminBot ? 1 : 0,
            transform: showAdminBot ? "scale(1)" : "scale(0.9)",
            transition: "all 0.3s ease 0.3s",
          }}
        >
          <div
            style={{
              width: 280,
              height: 600,
              borderRadius: 32,
              background: COLORS.black,
              boxShadow: SHADOWS.xl,
              overflow: "hidden",
              border: `1px solid ${COLORS.darkBorder}`,
            }}
          >
            <div style={{ height: 24, background: COLORS.black }} />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <TelegramBotScreen
                showClientBot={false}
                showAdminBot={true}
                messageProgress={Math.max(0, messageProgress - 0.3) / 0.7}
              />
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: SPACING.sm, fontSize: 12, fontWeight: FONT_WEIGHTS.medium, color: COLORS.lightTextMuted }}>
            @klentlarchek_bot (Admin)
          </div>
        </div>
      </div>

      {/* Feature badges */}
      <div
        style={{
          position: "absolute",
          bottom: VIDEO.height * 0.08,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: SPACING.md,
          flexWrap: "wrap",
          justifyContent: "center",
          opacity: interpolate(time, [0.8, 1.2, 1.8, 2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          zIndex: 20,
        }}
      >
        {[
          { label: "Buyurtma qabul", color: "#0088cc", icon: "📱" },
          { label: "Admin xabarnomasi", color: "#ff9800", icon: "🔔" },
          { label: "Real vaqtda", color: COLORS.emerald, icon: "⚡" },
          { label: "Har joyda", color: COLORS.indigo, icon: "🌐" },
        ].map((item, i) => (
          <div key={item.label} style={{ animationDelay: `${i * 0.1}s` }}>
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
              <span style={{ fontSize: 13, fontWeight: FONT_WEIGHTS.semibold, color: item.color, fontFamily: FONTS.inter }}>{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}