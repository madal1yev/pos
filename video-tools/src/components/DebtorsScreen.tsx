import React from "react";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS } from "../utils/theme";

interface DebtorsScreenProps {
  animatedScroll?: number;
  showDetail?: boolean;
  detailCustomer?: typeof CUSTOMERS[0];
}

type CustomerStatus = "active" | "warning" | "danger";

interface Customer {
  id: number;
  name: string;
  phone: string;
  debt: number;
  totalDebt: number;
  lastVisit: string;
  status: CustomerStatus;
  orders: number;
}

const CUSTOMERS: Customer[] = [
  { id: 1, name: "Alijon Valiyev", phone: "+998 90 123 45 67", debt: 2450000, totalDebt: 2450000, lastVisit: "2 kun avval", status: "active", orders: 12 },
  { id: 2, name: "Malika Karimova", phone: "+998 93 456 78 90", debt: 1800000, totalDebt: 1800000, lastVisit: "1 kunda", status: "active", orders: 8 },
  { id: 3, name: "Bobur Toshmatov", phone: "+998 99 789 01 23", debt: 3200000, totalDebt: 3200000, lastVisit: "5 kun avval", status: "warning", orders: 15 },
  { id: 4, name: "Nodira Alimova", phone: "+998 97 234 56 78", debt: 950000, totalDebt: 950000, lastVisit: "Bugun", status: "active", orders: 6 },
  { id: 5, name: "Jasurbek Rahimov", phone: "+998 90 345 67 89", debt: 4100000, totalDebt: 4100000, lastVisit: "1 hafta avval", status: "danger", orders: 22 },
  { id: 6, name: "Shahnoza Yusupova", phone: "+998 93 567 89 01", debt: 670000, totalDebt: 670000, lastVisit: "3 kun avval", status: "active", orders: 4 },
  { id: 7, name: "Azizbek Normatov", phone: "+998 99 678 90 12", debt: 1250000, totalDebt: 1250000, lastVisit: "Bugun", status: "active", orders: 9 },
  { id: 8, name: "Gulnora Xaydarova", phone: "+998 97 789 01 23", debt: 2800000, totalDebt: 2800000, lastVisit: "4 kun avval", status: "warning", orders: 11 },
];

const SUPPLIERS = [
  { id: 1, name: "Toshkent Non Kombinati", contact: "Rahimov A.", phone: "+998 71 234 56 78", debt: 15000000, status: "active" },
  { id: 2, name: "Sut Dunyosi MChJ", contact: "Karimova M.", phone: "+998 71 345 67 89", debt: 8500000, status: "active" },
  { id: 3, name: "Ichimlik Distributori", contact: "Aliyev B.", phone: "+998 71 456 78 90", debt: 22000000, status: "warning" },
];

const STATUS_STYLES: Record<CustomerStatus, { bg: string; border: string; text: string; dot: string; label: string }> = {
  active: { bg: COLORS.emerald + "15", border: COLORS.emerald + "40", text: COLORS.emerald, dot: COLORS.emerald, label: "Faol" },
  warning: { bg: COLORS.amber + "15", border: COLORS.amber + "40", text: COLORS.amber, dot: COLORS.amber, label: "Diqqat" },
  danger: { bg: COLORS.red + "15", border: COLORS.red + "40", text: COLORS.red, dot: COLORS.red, label: "Kritik" },
};

