import React from "react";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS } from "../utils/theme";

interface ReportsScreenProps {
  animatedProgress?: number;
}

export function ReportsScreen({ animatedProgress = 1 }: ReportsScreenProps) {
  const dailyData = [45, 52, 38, 61, 55, 72, 68, 75, 82, 78, 85, 88, 92, 95, 90, 98, 105, 102, 110, 108, 115, 118, 122, 120];
  const paymentData = [
    { name: "Naqd", value: 45, color: COLORS.indigo },
    { name: "Karta", value: 35, color: COLORS.emerald },
    { name: "Click", value: 12, color: COLORS.amber },
    { name: "Payme", value: 8, color: COLORS.red },
  ];
  const categoryData = [
    { name: "Ichimliklar", value: 32, color: COLORS.indigo },
    { name: "Non", value: 24, color: COLORS.amber },
    { name: "Sut mahsulotlari", value: 18, color: COLORS.emerald },
    { name: "Shirinliklar", value: 15, color: COLORS.red },
    { name: "Sabzavotlar", value: 11, color: COLORS.indigoLight },
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: FONT_WEIGHTS.extrabold }}>Hisobotlar</h1>
        <p style={{ margin: `${SPACING.xs}px 0 0`, opacity: 0.9, fontSize: 14 }}>Real vaqtda tahlil va statistika</p>
      </div>

      <div style={{ padding: SPACING.lg, flex: 1, overflow: "auto" }}>
        {/* Period Selector */}
        <div style={{ display: "flex", gap: SPACING.sm, marginBottom: SPACING.lg, flexWrap: "wrap" }}>
          {["Bugun", "Bu hafta", "Bu oy", "Bu yil", "Maxsus"].map((period) => (
            <button
              key={period}
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: BORDER_RADIUS.full,
                background: period === "Bu oy" ? COLORS.indigo : COLORS.lightCard,
                border: `1px solid ${period === "Bu oy" ? COLORS.indigo : COLORS.lightBorder}`,
                color: period === "Bu oy" ? COLORS.white : COLORS.lightText,
                fontSize: 13,
                fontWeight: FONT_WEIGHTS.medium,
                fontFamily: FONTS.inter,
                cursor: "pointer",
              }}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: SPACING.md, marginBottom: SPACING.lg }}>
          <SummaryCard title="Jami sotuv" value="124.5 mln" suffix="so'm" trend="+12.5%" trendColor={COLORS.emerald} iconColor={COLORS.indigo} />
          <SummaryCard title="Buyurtmalar" value="342" suffix="ta" trend="+8" trendColor={COLORS.emerald} iconColor={COLORS.amber} />
          <SummaryCard title="O'rtacha chek" value="364.000" suffix="so'm" trend="+5.2%" trendColor={COLORS.emerald} iconColor={COLORS.emerald} />
          <SummaryCard title="Yangi mijozlar" value="28" suffix="ta" trend="+15%" trendColor={COLORS.emerald} iconColor={COLORS.red} />
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: SPACING.lg, marginBottom: SPACING.lg }}>
          {/* Line Chart - Daily Sales */}
          <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden" }}>
            <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.lightBorder}` }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHTS.bold }}>Kunlik sotuvlar dinamikasi</h2>
            </div>
            <div style={{ padding: SPACING.lg, height: 300 }}>
              <LineChart
                data={dailyData}
                color={COLORS.indigo}
                animatedProgress={animatedProgress}
                width="100%"
                height="100%"
              />
            </div>
          </div>

          {/* Doughnut Chart - Payment Methods */}
          <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.lightBorder}` }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHTS.bold }}>To'lov usullari</h2>
            </div>
            <div style={{ flex: 1, padding: SPACING.lg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <DoughnutChart
                data={paymentData}
                animatedProgress={animatedProgress}
                size={200}
              />
              <div style={{ marginTop: SPACING.lg, display: "flex", flexDirection: "column", gap: SPACING.sm, width: "100%" }}>
                {paymentData.map((item) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: BORDER_RADIUS.sm,
                        background: item.color,
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: FONT_WEIGHTS.medium }}>{item.name}</span>
                    <span style={{ fontWeight: FONT_WEIGHTS.bold, fontSize: 14, color: item.color }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category Bar Chart & Top Products */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACING.lg }}>
          {/* Horizontal Bar Chart - Categories */}
          <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden" }}>
            <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.lightBorder}` }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHTS.bold }}>Kategoriyalar bo'yicha</h2>
            </div>
            <div style={{ padding: SPACING.lg }}>
              <HorizontalBarChart
                data={categoryData}
                animatedProgress={animatedProgress}
                height={280}
              />
            </div>
          </div>

          {/* Top Products Table */}
          <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden" }}>
            <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.lightBorder}` }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHTS.bold }}>Eng ko'p sotilganlar</h2>
            </div>
            <div style={{ padding: SPACING.lg }}>
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 60px 80px", gap: SPACING.md, fontSize: 12, color: COLORS.lightTextMuted, fontWeight: FONT_WEIGHTS.semibold, paddingBottom: SPACING.sm, borderBottom: `1px solid ${COLORS.lightBorder}` }}>
                <span>#</span>
                <span>Mahsulot</span>
                <span>Soni</span>
                <span>Daromad</span>
              </div>
              <div style={{ maxHeight: 300, overflow: "auto" }}>
                {[
                  { name: "Coca-Cola 1.5L", sold: 127, revenue: 1524000 },
                  { name: "Non (Obi)", sold: 89, revenue: 356000 },
                  { name: "Sut 1L", sold: 65, revenue: 552500 },
                  { name: "Shokolad Snickers", sold: 54, revenue: 810000 },
                  { name: "Kartoshka 1kg", sold: 43, revenue: 215000 },
                  { name: "Pishloq 200g", sold: 38, revenue: 684000 },
                  { name: "Yogurt 150g", sold: 35, revenue: 210000 },
                  { name: "Choy Ahmad 25p", sold: 28, revenue: 700000 },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr 60px 80px",
                      gap: SPACING.md,
                      alignItems: "center",
                      padding: `${SPACING.sm}px 0`,
                      borderBottom: i < 7 ? `1px solid ${COLORS.lightBorder}` : "none",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: FONT_WEIGHTS.bold, color: i < 3 ? COLORS.amber : COLORS.lightTextMuted }}>{i + 1}</span>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                    <span style={{ textAlign: "center", fontWeight: FONT_WEIGHTS.medium }}>{item.sold} ta</span>
                    <span style={{ textAlign: "right", fontWeight: FONT_WEIGHTS.semibold, color: COLORS.indigo }}>{item.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  suffix,
  trend,
  trendColor,
  iconColor,
}: {
  title: string;
  value: string;
  suffix: string;
  trend: string;
  trendColor: string;
  iconColor: string;
}) {
  return (
    <div
      style={{
        background: COLORS.lightCard,
        borderRadius: BORDER_RADIUS.xl,
        border: `1px solid ${COLORS.lightBorder}`,
        padding: SPACING.lg,
        display: "flex",
        flexDirection: "column",
        gap: SPACING.sm,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 13, color: COLORS.lightTextMuted, fontWeight: FONT_WEIGHTS.medium }}>{title}</div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: BORDER_RADIUS.lg,
            background: `${iconColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: FONT_WEIGHTS.extrabold, fontFamily: FONTS.inter, lineHeight: 1.1 }}>
        {value}
        <span style={{ fontSize: 14, fontWeight: FONT_WEIGHTS.normal, color: COLORS.lightTextMuted }}>{suffix}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: SPACING.xs,
          color: trendColor,
          fontSize: 12,
          fontWeight: FONT_WEIGHTS.semibold,
        }}
      >
        <span style={{ fontSize: 10 }}>▲</span>
        {trend} o'sish
      </div>
    </div>
  );
}

function LineChart({
  data,
  color,
  animatedProgress,
  width,
  height,
}: {
  data: number[];
  color: string;
  animatedProgress: number;
  width: string | number;
  height: string | number;
}) {
  const maxValue = Math.max(...data) * 1.1;
  const visiblePoints = Math.max(1, Math.floor(data.length * animatedProgress));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${data.length * 20} ${maxValue}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={COLORS.indigoLight} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      <g stroke={COLORS.lightBorder} strokeWidth="0.5" opacity="0.5">
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line key={ratio} x1="0" y1={maxValue * ratio} x2={data.length * 20} y2={maxValue * ratio} />
        ))}
      </g>
      {/* Area */}
      <path
        d={[
          `M 0 ${maxValue}`,
          ...data.slice(0, visiblePoints).map((value, i) => `L ${i * 20} ${maxValue - value}`),
          `L ${(visiblePoints - 1) * 20} ${maxValue}`,
          "Z",
        ].join(" ")}
        fill="url(#lineGradient)"
      />
      {/* Line */}
      <path
        d={data.slice(0, visiblePoints).map((value, i) => `${i === 0 ? "M" : "L"} ${i * 20} ${maxValue - value}`).join(" ")}
        stroke="url(#strokeGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 0 6px rgba(99,102,241,0.4))"
      />
      {/* Dots */}
      {data.slice(0, visiblePoints).map((value, i) => (
        <circle
          key={i}
          cx={i * 20}
          cy={maxValue - value}
          r={4}
          fill={color}
          stroke={COLORS.white}
          strokeWidth={2}
          style={{ filter: "drop-shadow(0 0 4px rgba(99,102,241,0.6))" }}
        />
      ))}
    </svg>
  );
}

function DoughnutChart({
  data,
  animatedProgress,
  size,
}: {
  data: { name: string; value: number; color: string }[];
  animatedProgress: number;
  size: number;
}) {
  const radius = size / 2 - 10;
  const strokeWidth = 24;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((item, i) => {
        const percentage = (item.value / total) * animatedProgress;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference * (1 - percentage / 100);
        const startAngle = (cumulative / total) * 360 - 90;
        cumulative += item.value;

        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              transformOrigin: `${size / 2}px ${size / 2}px`,
            }}
          />
        );
      })}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius - strokeWidth / 2 - 4}
        fill={COLORS.lightBg}
        stroke={COLORS.lightBorder}
        strokeWidth="1"
      />
    </svg>
  );
}

function HorizontalBarChart({
  data,
  animatedProgress,
  height,
}: {
  data: { name: string; value: number; color: string }[];
  animatedProgress: number;
  height: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <svg width="100%" height={height} viewBox={`0 0 400 ${data.length * 50}`} preserveAspectRatio="none">
      {data.map((item, i) => {
        const barWidth = (item.value / maxValue) * 320 * animatedProgress;
        const y = i * 50 + 10;

        return (
          <g key={i}>
            <text
              x={10}
              y={y + 22}
              fontFamily={FONTS.inter}
              fontSize={13}
              fontWeight={FONT_WEIGHTS.medium}
              fill={COLORS.lightText}
              dominantBaseline="middle"
            >
              {item.name}
            </text>
            <rect
              x={130}
              y={y + 4}
              width={barWidth}
              height={32}
              rx={BORDER_RADIUS.md}
              fill={item.color}
              style={{
                filter: `drop-shadow(0 0 8px ${item.color}60)`,
                transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
            <text
              x={130 + barWidth + 8}
              y={y + 22}
              fontFamily={FONTS.inter}
              fontSize={12}
              fontWeight={FONT_WEIGHTS.semibold}
              fill={item.color}
              dominantBaseline="middle"
            >
              {item.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}