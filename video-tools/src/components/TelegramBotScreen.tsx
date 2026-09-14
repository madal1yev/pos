import React from "react";
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, FONT_WEIGHTS, FONTS } from "../utils/theme";

interface TelegramBotScreenProps {
  showClientBot?: boolean;
  showAdminBot?: boolean;
  messageProgress?: number;
}

export function TelegramBotScreen({ showClientBot = true, showAdminBot = true, messageProgress = 1 }: TelegramBotScreenProps) {
  const clientMessages = [
    { from: "client", text: "Salom! Buyurtma berishni xohlayman.", time: "14:23", status: "read" },
    { from: "bot", text: "Assalomu alaykum! MaxPOS botiga xush kelibsiz. Mahsulot tanlang:", time: "14:23", status: "sent", isBot: true },
    { from: "client", text: "Coca-Cola 1.5L - 2 dona", time: "14:24", status: "read" },
    { from: "bot", text: "✅ Coca-Cola 1.5L x 2 = 24 000 so'm qo'shildi. Yana nima kerak?", time: "14:24", status: "sent", isBot: true },
    { from: "client", "text": "Non (Obi) - 3 dona", time: "14:25", status: "read" },
    { from: "bot", text: "✅ Non (Obi) x 3 = 12 000 so'm. Jami: 36 000 so'm. Yetkazib berish manzilini yuboring:", time: "14:25", status: "sent", isBot: true },
    { from: "client", text: "📍 Chilonzor, 12-uy, 45-kv", time: "14:26", status: "read" },
    { from: "bot", text: "✅ Manzil qabul qilindi. To'lov usuli: Naqd / Karta / Click", time: "14:26", status: "sent", isBot: true },
    { from: "client", text: "Naqd", time: "14:27", status: "read" },
    { from: "bot", text: "✅ Buyurtma #1234 tasdiqlandi! Yetkazib berish: 30 daqiqa ichida. Rahmat!", time: "14:27", status: "sent", isBot: true },
  ];

  const adminMessages = [
    { from: "system", text: "🔔 YANGI BUYURTMA #1234", time: "14:27", type: "order" },
    { from: "system", text: "👤 Mijoz: Alijon Valiyev\n📍 Manzil: Chilonzor, 12-uy, 45-kv\n💰 Summa: 36 000 so'm\n💳 To'lov: Naqd\n📦 Mahsulotlar:\n  • Coca-Cola 1.5L x2\n  • Non (Obi) x3", time: "14:27", type: "detail" },
    { from: "admin", text: "✅ Qabul qilindi, yetkazib beruvchi yo'lda", time: "14:28", type: "reply" },
    { from: "system", text: "📋 Buyurtma holati: \"Tayyorlanmoqda\" → \"Yo'lda\"", time: "14:30", type: "status" },
    { from: "system", text: "✅ Yetkazib berildi. Mijoz to'ladi.", time: "14:55", type: "delivered" },
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
          background: `linear-gradient(135deg, #0088cc, #006699)`,
          color: COLORS.white,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: SPACING.md }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: BORDER_RADIUS.full,
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.953 8.603a.5.5 0 0 1-.22.095.538.538 0 0 1-.248-.108l-3.386-2.167a.5.5 0 0 0-.383.098L3.495 14.395a.5.5 0 1 1-.687-.953l3.744-4.583 3.214 2.642a.5.5 0 0 1 .157.655l-1.703 3.039a.5.5 0 0 1-.752.15l-3.082-2.605-3.502 4.228a.5.5 0 1 1-.823-.57l4.075-5.152-3.167-2.552a.5.5 0 0 1-.085-.61l1.729-2.759a.538.538 0 0 1 .433-.212.5.5 0 0 1 .22.095l4.265 3.019a.5.5 0 0 0 .734-.294l2.937-5.214a.5.5 0 1 1 .947.636z" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: FONT_WEIGHTS.extrabold }}>Telegram Bot Integratsiyasi</h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>@foodsPOS_bot • @klentlarchek_bot</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: SPACING.sm }}>
            <span
              style={{
                padding: `${SPACING.xs}px ${SPACING.sm}px`,
                borderRadius: BORDER_RADIUS.full,
                background: "rgba(255,255,255,0.2)",
                fontSize: 11,
                fontWeight: FONT_WEIGHTS.medium,
              }}
            >
              Mijoz boti
            </span>
            <span
              style={{
                padding: `${SPACING.xs}px ${SPACING.sm}px`,
                borderRadius: BORDER_RADIUS.full,
                background: "rgba(255,255,255,0.2)",
                fontSize: 11,
                fontWeight: FONT_WEIGHTS.medium,
              }}
            >
              Admin boti
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: SPACING.lg, flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACING.lg }}>
        {/* Client Bot */}
        {showClientBot && (
          <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: SPACING.md, borderBottom: `1px solid ${COLORS.lightBorder}`, background: "#e7f3ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: BORDER_RADIUS.full,
                    background: "linear-gradient(135deg, #0088cc, #006699)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.953 8.603a.5.5 0 0 1-.22.095.538.538 0 0 1-.248-.108l-3.386-2.167a.5.5 0 0 0-.383.098L3.495 14.395a.5.5 0 1 1-.687-.953l3.744-4.583 3.214 2.642a.5.5 0 0 1 .157.655l-1.703 3.039a.5.5 0 0 1-.752.15l-3.082-2.605-3.502 4.228a.5.5 0 1 1-.823-.57l4.075-5.152-3.167-2.552a.5.5 0 0 1-.085-.61l1.729-2.759a.538.538 0 0 1 .433-.212.5.5 0 0 1 .22.095l4.265 3.019a.5.5 0 0 0 .734-.294l2.937-5.214a.5.5 0 1 1 .947.636z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 14 }}>@foodsPOS_bot</div>
                  <div style={{ fontSize: 11, color: COLORS.emerald }}>● Onlayn</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: SPACING.md, display: "flex", flexDirection: "column", gap: SPACING.sm }}>
              {clientMessages.slice(0, Math.max(1, Math.floor(clientMessages.length * messageProgress))).map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
            </div>
            <div style={{ padding: SPACING.md, borderTop: `1px solid ${COLORS.lightBorder}`, background: COLORS.lightBg }}>
              <div style={{ display: "flex", gap: SPACING.sm }}>
                <input
                  type="text"
                  placeholder="Xabar yozing..."
                  style={{
                    flex: 1,
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: BORDER_RADIUS.full,
                    border: `1px solid ${COLORS.lightBorder}`,
                    background: COLORS.white,
                    fontSize: 13,
                    fontFamily: FONTS.inter,
                    outline: "none",
                  }}
                />
                <button style={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.full, background: "#0088cc", border: "none", color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Bot */}
        {showAdminBot && (
          <div style={{ background: COLORS.lightCard, borderRadius: BORDER_RADIUS.xl, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: SPACING.md, borderBottom: `1px solid ${COLORS.lightBorder}`, background: "#fff3e0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: BORDER_RADIUS.full,
                    background: "linear-gradient(135deg, #ff9800, #f57c00)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.099.12.112.224.083.345l-.333 1.36c-.053.22-.174.267-.401.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C5.575 21.407 8.907 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: FONT_WEIGHTS.semibold, fontSize: 14 }}>@klentlarchek_bot</div>
                  <div style={{ fontSize: 11, color: COLORS.emerald }}>● Admin paneli</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: SPACING.md, display: "flex", flexDirection: "column", gap: SPACING.sm }}>
              {adminMessages.slice(0, Math.max(1, Math.floor(adminMessages.length * messageProgress))).map((msg, i) => (
                <AdminMessage key={i} message={msg} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: typeof clientMessages[0] }) {
  const isBot = message.from === "bot" || message.isBot;
  const isClient = message.from === "client";

  if (isBot) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            maxWidth: "80%",
            padding: `${SPACING.sm}px ${SPACING.md}px`,
            borderRadius: `${BORDER_RADIUS.lg}px ${BORDER_RADIUS.lg}px ${BORDER_RADIUS.lg}px ${BORDER_RADIUS.sm}px`,
            background: "#e7f3ff",
            border: `1px solid #b3d7ff`,
            fontSize: 13,
            lineHeight: 1.5,
            color: COLORS.lightText,
            animation: "slideInLeft 0.3s ease",
          }}
        >
          {message.text}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 10, color: COLORS.lightTextMuted }}>
            <span>{message.time}</span>
            <span>{message.status === "read" ? "✓✓" : message.status === "sent" ? "✓" : "⏳"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div
        style={{
          maxWidth: "80%",
          padding: `${SPACING.sm}px ${SPACING.md}px`,
          borderRadius: `${BORDER_RADIUS.lg}px ${BORDER_RADIUS.lg}px ${BORDER_RADIUS.sm}px ${BORDER_RADIUS.lg}px`,
          background: "#0088cc",
          color: COLORS.white,
          fontSize: 13,
          lineHeight: 1.5,
          animation: "slideInRight 0.3s ease",
        }}
      >
        {message.text}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
          <span>{message.time}</span>
          <span>{message.status === "read" ? "✓✓" : "✓"}</span>
        </div>
      </div>
    </div>
  );
}