export function DebtorsScreen({ animatedScroll = 0, showDetail = false, detailCustomer }: DebtorsScreenProps) {
  const totalDebt = CUSTOMERS.reduce((sum, c) => sum + c.debt, 0);
  const activeCount = CUSTOMERS.filter((c) => c.status === "active").length;
  const warningCount = CUSTOMERS.filter((c) => c.status === "warning").length;
  const dangerCount = CUSTOMERS.filter((c) => c.status === "danger").length;

  if (showDetail && detailCustomer) {
    return <CustomerDetailScreen customer={detailCustomer} onClose={() => {}} />;
  }

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
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: FONT_WEIGHTS.extrabold }}>Qarzdorlar</h1>
            <p style={{ margin: `${SPACING.xs}px 0 0`, opacity: 0.9, fontSize: 14 }}>Mijozlar va yetkazib beruvchilar hisob-kitobi</p>
          </div>
          <div style={{ display: "flex", gap: SPACING.sm }}>
            <button
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: BORDER_RADIUS.full,
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: COLORS.white,
                fontSize: 13,
                fontWeight: FONT_WEIGHTS.medium,
                fontFamily: FONTS.inter,
                cursor: "pointer",
              }}
            >
              Mijozlar
            </button>
            <button
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: BORDER_RADIUS.full,
                background: "transparent",
                border: `1px solid rgba(255,255,255,0.3)`,
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                fontWeight: FONT_WEIGHTS.medium,
                fontFamily: FONTS.inter,
                cursor: "pointer",
              }}
            >
              Yetkazib beruvchilar
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ padding: SPACING.lg, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: SPACING.md }}>
        <DebtSummaryCard title="Jami qarz" value={totalDebt.toLocaleString()} suffix=" so'm" color={COLORS.indigo} icon={DebtIcon} />
        <DebtSummaryCard title="Faol mijozlar" value={String(activeCount)} suffix=" ta" color={COLORS.emerald} icon={ActiveIcon} />
        <DebtSummaryCard title="Diqqat kerak" value={String(warningCount)} suffix=" ta" color={COLORS.amber} icon={WarningIcon} />
        <DebtSummaryCard title="Kritik" value={String(dangerCount)} suffix=" ta" color={COLORS.red} icon={DangerIcon} />
      </div>

      {/* Tabs */}
      <div style={{ padding: `0 ${SPACING.lg}px`, display: "flex", gap: SPACING.sm, borderBottom: `1px solid ${COLORS.lightBorder}`, marginBottom: SPACING.md }}>
        <button
          style={{
            padding: `${SPACING.md}px ${SPACING.lg}px`,
            borderBottom: `3px solid ${COLORS.indigo}`,
            color: COLORS.indigo,
            fontWeight: FONT_WEIGHTS.semibold,
            fontSize: 14,
            fontFamily: FONTS.inter,
            background: "transparent",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
          }}
        >
          Mijozlar ({CUSTOMERS.length})
        </button>
        <button
          style={{
            padding: `${SPACING.md}px ${SPACING.lg}px`,
            borderBottom: `3px solid transparent`,
            color: COLORS.lightTextMuted,
            fontWeight: FONT_WEIGHTS.normal,
            fontSize: 14,
            fontFamily: FONTS.inter,
            background: "transparent",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
          }}
        >
          Yetkazib beruvchilar ({SUPPLIERS.length})
        </button>
      </div>

      {/* Customers List */}
      <div style={{ flex: 1, overflow: "auto", padding: `0 ${SPACING.lg}px ${SPACING.lg}px` }}>
        <div
          style={{
            transform: `translateY(${-animatedScroll}px)`,
            transition: "transform 0.1s linear",
          }}
        >
          {CUSTOMERS.map((customer, i) => (
            <CustomerCard key={customer.id} customer={customer} index={i} onClick={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DebtSummaryCard({
  title,
  value,
  suffix,
  color,
  icon: IconComponent,
}: {
  title: string;
  value: string;
  suffix: string;
  color: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
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
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent style={{ width: 20, height: 20, color }} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: FONT_WEIGHTS.extrabold, fontFamily: FONTS.inter, lineHeight: 1.1 }}>
        {value}
        <span style={{ fontSize: 14, fontWeight: FONT_WEIGHTS.normal, color: COLORS.lightTextMuted }}>{suffix}</span>
      </div>
    </div>
  );
}

function CustomerCard({ customer, index, onClick }: { customer: Customer; index: number; onClick: () => void }) {
  const status = STATUS_STYLES[customer.status];

  return (
    <div
      style={{
        background: COLORS.lightCard,
        borderRadius: BORDER_RADIUS.xl,
        border: `1px solid ${COLORS.lightBorder}`,
        marginBottom: SPACING.md,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onClick={onClick}
    >
      <div style={{ padding: SPACING.md, display: "flex", gap: SPACING.md }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: BORDER_RADIUS.full,
            background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoDark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.white,
            fontWeight: FONT_WEIGHTS.bold,
            fontSize: 18,
            fontFamily: FONTS.inter,
            flexShrink: 0,
          }}
        >
          {customer.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.xs }}>
            <span style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 15 }}>{customer.name}</span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: `2px 8px`,
                borderRadius: BORDER_RADIUS.full,
                background: status.bg,
                border: `1px solid ${status.border}`,
                fontSize: 11,
                fontWeight: FONT_WEIGHTS.semibold,
                color: status.text,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: BORDER_RADIUS.full,
                  background: status.dot,
                  animation: "pulse 2s infinite",
                }}
              />
              {status.label}
            </div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.lightTextMuted, marginBottom: SPACING.xs }}>{customer.phone}</div>
          <div style={{ display: "flex", gap: SPACING.md, fontSize: 12, color: COLORS.lightTextMuted }}>
            <span>Oxirgi: {customer.lastVisit}</span>
            <span>{customer.orders} buyurtma</span>
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontSize: 18, fontWeight: FONT_WEIGHTS.extrabold, color: COLORS.indigo, fontFamily: FONTS.inter }}>
            {customer.debt.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: COLORS.lightTextMuted, marginTop: 2 }}>Qarz</div>
        </div>
        <div
          style={{
            width: 4,
            height: "100%",
            background: `linear-gradient(to bottom, ${status.dot}, ${status.dot}80)`,
          }}
        />
      </div>
    </div>
  );
}

