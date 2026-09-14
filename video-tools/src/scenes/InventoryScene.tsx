import React from "react";
import { interpolate } from "remotion";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS, VIDEO } from "../utils/theme";

interface InventorySceneProps {
  frame: number;
  startFrame: number;
}

const INVENTORY_DURATION = 1.5;

export function InventoryScene({ frame, startFrame }: InventorySceneProps) {
  const localFrame = frame - startFrame;
  const time = localFrame / VIDEO.fps;

  const containerOpacity = interpolate(time, [0, 0.2, 1.3, 1.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerTranslateY = interpolate(time, [0, 0.3], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const containerScale = interpolate(time, [0, 0.3], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cardAnimations = [0, 1, 2].map((i) => {
    const delay = i * 0.15;
    return {
      opacity: interpolate(time, [delay, delay + 0.3, 1.3 - delay, 1.5 - delay], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      translateY: interpolate(time, [delay, delay + 0.3], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      scale: interpolate(time, [delay, delay + 0.2, delay + 0.4], [0.9, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    };
  });

  const labelOpacity = interpolate(time, [0, 0.3, 1.2, 1.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lowStockItems = [
    { name: "Non (Obi)", current: 3, min: 10, unit: "dona", color: COLORS.amber },
    { name: "Sut 1L", current: 2, min: 15, unit: "dona", color: COLORS.amber },
    { name: "Yogurt 150g", current: 1, min: 20, unit: "dona", color: COLORS.amber },
  ];

  const outOfStockItems = [
    { name: "Pishloq 200g", current: 0, min: 10, unit: "dona", color: COLORS.red },
    { name: "Choy Ahmad 25p", current: 0, min: 5, unit: "paket", color: COLORS.red },
  ];

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
          background: `radial-gradient(circle, ${COLORS.amber}10 0%, transparent 70%)`,
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
          background: `radial-gradient(circle, ${COLORS.red}05 0%, transparent 70%)`,
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
            border: `1px solid ${COLORS.amber}30`,
            boxShadow: `0 4px 20px ${COLORS.amber}20`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: COLORS.amber,
              boxShadow: `0 0 10px ${COLORS.amber}`,
              animation: "pulse 1.5s infinite",
            }}
          />
          <span style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: COLORS.amber, fontFamily: FONTS.inter }}>
            Kam qolgan — ko'z oldingizda
          </span>
        </div>
      </div>

      <div
        style={{
          opacity: containerOpacity,
          transform: `translateY(${containerTranslateY}px) scale(${containerScale})`,
          display: "flex",
          flexDirection: "column",
          gap: SPACING.md,
          zIndex: 10,
        }}
      >
        <div
          style={{
            opacity: cardAnimations[0].opacity,
            transform: `translateY(${cardAnimations[0].translateY}px) scale(${cardAnimations[0].scale})`,
          }}
        >
          <InventoryAlertCard title="⚠️ Kam qoldi" items={lowStockItems} accentColor={COLORS.amber} iconColor={COLORS.amber} />
        </div>

        <div
          style={{
            opacity: cardAnimations[1].opacity,
            transform: `translateY(${cardAnimations[1].translateY}px) scale(${cardAnimations[1].scale})`,
          }}
        >
          <InventoryAlertCard title="🚫 Tugadi" items={outOfStockItems} accentColor={COLORS.red} iconColor={COLORS.red} />
        </div>

        <div
          style={{
            opacity: cardAnimations[2].opacity,
            transform: `translateY(${cardAnimations[2].translateY}px) scale(${cardAnimations[2].scale})`,
          }}
        >
          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
}

function InventoryAlertCard({
  title,
  items,
  accentColor,
  iconColor,
}: {
  title: string;
  items: { name: string; current: number; min: number; unit: string; color: string }[];
  accentColor: string;
  iconColor: string;
}) {
  return (
    <div
      style={{
        width: 500,
        background: COLORS.lightCard,
        borderRadius: BORDER_RADIUS.xl,
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 4px 30px ${accentColor}15`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: SPACING.lg,
          background: `linear-gradient(135deg, ${accentColor}10, ${accentColor}05)`,
          borderBottom: `1px solid ${accentColor}20`,
          display: "flex",
          alignItems: "center",
          gap: SPACING.md,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: BORDER_RADIUS.lg,
            background: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 20px ${accentColor}50`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: FONT_WEIGHTS.bold, color: accentColor, fontFamily: FONTS.inter }}>{title}</div>
          <div style={{ fontSize: 12, color: COLORS.lightTextMuted }}>{items.length} ta mahsulot diqqat talab qilmoqda</div>
        </div>
      </div>
      <div style={{ padding: SPACING.lg }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `${SPACING.md}px ${SPACING.lg}px`,
              marginBottom: i < items.length - 1 ? SPACING.md : 0,
              background: COLORS.lightBg,
              borderRadius: BORDER_RADIUS.lg,
              border: `1px solid ${item.color}20`,
              borderBottom: i < items.length - 1 ? `1px solid ${COLORS.lightBorder}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: SPACING.md }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: BORDER_RADIUS.md,
                  background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 15, color: COLORS.lightText }}>{item.name}</div>
                <div style={{ fontSize: 12, color: COLORS.lightTextMuted }}>Minimal: {item.min} {item.unit}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: FONT_WEIGHTS.extrabold, color: item.color, fontFamily: FONTS.inter }}>
                {item.current} {item.unit}
              </div>
              <div style={{ fontSize: 11, color: COLORS.lightTextMuted }}>
                {item.current === 0 ? "Tugagan" : `${Math.round((item.current / item.min) * 100)}% qoldi`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActionsCard() {
  const actions = [
    { label: "CSV import", icon: "📥", color: COLORS.indigo },
    { label: "Barcode print", icon: "🖨️", color: COLORS.emerald },
    { label: "Zaxira yangilash", icon: "🔄", color: COLORS.amber },
    { label: "Yorliq chop etish", icon: "🏷️", color: COLORS.red },
  ];

  return (
    <div
      style={{
        width: 500,
        background: COLORS.lightCard,
        borderRadius: BORDER_RADIUS.xl,
        border: `1px solid ${COLORS.lightBorder}`,
        boxShadow: SHADOWS.lg,
        padding: SPACING.lg,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: COLORS.indigo, marginBottom: SPACING.lg, fontFamily: FONTS.inter }}>
        Tezkor harakatlar
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: SPACING.md }}>
        {actions.map((action, i) => (
          <button
            key={action.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: SPACING.sm,
              padding: SPACING.lg,
              borderRadius: BORDER_RADIUS.lg,
              background: COLORS.lightBg,
              border: `1px solid ${action.color}30`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: 28 }}>{action.icon}</span>
            <span style={{ fontSize: 13, fontWeight: FONT_WEIGHTS.semibold, color: action.color, fontFamily: FONTS.inter }}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}