function AdminMessage({ message }: { message: typeof adminMessages[0] }) {
  const typeStyles: Record<string, React.CSSProperties> = {
    order: {
      background: "#fff3e0",
      border: `1px solid #ffcc80`,
      borderLeft: `4px solid ${COLORS.amber}`,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
    },
    detail: {
      background: COLORS.lightBg,
      border: `1px solid ${COLORS.lightBorder}`,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      fontFamily: "'Courier New', monospace",
      fontSize: 12,
      whiteSpace: "pre-line",
    },
    reply: {
      background: "#e8f5e9",
      border: `1px solid #a5d6a7`,
      borderLeft: `4px solid ${COLORS.emerald}`,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
    },
    status: {
      background: "#e3f2fd",
      border: `1px solid #90caf9`,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
    },
    delivered: {
      background: "#e8f5e9",
      border: `1px solid #a5d6a7`,
      borderLeft: `4px solid ${COLORS.emerald}`,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
    },
  };

  return (
    <div
      style={{
        ...typeStyles[message.type],
        fontSize: 13,
        lineHeight: 1.6,
        color: COLORS.lightText,
        animation: "slideInRight 0.3s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.xs, fontSize: 11, color: COLORS.lightTextMuted }}>
        <span>{message.from === "system" ? "🔔 Tizim" : "👨‍💼 Admin"}</span>
        <span>{message.time}</span>
      </div>
      {message.text}
    </div>
  );
}