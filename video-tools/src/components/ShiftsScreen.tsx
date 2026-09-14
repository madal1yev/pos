import React from "react";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS } from "../utils/theme";

interface ShiftsScreenProps {
  animatedProgress?: number;
}

export function ShiftsScreen({ animatedProgress = 1 }: ShiftsScreenProps) {
  const currentShift = {
    openedAt: "08:00",
    expectedCash: 2450000,
    actualCash: 2448500,
    difference: -1500,
    salesCount: 47,
    totalSales: 2450000,
  };

  const recentShifts = [
    { date: "11.09.2026", opened: "08:00", closed: "22:00", expected: 2380000, actual: 2380000, diff: 0, sales: 42, cashier: "Alijon K." },
    { date: "10.09.2026", opened: "08:00", closed: "22:00", expected: 2150000, actual: 2148500, diff: -1500, sales: 38, cashier: "Malika R." },
    { date: "09.09.2026", opened: "08:00", closed: "22:00", expected: 2670000, actual: 2671200, diff: 1200, sales: 51, cashier: "Alijon K." },
    { date: "08.09.2026", opened: "08:00", closed: "22:00", expected: 1980000, actual: 1980000, diff: 0, sales: 35, cashier: "Bobur T." },
    { date: "07.09.2026", opened: "08:00", closed: "22:00", expected: 2420000, actual: 2418500, diff: -1500, sales: 44, cashier: "Malika R." },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.lightBg,
        fontFamily: FONTS.inter,
        color: COLORS.lightText,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: SPACING.lg,
          background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoDark})`,
          color: COLORS.white,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: FONT_WEIGHTS.extrabold }}>Smenalar</h1>
            <p style={{ margin: `${SPACING.xs}px 0 0`, opacity: 0.9, fontSize: 14 }}>Kassa ochilish/yopilish nazorati</p>
          </div>
          <button
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: BORDER_RADIUS.full,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: COLORS.white,
              fontSize: 14,
              fontWeight: FONT_WEIGHTS.semibold,
              fontFamily: FONTS.inter,
              cursor: "pointer",
            }}
          >
            Smenani yopish
          </button>
        </div>
      </div>

      <div style={{ padding: SPACING.lg, flex: 1, overflow: "auto" }}>
        {/* Current Shift Card */}
        <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden", marginBottom: SPACING.lg }}>
          <div style={{ padding: SPACING.lg, background: `linear-gradient(135deg, ${COLORS.indigo}10, ${COLORS.indigoLight}10)`, borderBottom: `1px solid ${COLORS.lightBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
              <span style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 16, color: COLORS.indigo }}>● Hozirgi smena</span>
              <span style={{ fontSize: 14, color: COLORS.lightTextMuted }}>Ochilgan: {currentShift.openedAt}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: SPACING.md }}>
              <ShiftStat label="Kutilgan kassa" value={`${currentShift.expectedCash.toLocaleString()} so'm`} color={COLORS.indigo} />
              <ShiftStat label="Haqiqiy kassa" value={`${currentShift.actualCash.toLocaleString()} so'm`} color={COLORS.emerald} />
              <ShiftStat
                label="Farq"
                value={`${currentShift.difference >= 0 ? "+" : ""}${currentShift.difference.toLocaleString()} so'm`}
                color={currentShift.difference >= 0 ? COLORS.emerald : COLORS.red}
              />
            </div>
          </div>
          <div style={{ padding: SPACING.lg, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: SPACING.md }}>
            <ShiftStat label="Sotuvlar soni" value={`${currentShift.salesCount} ta`} color={COLORS.amber} />
            <ShiftStat label="Jami sotuv" value={`${currentShift.totalSales.toLocaleString()} so'm`} color={COLORS.indigo} />
          </div>
        </div>

        {/* Shift History */}
        <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden" }}>
          <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.lightBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHTS.bold }}>Smena tarixi</h2>
            <span style={{ fontSize: 12, color: COLORS.emerald, fontWeight: FONT_WEIGHTS.medium }}>● Barcha ma'lumotlar saqlandi</span>
          </div>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: COLORS.lightBg }}>
                  <th style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "left", fontWeight: FONT_WEIGHTS.semibold, color: COLORS.lightTextMuted, borderBottom: `1px solid ${COLORS.lightBorder}` }}>Sana</th>
                  <th style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "left", fontWeight: FONT_WEIGHTS.semibold, color: COLORS.lightTextMuted, borderBottom: `1px solid ${COLORS.lightBorder}` }}>Ochildi/Yopildi</th>
                  <th style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "right", fontWeight: FONT_WEIGHTS.semibold, color: COLORS.lightTextMuted, borderBottom: `1px solid ${COLORS.lightBorder}` }}>Kutilgan</th>
                  <th style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "right", fontWeight: FONT_WEIGHTS.semibold, color: COLORS.lightTextMuted, borderBottom: `1px solid ${COLORS.lightBorder}` }}>Haqiqiy</th>
                  <th style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "right", fontWeight: FONT_WEIGHTS.semibold, color: COLORS.lightTextMuted, borderBottom: `1px solid ${COLORS.lightBorder}` }}>Farq</th>
                  <th style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "center", fontWeight: FONT_WEIGHTS.semibold, color: COLORS.lightTextMuted, borderBottom: `1px solid ${COLORS.lightBorder}` }}>Sotuvlar</th>
                  <th style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "left", fontWeight: FONT_WEIGHTS.semibold, color: COLORS.lightTextMuted, borderBottom: `1px solid ${COLORS.lightBorder}` }}>Kassir</th>
                </tr>
              </thead>
              <tbody>
                {recentShifts.map((shift, i) => (
                  <tr key={i} style={{ borderBottom: i < recentShifts.length - 1 ? `1px solid ${COLORS.lightBorder}` : "none" }}>
                    <td style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, fontWeight: FONT_WEIGHTS.medium }}>{shift.date}</td>
                    <td style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, color: COLORS.lightTextMuted }}>{shift.opened} / {shift.closed}</td>
                    <td style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "right", fontFamily: FONTS.inter }}>{shift.expected.toLocaleString()}</td>
                    <td style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "right", fontFamily: FONTS.inter }}>{shift.actual.toLocaleString()}</td>
                    <td style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "right", fontWeight: FONT_WEIGHTS.bold, color: shift.diff >= 0 ? COLORS.emerald : COLORS.red, fontFamily: FONTS.inter }}>
                      {shift.diff >= 0 ? "+" : ""}{shift.diff.toLocaleString()}
                    </td>
                    <td style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, textAlign: "center" }}>{shift.sales}</td>
                    <td style={{ padding: `${SPACING.md}px ${SPACING.lg}px`, color: COLORS.lightTextMuted }}>{shift.cashier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Z-Report Button */}
        <div style={{ marginTop: SPACING.lg, textAlign: "center" }}>
          <button
            style={{
              padding: `${SPACING.md}px ${SPACING.xl}px`,
              borderRadius: BORDER_RADIUS.xl,
              background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoDark})`,
              border: "none",
              color: COLORS.white,
              fontSize: 16,
              fontWeight: FONT_WEIGHTS.bold,
              fontFamily: FONTS.inter,
              cursor: "pointer",
              boxShadow: SHADOWS.glow,
              display: "inline-flex",
              alignItems: "center",
              gap: SPACING.sm,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Z-rapot chop etish
          </button>
        </div>
      </div>
    </div>
  );
}

function ShiftStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, color: COLORS.lightTextMuted, marginBottom: SPACING.xs }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: FONT_WEIGHTS.extrabold, color, fontFamily: FONTS.inter }}>{value}</div>
    </div>
  );
}