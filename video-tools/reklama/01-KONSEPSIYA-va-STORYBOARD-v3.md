# MaxPOS — PREMIUM REKLAMA (v3) — KONSEPSIYA & STORYBOARD

> **USLOB:** Apple / Stripe — premium minimal
> **Davomiylik:** ~20.1 saniya | **Til:** O'zbek (3 til advertiment: O'zbek·Русский·English)
> **Formatlar:** `reklama-9x16.mp4` (1080×1920) + `reklama-16x9.mp4` (1920×1080) — 30fps, H.264
> **Manzil:** `video-tools/reklama/`

> ⚠️ **Haqiqiylik:** videodagi har bir funksiya MaxPOS kodi ichidan tekshirilgan
> (`frontend/src/pages/*`, `frontend/src/services/api.js`, `backend/src/routes/*`).
> Soxta ekran yoki mavjud bo'lmagan funksiya **yo'q**.

---

## 1. YO'L//DIRISH (nima uchun ayni shu uslub)

Instagram/Telegram kontent uchun **bir fikr = bir kadr**, katta va o'qiladigan matn,
qisqa (20s), tez ritm. Premium minimal (Apple reklamasi tamoyillari):

- Ko'p **oq/havo** — ekranni bezatib qo'ymaydi.
- **Katta qalin matn** — telefonda ham aniq o'qiladi.
- Har sahna uchun **bitta fikr** — ilova ekrani yonida bitta qisqa gap.
- **Indigo #4F46E5 / #6366F1** — tizimning brend rangi hamma kadrda.
- Yorug' va qorong'i fon **navbatlashadi** (ritm + diqqat).

---

## 2. AHOLI VA BENEFIT

**Kimga:** do'kon, kafe, bozor, hamyonbop savdo nuqtalari.

**Muammo (real):** qo'lda chek — yo'qoladi; qarzlar daftarda — adashadi; kuniga
savdoga ketadigan vaqt — qaytmaydi.

**Yechim (real):** skaner + bir zumda chek; qarzdorlar va smenalar tizimda;
daromad va hisobot real vaqtda; 3 til; PWA.

---

## 3. STORYBOARD (13 sahna, o'zbek)

Vaqtlar **final video** bo'yicha (xfade 0.3s bilan):

| # | Vaqt | Sahna | Ekran | Katta matn | Chip (yumshoq badge) | Ovoz/sfx |
|---|---|---|---|---|---|---|
| 1 | 0.00–1.90 | **HOOK** | logotip (indigo ikonka) | **MaxPOS** | Pill: „Savdo · Ombor · Nazorat" | impact+sparkle |
| 2 | 1.90–3.30 | **MUAMMO** | 🖤 qorong'i | **Cheklar yo'qoladi.** | — | whoosh |
| 3 | 3.30–4.70 | **MUAMMO** | qorong'i | **Qarzlar adashadi.** | — | tick |
| 4 | 4.70–6.10 | **MUAMMO** | qorong'i | **Vaqt qaytmaydi.** | — | tick |
| 5 | 6.10–7.60 | **YECHIM** | izlash `07_pos_search` | **Skanerlang.** | „Shtrix · QR kod" | beep |
| 6 | 7.60–9.10 | **YECHIM** | savat `04_cart` | **Savatga qo'shing.** | „Promo-kod · Chegirma" | tick |
| 7 | 9.10–10.60 | **YECHIM** | to'lov `05b_checkout` | **To'lov — bir zumda.** | „Naqd · Karta · Avto-qaytim" | cha-ching |
| 8 | 10.60–12.10 | **YECHIM** | chek `06_receipt` | **Chek — avtomatik.** | „80mm termal" | printer |
| 9 | 12.10–13.70 | **BOSHQARUV** | mahsulotlar `10_products` | **Mahsulotlaringiz.** | „Barcode · QR · CSV import" | tick |
| 10 | 13.70–15.30 | **BOSHQARUV** | qarzdorlar `09_debtors` | **Qarzdorlar va smenalar.** | „Hisob-kitob · Z-rapot" | tick |
| 11 | 15.30–16.80 | **ANALITIKA** | dashboard `02_dashboard` | **Daromad — real vaqtda.** | „Bugun · Hafta · Oy · Yil" | tick |
| 12 | 16.80–17.70 | **ANALITIKA («wow»)** | jonsiz **o'suvchi diagramma** (7 ta indigo ustun JS-da jonlanadi) | **Har bir so'm — nazoratda.** | — | riser |
| 13 | 17.70–20.10 | **CTA** | gradient | **MaxPOS** + „Biznesingizni zamonaviy boshqaring." | „Modern POS System" + „O'zbek·Русский·English" | impact+sparkle |

