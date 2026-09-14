import React from "react";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS } from "../utils/theme";

const PRODUCTS = [
  { id: 1, name: "Coca-Cola 1.5L", price: 12000, qty: 10, category: "Ichimliklar", barcode: "4601234567890" },
  { id: 2, name: "Non (Obi)", price: 4000, qty: 50, category: "Non", barcode: "4601234567891" },
  { id: 3, name: "Sut 1L", price: 8500, qty: 20, category: "Sut mahsulotlari", barcode: "4601234567892" },
  { id: 4, name: "Shokolad Snickers", price: 15000, qty: 30, category: "Shirinliklar", barcode: "4601234567893" },
  { id: 5, name: "Kartoshka 1kg", price: 5000, qty: 100, category: "Sabzavotlar", barcode: "4601234567894" },
  { id: 6, name: "Pishloq 200g", price: 18000, qty: 15, category: "Sut mahsulotlari", barcode: "4601234567895" },
  { id: 7, name: "Yogurt 150g", price: 6000, qty: 25, category: "Sut mahsulotlari", barcode: "4601234567896" },
  { id: 8, name: "Choy Ahmad 25p", price: 25000, qty: 12, category: "Ichimliklar", barcode: "4601234567897" },
];

const CART_ITEMS = [
  { ...PRODUCTS[0], cartQty: 2 },
  { ...PRODUCTS[1], cartQty: 3 },
  { ...PRODUCTS[3], cartQty: 1 },
];

const CATEGORIES = ["Barchasi", "Ichimliklar", "Non", "Sut mahsulotlari", "Shirinliklar", "Sabzavotlar"];

export function POSScreen({
  showScanner = false,
  scannerProgress = 0,
  showPayment = false,
  paymentMethod = "cash",
  showReceipt = false,
  animatedTotal = 0,
}: {
  showScanner?: boolean;
  scannerProgress?: number;
  showPayment?: boolean;
  paymentMethod?: "cash" | "card" | "other";
  showReceipt?: boolean;
  animatedTotal?: number;
}) {
  const total = CART_ITEMS.reduce((sum, item) => sum + item.price * item.cartQty, 0);
  const displayTotal = animatedTotal > 0 ? animatedTotal : total;

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
          padding: SPACING.md,
          background: COLORS.lightCard,
          borderBottom: `1px solid ${COLORS.lightBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACING.md,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: BORDER_RADIUS.md,
              background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: SHADOWS.glow,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span style={{ fontWeight: FONT_WEIGHTS.bold, fontSize: 18 }}>MaxPOS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
          <span style={{ fontSize: 14, color: COLORS.lightTextMuted }}>Kassa #1</span>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: BORDER_RADIUS.full,
              background: COLORS.emerald,
              boxShadow: `0 0 8px ${COLORS.emerald}`,
            }}
          />
        </div>
      </div>

      {/* Search & Scanner Bar */}
      <div
        style={{
          padding: SPACING.md,
          background: COLORS.lightCard,
          borderBottom: `1px solid ${COLORS.lightBorder}`,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: SPACING.sm,
          }}
        >
          <div
            style={{
              flex: 1,
              position: "relative",
            }}
          >
            <svg
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                color: COLORS.lightTextMuted,
                pointerEvents: "none",
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Qidirish yoki skanerlash..."
              readOnly
              style={{
                width: "100%",
                padding: `${SPACING.md}px ${SPACING.md}px ${SPACING.md}px 48px`,
                border: `2px solid ${COLORS.lightBorder}`,
                borderRadius: BORDER_RADIUS.lg,
                background: COLORS.lightBg,
                fontSize: 16,
                fontFamily: FONTS.inter,
                color: COLORS.lightText,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {showScanner && (
              <div
                style={{
                  position: "absolute",
                  bottom: -4,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: COLORS.lightBorder,
                  borderRadius: BORDER_RADIUS.full,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${scannerProgress}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${COLORS.indigo}, ${COLORS.indigoLight})`,
                    borderRadius: BORDER_RADIUS.full,
                    boxShadow: `0 0 10px ${COLORS.indigoGlow}`,
                    transition: "width 0.1s linear",
                  }}
                />
              </div>
            )}
          </div>