function CustomerDetailScreen({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 200,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxHeight: "90%",
          background: COLORS.lightCard,
          borderRadius: `${BORDER_RADIUS.xl}px ${BORDER_RADIUS.xl}px 0 0`,
          padding: SPACING.xl,
          overflow: "auto",
          boxShadow: SHADOWS.xl,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: FONT_WEIGHTS.bold }}>Mijoz ma'lumotlari</h2>
          <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.full, background: COLORS.lightBg, border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.lg, padding: SPACING.lg, background: COLORS.lightBg, borderRadius: BORDER_RADIUS.xl }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: BORDER_RADIUS.full,
              background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.white,
              fontWeight: FONT_WEIGHTS.bold,
              fontSize: 24,
              fontFamily: FONTS.inter,
            }}
          >
            {customer.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: FONT_WEIGHTS.bold }}>{customer.name}</h3>
            <p style={{ margin: `${SPACING.xs}px 0 0`, color: COLORS.lightTextMuted }}>{customer.phone}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACING.md, marginBottom: SPACING.lg }}>
          <DetailItem label="Jami qarz" value={`${customer.totalDebt.toLocaleString()} so'm`} color={COLORS.red} />
          <DetailItem label="Buyurtmalar soni" value={`${customer.orders} ta`} color={COLORS.indigo} />
          <DetailItem label="Oxirgi tashrif" value={customer.lastVisit} color={COLORS.emerald} />
          <DetailItem label="Holati" value={STATUS_STYLES[customer.status].label} color={STATUS_STYLES[customer.status].text} />
        </div>
        <div style={{ display: "flex", gap: SPACING.md }}>
          <button style={{ flex: 1, padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, background: COLORS.indigo, border: "none", color: COLORS.white, fontWeight: FONT_WEIGHTS.bold, fontSize: 16, fontFamily: FONTS.inter, cursor: "pointer" }}>
            Qarzni to'lash
          </button>
          <button style={{ flex: 1, padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, background: COLORS.lightBg, border: `1px solid ${COLORS.lightBorder}`, color: COLORS.lightText, fontWeight: FONT_WEIGHTS.bold, fontSize: 16, fontFamily: FONTS.inter, cursor: "pointer" }}>
            Tarixni ko'rish
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: SPACING.md, background: COLORS.lightBg, borderRadius: BORDER_RADIUS.lg, border: `1px solid ${COLORS.lightBorder}` }}>
      <div style={{ fontSize: 12, color: COLORS.lightTextMuted, marginBottom: SPACING.xs }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color }}>{value}</div>
    </div>
  );
}

// Icons
function DebtIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ActiveIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WarningIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DangerIcon({ color = "currentColor", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}