---

## 4. TRANSITION REJASI (12 xfade)

```
smoothup → fade/fade/fade → smoothright×3 → fade/fade/fade → smoothright → smoothup
```

- Muammo → yechim: **slideup** (yechim tepaga ko'tariladi, optimizm).
- Savdo jarayoni: **smoothright** (oqim, chapdan o'ngga "sotuv oqimi").
- Analitika → CTA: **smoothup** final yuksalish.

---

## 5. RANG / USLUB KODI

| Element | Qiymat |
|---|---|
| Yorug' fon (hook/yechim/cta) | #FBFBFF → #E7EBF7 vertikal gradient |
| Qorong'i fon (muammo/dashboard) | #10162E → #05070F |
| Brend (matn, diagramma, pill) | **#4F46E5 / #6366F1** |
| Bo'lim matni (sub) | #C7D2FE (qorong'ida) / #526078 (yorug'da) |
| Asosiy matn | #0B1020 (yorug') / #FFFFFF (qorong') |
| Soya | yumshoq drawtext shadow (dark sahnalar) |
| Glow blob | #6366F1 10% alpha, sin harakati bilan suzadi |
| Telefon ramkasi | yumaloq burchak (13%), soya + suzuvchi parallaks |

---

## 6. REAL FUNKSIYALAR XARITASI (kod = manba)

| Kadrda ko'rsatilgan | Kod manbai |
|---|---|
| Qidirish / skanerlash (kamerali shtrix·QR) | `frontend/src/pages/POS.jsx` (Html5Qrcode, search) |
| Savat + chegirma (SALE) + promo-kod | `frontend/src/pages/POS.jsx` `CartContext.jsx` |
| Naqd·Karta·Debt·Avto-qaytim + tez pul tugmalari | `frontend/src/pages/POS.jsx` (quick money, change) |
| 80mm termal chek | `frontend/src/pages/POS.jsx` (printReceipt) |
| Barcode/QR generatsiya + CSV import/eksport | `frontend/src/pages/Products.jsx` (JsBarcode, qrcode) |
| Qarzdorlar (debt) | `frontend/src/pages/Customers.jsx` |
| Smenalar + Z-rapot | `frontend/src/pages/Shifts.jsx` |
| Dashboard daromad bugun/hafta/oy/yil | `frontend/src/pages/Dashboard.jsx` |
| Hisobotlar (jonli diagramma) | `frontend/src/pages/Reports.jsx` |
| 3 til, PWA, indigo rang | `App.jsx`, `SettingsContext.jsx`, `vite.config.js` |

---

## 7. "WOW" ELEMENTLAR

1. **Jonli o'suvchi diagramma** (sahna 12) — 7 ta indigo ustun ease-out bilan o'sadi.
2. **Telefon «suzadi»** — ramkada yumshoq parallaks harakat (sin).
3. **Matn yumshoq kirishi** — hamma sarlavha alpha-fade (buritiq emas, premium).
4. **Glow blob** — interfeys orqasida suzuvchi indigo nur.
5. **Pill (badge)** — funksiyalar toza yumaloq tugmalar shaklida.
6. **Soxta ekran YO'Q** — barchasi real ekran; ishonch.

---

## 8. OLD (v1) DAN FARQI

| | v1 (eski) | v3 (yangisi) |
|---|---|---|
| Davomiylik | 36.75s (uzoq) | **20.1s** (Instagram/Telegram uchun) |
| Uslub | fonli skrinshot + katta box matn | **premium minimal**, ko'p havo, katta tipografika |
| Matn o'qilishi | box ustida, bezatgan | toza, kontrastli, chiroyli kirish |
| Ekran | xom skrinshot | yumaloq **telefon ramkasi + soya + parallaks** |
| Diagramma | yo'q | **jonli, o'suvchi** (wow) |
| Ovoz | oddiy beat | **ro'yxat bilan sinxron** premium SFX (ho'plov, cha-ching, printer, riser, sparkle) |