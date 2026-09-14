import React from "react";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS } from "../utils/theme";

interface DashboardScreenProps {
  animatedValues?: {
    todayRevenue?: number;
    monthlyRevenue?: number;
    totalProducts?: number;
    inventoryValue?: number;
  };
}

export function DashboardScreen({ animatedValues = {} }: DashboardScreenProps) {
  const todayRevenue = animatedValues.todayRevenue ?? 12450000;
  const monthlyRevenue = animatedValues.monthlyRevenue ?? 342150000;
  const totalProducts = animatedValues.totalProducts ?? 1247;
  const inventoryValue = animatedValues.inventoryValue ?? 89500000;

  const recentSales = [
    { time: "14:23", items: "3 ta", amount: "45 000", method: "Naqd" },
    { time: "14:18", items: "1 ta", amount: "25 000", method: "Karta" },
    { time: "14:12", items: "5 ta", amount: "67 500", method: "Naqd" },
    { time: "14:05", items: "2 ta", amount: "18 000", method: "Click" },
    { time: "13:58", items: "4 ta", amount: "92 000", method: "Karta" },
  ];

  const topProducts = [
    { name: "Coca-Cola 1.5L", sold: 127, revenue: 1524000 },
    { name: "Non (Obi)", sold: 89, revenue: 356000 },
    { name: "Sut 1L", sold: 65, revenue: 552500 },
    { name: "Shokolad Snickers", sold: 54, revenue: 810000 },
    { name: "Kartoshka 1kg", sold: 43, revenue: 215000 },
  ];

  const chartData = [12, 19, 15, 28, 22, 35, 31, 28, 42, 38, 45, 41, 48, 52, 49, 55, 61, 58, 64, 67, 72, 69, 75, 78];

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
            <h1 style={{ fontSize: 28, fontWeight: FONT_WEIGHTS.extrabold, margin: 0 }}>Dashboard</h1>
            <p style={{ margin: `${SPACING.xs}px 0 0`, opacity: 0.9, fontSize: 14 }}>Bugungi kuzatuv: 12 sentyabr 2026</p>
          </div>
          <div
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: BORDER_RADIUS.full,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              fontSize: 13,
              fontWeight: FONT_WEIGHTS.medium,
            }}
          >
            🇺🇿 O'zbek
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: SPACING.lg, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: SPACING.md }}>
        <StatCard
          title="Bugungi daromad"
          value={todayRevenue.toLocaleString()}
          suffix=" so'm"
          icon={RevenueIcon}
          trend="+12.5%"
          trendColor={COLORS.emerald}
          accentColor={COLORS.indigo}
        />
        <StatCard
          title="Oylik tushum"
          value={monthlyRevenue.toLocaleString()}
          suffix=" so'm"
          icon={TrendingIcon}
          trend="+8.2%"
          trendColor={COLORS.emerald}
          accentColor={COLORS.amber}
        />
        <StatCard
          title="Mahsulotlar"
          value={totalProducts.toLocaleString()}
          suffix=" ta"
          icon={ProductsIcon}
          trend="5 kam qoldi"
          trendColor={COLORS.amber}
          accentColor={COLORS.emerald}
        />
        <StatCard
          title="Ombor qiymati"
          value={inventoryValue.toLocaleString()}
          suffix=" so'm"
          icon={InventoryIcon}
          trend="Normal"
          trendColor={COLORS.indigo}
          accentColor={COLORS.amber}
        />
      </div>

      {/* Chart Section */}
      <div style={{ padding: `0 ${SPACING.lg}px ${SPACING.lg}px`, flex: 1, overflow: "auto" }}>
        <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden" }}>
          <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.lightBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHTS.bold }}>Sotuv grafigi (oxirgi 24 soat)</h2>
            <div style={{ display: "flex", gap: SPACING.sm }}>
              {["12h", "24h", "7k", "30k"].map((period) => (
                <button
                  key={period}
                  style={{
                    padding: `${SPACING.xs}px ${SPACING.md}px`,
                    borderRadius: BORDER_RADIUS.full,
                    background: period === "24h" ? COLORS.indigo : "transparent",
                    border: `1px solid ${period === "24h" ? COLORS.indigo : COLORS.lightBorder}`,
                    color: period === "24h" ? COLORS.white : COLORS.lightTextMuted,
                    fontSize: 12,
                    fontWeight: FONT_WEIGHTS.medium,
                    fontFamily: FONTS.inter,
                    cursor: "pointer",
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: SPACING.lg, height: 280 }}>
            <div style={{ height: "100%", display: "flex", alignItems: "flex-end", gap: 8 }}>
              {chartData.map((value, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    maxWidth: 24,
                    height: `${(value / 80) * 100}%`,
                    minHeight: "4px",
                    borderRadius: `${BORDER_RADIUS.sm}px ${BORDER_RADIUS.sm}px 0 0`,
                    background: `linear-gradient(to top, ${COLORS.indigo}, ${COLORS.indigoLight})`,
                    boxShadow: `0 -2px 8px ${COLORS.indigoGlow}`,
                    transition: "height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sales & Top Products */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACING.lg, marginTop: SPACING.lg }}>
          <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden" }}>
            <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.lightBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHTS.bold }}>Oxirgi sotuvlar</h2>
              <span style={{ fontSize: 12, color: COLORS.emerald, fontWeight: FONT_WEIGHTS.medium }}>● Real vaqtda</span>
            </div>
            <div style={{ maxHeight: 300, overflow: "auto" }}>
              {recentSales.map((sale, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: `${SPACING.md}px ${SPACING.lg}px`,
                    borderBottom: i < recentSales.length - 1 ? `1px solid ${COLORS.lightBorder}` : "none",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: FONT_WEIGHTS.medium, fontSize: 14 }}>{sale.time}</span>
                    <span style={{ fontSize: 12, color: COLORS.lightTextMuted }}>{sale.items} • {sale.method}</span>
                  </div>
                  <span style={{ fontWeight: FONT_WEIGHTS.bold, fontSize: 15, color: COLORS.indigo }}>{sale.amount} so'm</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden" }}>
            <div style={{ padding: SPACING.lg, borderBottom: `1px solid ${COLORS.lightBorder}` }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: FONT_WEIGHTS.bold }}>TOP mahsulotlar</h2>
            </div>
            <div style={{ maxHeight: 300, overflow: "auto" }}>
              {topProducts.map((product, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING.md,
                    padding: `${SPACING.md}px ${SPACING.lg}px`,
                    borderBottom: i < topProducts.length - 1 ? `1px solid ${COLORS.lightBorder}` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: BORDER_RADIUS.md,
                      background: i < 3 ? `linear-gradient(135deg, ${COLORS.amber}, ${COLORS.amberLight})` : COLORS.lightBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: FONT_WEIGHTS.bold,
                      fontSize: 14,
                      color: i < 3 ? COLORS.white : COLORS.lightTextMuted,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: FONT_WEIGHTS.medium, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.lightTextMuted }}>
                      Sotildi: {product.sold} ta • {product.revenue.toLocaleString()} so'm
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div style={{ marginTop: SPACING.lg, display: "flex", gap: SPACING.md }}>
          <AlertCard
            icon={AlertIcon}
            title="Kam qoldi"
            count={5}
            items={["Non (Obi) - 3 qoldi", "Sut 1L - 2 qoldi", "Yogurt - 1 qoldi"]}
            color={COLORS.amber}
            bgColor={COLORS.amber + "15"}
            borderColor={COLORS.amber + "40"}
          />
          <AlertCard
            icon={AlertIcon}
            title="Tugadi"
            count={2}
            items={["Pishloq 200g", "Choy Ahmad 25p"]}
            color={COLORS.red}
            bgColor={COLORS.red + "15"}
            borderColor={COLORS.red + "40"}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  suffix,
  icon: IconComponent,
  trend,
  trendColor,
  accentColor,
}: {
  title: string;
  value: string;
  suffix: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  trend: string;
  trendColor: string;
  accentColor: string;
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
        gap: SPACING.md,
        boxShadow: SHADOWS.sm,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: BORDER_RADIUS.full,
          background: `${accentColor}15`,
          opacity: 0.5,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, color: COLORS.lightTextMuted, fontWeight: FONT_WEIGHTS.medium }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: FONT_WEIGHTS.extrabold, fontFamily: FONTS.inter, lineHeight: 1.1, marginTop: SPACING.xs }}>
            {value}
            <span style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.normal, color: COLORS.lightTextMuted }}>{suffix}</span>
          </div>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: BORDER_RADIUS.lg,
            background: `${accentColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent style={{ width: 24, height: 24, color: accentColor }} />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: SPACING.xs,
          padding: `${SPACING.xs}px ${SPACING.sm}px`,
          borderRadius: BORDER_RADIUS.full,
          background: `${trendColor}15`,
          color: trendColor,
          fontSize: 12,
          fontWeight: FONT_WEIGHTS.semibold,
          width: "fit-content",
        }}
      >
        <span style={{ fontSize: 10 }}>▲</span>
        {trend}
      </div>
    </div>
  );
}

function AlertCard({
  icon: IconComponent,
  title,
  count,
  items,
  color,
  bgColor,
  borderColor,
}: {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  count: number;
  items: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: COLORS.lightCard,
        borderRadius: BORDER_RADIUS.xl,
        border: `1px solid ${borderColor}`,
        padding: SPACING.lg,
        display: "flex",
        flexDirection: "column",
        gap: SPACING.md,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: BORDER_RADIUS.lg,
            background: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent style={{ width: 20, height: 20, color }} />
        </div>
        <div>
          <div style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 12, color: COLORS.lightTextMuted }}>{count} ta mahsulot</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.xs }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.sm,
              padding: SPACING.xs,
              background: bgColor,
              borderRadius: BORDER_RADIUS.md,
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: BORDER_RADIUS.full,
                background: color,
              }}
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Icons
function RevenueIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function TrendingIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ProductsIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function InventoryIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function AlertIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}