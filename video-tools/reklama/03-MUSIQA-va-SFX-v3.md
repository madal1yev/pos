# MaxPOS — MUSIQA & SFX (v3, 20.1s)

> **Manba:** `make_audio_v3.js` → `bgm_reklama.wav`
> **Format:** PCM 16-bit, 44100 Hz, stereo, ~20.10s

---

## 1. MUSIQA TUZILMASI

**BPM:** 100 (beat = 0.6s)
**Kalit:** A minor (Am – F – C – G)
**Uslub:** Premium-minimal (Apple/Stripe reklamasi tarzi)

### Qatlamlar

| Qatlam | Tavsif | Hajm |
|---|---|---|
| **Pad** | Am→F→C→G tsikli, har bir akkord 2.4s (3-4 shaklchali sine, slight detune) | 0.10 |
| **Bass** | A2→F2→C3→G2 ildiz notalar, har 0.6s takror (sub-harmonic) | 0.45 |
| **Kick** | Har 2-bet (0 beat), ~60Hz pitch bend down, 0.22s decay | 0.80 |
| **Clap** | 2/4 betlarda, band-limited noise + 180Hz body | 0.35 |
| **Hats** | Har 8th note (har 0.3s), closed, 0.045s | 0.12 |
| **Piano hook** | Hook sahnasida (0–1.9s) — A5→B5→C6→A5→G5 | 0.16 |
| **Piano CTA** | CTA sahnasida (17.7+) — E5→G5→A5→C6→E6 | 0.18 |

### Harmoniya tsikli

```
Am (A3+C4+E4) → F (F3+A3+C4) → C (C4+E4+G4) → G (G3+B3+D4)
| 2.4s        | 2.4s         | 2.4s         | 2.4s        |
```

---

## 2. SFX (Sahna bazasida)

Sahna boshlanishlari (final video vaqti):

| # | Vaqt (s) | SFX | Tavsif |
|---|---|---|---|
| 1 | 0.05 | **Impact** | Boshlanish (sub bass + noise, 0.55s) |
| 2 | 1.50 | **Sparkle** | Hook oxiri — porloq effekt (2.4–5.8kHz sweep, 0.8s) |
| 3 | 1.90 | **Whoosh** | P1 muammo — havo o'tishi (300→2500Hz, 0.5s) |
| 4 | 3.10 | **Tick** | P2 — qisqa signal (1600Hz, 0.035s) |
| 5 | 4.50 | **Tick** | P3 — qisqa signal |
| 6 | 5.90 | **Tick** | S1 oldi — signal |
| 7 | 6.10 | **Whoosh** | S1 yechim — o'tish |
| 8 | 6.50 | **Beep** | Qidirish skaneri (2200Hz, 0.06s) |
| 9 | 8.00 | **Tick** | Savat qo'shish |
| 10 | 9.60 | **Cha-ching** | To'lov — pul tushishi (880+1320Hz) |
| 11 | 11.10 | **Printer** | Chek chiqish (120Hz body + noise, 0.35s) |
| 12 | 12.10 | **Tick** | M1 mahsulotlar |
| 13 | 13.70 | **Tick** | M2 qarzdorlar |
| 14 | 15.30 | **Tick** | A1 dashboard |
| 15 | 16.00 | **Riser** | A2 oldidan — 250→3400Hz sweep (1.6s) |
| 16 | 17.70 | **Impact** | CTA — yakuniy kuchli (0.55s) |
| 17 | 19.10 | **Sparkle** | CTA oxiri — porloq yakun |

---

## 3. SIZNING OVOZ

`voiceover.wav` faylini `video-tools/reklama/` ga qo'ying:

```bash
node build_v3.js 9x16   # VO aralashtiriladi
```

Mix: `bgm` 0.85 + `VO` 1.0 → amix.

---

## 4. QAYTA YARATISH

```bash
cd video-tools/reklama
node make_audio_v3.js          # bgm_reklama.wav
node build_v3.js               # ikkala format (9:16 + 16:9)
node build_v3.js 9x16          # faqat 9:16
```

---

## 5. STEREO KENGAYTISH

- Chap kanal (L): asosiy mikslangan signal.
- O'ng kanal (R): L ning 300 namuna (≈6.8ms) kechiktirilgan versiyasi (0.95) + ozgina asosiy (0.05) — stereo effekt.