<button
              style={{
                width: 52,
                height: 52,
                borderRadius: BORDER_RADIUS.lg,
                background: showScanner
                  ? `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.emeraldLight})`
                  : `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoDark})`,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: showScanner ? `0 0 20px ${COLORS.emerald}80` : SHADOWS.glow,
                cursor: "pointer",
              }}
              aria-label={showScanner ? "Skanerlashni to'xtatish" : "Skanerlashni boshlash"}
            >
              <svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: showScanner ? "pulse 1s infinite" : "none" }}
              >
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
            </button>
        </div>
      </div>

      {/* Hot Sales Row */}
      <div
        style={{
          padding: `${SPACING.md}px ${SPACING.md}px ${SPACING.sm}px`,
          background: COLORS.lightCard,
          borderBottom: `1px solid ${COLORS.lightBorder}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.sm }}>
          <span style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 14, color: COLORS.amber }}>
            🔥 Bugungi hot-sotuvlar
          </span>
          <span style={{ fontSize: 12, color: COLORS.lightTextMuted }}>Tez qo'shish</span>
        </div>
        <div style={{ display: "flex", gap: SPACING.sm, overflowX: "auto", paddingBottom: SPACING.xs }}>
          {PRODUCTS.slice(0, 5).map((product) => (
            <button
              key={product.id}
              style={{
                flexShrink: 0,
                minWidth: 100,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: BORDER_RADIUS.lg,
                background: COLORS.lightBg,
                border: `1px solid ${COLORS.lightBorder}`,
                fontSize: 12,
                fontWeight: FONT_WEIGHTS.medium,
                fontFamily: FONTS.inter,
                color: COLORS.lightText,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = COLORS.indigo)}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = COLORS.lightBorder)}
            >
              {product.name}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Tabs */}
      <div
        style={{
          padding: `${SPACING.sm}px ${SPACING.md}px`,
          background: COLORS.lightCard,
          borderBottom: `1px solid ${COLORS.lightBorder}`,
          display: "flex",
          gap: SPACING.xs,
          overflowX: "auto",
        }}
      >
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat}
            style={{
              flexShrink: 0,
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: BORDER_RADIUS.full,
              background: i === 0 ? COLORS.indigo : COLORS.lightBg,
              border: `1px solid ${i === 0 ? COLORS.indigo : COLORS.lightBorder}`,
              fontSize: 13,
              fontWeight: i === 0 ? FONT_WEIGHTS.semibold : FONT_WEIGHTS.normal,
              fontFamily: FONTS.inter,
              color: i === 0 ? COLORS.white : COLORS.lightText,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: SPACING.md }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: SPACING.md,
          }}
        >
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              style={{
                background: COLORS.lightCard,
                borderRadius: BORDER_RADIUS.xl,
                border: `1px solid ${COLORS.lightBorder}`,
                padding: SPACING.md,
                display: "flex",
                flexDirection: "column",
                gap: SPACING.sm,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: SHADOWS.sm,
              }}
            >
              <div
                style={{
                  aspectRatio: "1",
                  borderRadius: BORDER_RADIUS.lg,
                  background: `linear-gradient(135deg, ${COLORS.indigo}15, ${COLORS.indigoLight}15)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={COLORS.indigo} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                {product.qty <= 10 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      padding: "2px 6px",
                      borderRadius: BORDER_RADIUS.full,
                      background: COLORS.red,
                      color: COLORS.white,
                      fontSize: 10,
                      fontWeight: FONT_WEIGHTS.bold,
                      fontFamily: FONTS.inter,
                    }}
                  >
                    Kam
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 13, lineHeight: 1.3 }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 11, color: COLORS.lightTextMuted, marginTop: 2 }}>
                  {product.category}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                <span style={{ fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: COLORS.indigo }}>
                  {product.price.toLocaleString()} so'm
                </span>
                <button
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: BORDER_RADIUS.full,
                    background: COLORS.indigo,
                    border: "none",
                    color: COLORS.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: SHADOWS.glow,
                    transition: "transform 0.1s ease",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Footer */}
      <div
        style={{
          background: COLORS.lightCard,
          borderTop: `1px solid ${COLORS.lightBorder}`,
          padding: SPACING.md,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm }}>
          <span style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 14 }}>Savat ({CART_ITEMS.length} ta)</span>
          <span style={{ fontSize: 12, color: COLORS.lightTextMuted }}>Yetkazib berish: Qo'l bilan</span>
        </div>
        <div style={{ maxHeight: 120, overflow: "auto", marginBottom: SPACING.md }}>
          {CART_ITEMS.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: SPACING.sm,
                padding: SPACING.xs,
                background: COLORS.lightBg,
                borderRadius: BORDER_RADIUS.md,
                marginBottom: SPACING.xs,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: FONT_WEIGHTS.medium, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 11, color: COLORS.lightTextMuted }}>
                  {item.cartQty} x {item.price.toLocaleString()} = {(item.cartQty * item.price).toLocaleString()} so'm
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: SPACING.xs }}>
                <button style={{ width: 28, height: 28, borderRadius: BORDER_RADIUS.full, background: COLORS.lightBorder, border: "none", color: COLORS.lightText, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
                <span style={{ fontWeight: FONT_WEIGHTS.bold, fontSize: 14, minWidth: 24, textAlign: "center" }}>{item.cartQty}</span>
                <button style={{ width: 28, height: 28, borderRadius: BORDER_RADIUS.full, background: COLORS.indigo, border: "none", color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: SPACING.sm, borderTop: `1px solid ${COLORS.lightBorder}` }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.lightTextMuted }}>Jami (soliq bilan)</div>
            <div style={{ fontSize: 28, fontWeight: FONT_WEIGHTS.extrabold, color: COLORS.indigo, fontFamily: FONTS.inter }}>
              {displayTotal.toLocaleString()} so'm
            </div>
          </div>
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
              transition: "transform 0.1s ease",
            }}
            disabled={CART_ITEMS.length === 0}
          >
            To'lov ({CART_ITEMS.length})
          </button>
        </div>
      </div>

      {/* Payment Modal Overlay */}
      {showPayment && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 100,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              maxHeight: "85%",
              background: COLORS.lightCard,
              borderRadius: `${BORDER_RADIUS.xl}px ${BORDER_RADIUS.xl}px 0 0`,
              padding: SPACING.xl,
              overflow: "auto",
              boxShadow: SHADOWS.xl,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg }}>
              <h3 style={{ fontSize: 20, fontWeight: FONT_WEIGHTS.bold }}>To'lov usulini tanlang</h3>
              <button style={{ width: 36, height: 36, borderRadius: BORDER_RADIUS.full, background: COLORS.lightBg, border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ fontSize: 24, fontWeight: FONT_WEIGHTS.extrabold, color: COLORS.indigo, marginBottom: SPACING.lg, fontFamily: FONTS.inter }}>
              {displayTotal.toLocaleString()} so'm
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.md }}>
              {["cash", "card", "other"].map((method) => (
                <button
                  key={method}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING.md,
                    padding: SPACING.lg,
                    borderRadius: BORDER_RADIUS.xl,
                    background: paymentMethod === method ? `${COLORS.indigo}15` : COLORS.lightBg,
                    border: `2px solid ${paymentMethod === method ? COLORS.indigo : COLORS.lightBorder}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: BORDER_RADIUS.lg,
                      background: paymentMethod === method ? COLORS.indigo : COLORS.lightBorder,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {method === "cash" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === method ? COLORS.white : COLORS.lightTextMuted} strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                    {method === "card" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === method ? COLORS.white : COLORS.lightTextMuted} strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    )}
                    {method === "other" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === method ? COLORS.white : COLORS.lightTextMuted} strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 16 }}>
                      {method === "cash" && "Naqd pul"}
                      {method === "card" && "Karta (UzCard/Humo/Visa/MC)"}
                      {method === "other" && "Boshqa (Click/Payme/Transfer)"}
                    </div>
                    {method === "cash" && (
                      <div style={{ fontSize: 12, color: COLORS.lightTextMuted }}>Avtomatik qaytim hisobi</div>
                    )}
                  </div>
                  {paymentMethod === method && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.indigo} strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            {paymentMethod === "cash" && (
              <div style={{ marginTop: SPACING.lg, padding: SPACING.md, background: COLORS.emerald + "15", borderRadius: BORDER_RADIUS.lg, border: `1px solid ${COLORS.emerald}40` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: COLORS.lightTextMuted }}>Berilgan:</span>
                  <span style={{ fontWeight: FONT_WEIGHTS.bold }}>50 000 so'm</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: SPACING.xs }}>
                  <span style={{ color: COLORS.lightTextMuted }}>Qaytim:</span>
                  <span style={{ fontWeight: FONT_WEIGHTS.extrabold, fontSize: 18, color: COLORS.emerald }}>
                    {(50000 - displayTotal).toLocaleString()} so'm
                  </span>
                </div>
              </div>
            )}
            <button
              style={{
                marginTop: SPACING.xl,
                width: "100%",
                padding: SPACING.lg,
                borderRadius: BORDER_RADIUS.xl,
                background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.indigoDark})`,
                border: "none",
                color: COLORS.white,
                fontSize: 18,
                fontWeight: FONT_WEIGHTS.bold,
                fontFamily: FONTS.inter,
                cursor: "pointer",
                boxShadow: SHADOWS.glowStrong,
              }}
            >
              {paymentMethod === "cash" ? "To'lovni yakunlash va chek chop etish" : "To'lovni yakunlash"}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Animation */}
      {showReceipt && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              width: 320,
              background: COLORS.white,
              borderRadius: BORDER_RADIUS.xl,
              padding: SPACING.lg,
              boxShadow: SHADOWS.xl,
              fontFamily: "'Courier New', monospace",
              fontSize: 12,
              lineHeight: 1.6,
              color: COLORS.black,
              animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: SPACING.md }}>
              <div style={{ fontWeight: FONT_WEIGHTS.bold, fontSize: 16, color: COLORS.indigo }}>MaxPOS</div>
              <div style={{ fontSize: 10, color: COLORS.lightTextMuted, marginTop: 2 }}>Kassa cheki #001234</div>
              <div style={{ fontSize: 10, color: COLORS.lightTextMuted, marginTop: 2 }}>12.09.2026 14:32:15</div>
            </div>
            <div style={{ borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", paddingVertical: SPACING.md }}>
              {CART_ITEMS.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: SPACING.xs }}>
                  <span>{item.name} x{item.cartQty}</span>
                  <span>{(item.price * item.cartQty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: FONT_WEIGHTS.bold, fontSize: 14, marginTop: SPACING.md }}>
              <span>JAMI:</span>
              <span>{displayTotal.toLocaleString()} so'm</span>
            </div>
            <div style={{ textAlign: "center", marginTop: SPACING.lg, fontSize: 10, color: COLORS.lightTextMuted }}>
              Rahmat! Yana kutamiz!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}