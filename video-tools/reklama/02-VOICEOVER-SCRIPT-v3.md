# MaxPOS — VOICEOVER SCRIPT (v3, 20.1s)

> **Til:** O'zbek | **Tempo:** ~2.5 so'z/soniya (sekin, tushunarli, lekin tez emas)
> **Ohang:** Professional, iliq, ishonchli. «Galati» emas — zamonaviy startup tarzi.

---

## OVUZ LAYNLARI (sahna bo'yicha)

### 1. HOOK (0.0–1.9s) — sukut
*Faqat musiqa + sparkle SFX. Gap yo'q.*

### 2. MUAMMO 1 (1.9–3.3s)
> **«Cheklar yo'qoladi. Har kuni — minglab so'm.»**

Ohang: og'ir, jiddiy.

### 3. MUAMMO 2 (3.3–4.7s)
> **«Qarzlar adashadi. Daftardagi raqamlar — ishonchsiz.»**

Ohang: xuddi shunday og'ir.

### 4. MUAMMO 3 (4.7–6.1s)
> **«Vaqt qaytmaydi. Har kuni — ikki soat.»**

Ohang: jiddiy, lekin biroz tezroq.

### 5. YECHIM 1 (6.1–7.6s)
> **«Skanerlang. Bir zumda.»**

Ohang: yorug', energiya boshlanadi.

### 6. YECHIM 2 (7.6–9.1s)
> **«Savatga qo'shing. Promo-kod, chegirma — hammasi shu yerda.»**

Ohang: tez, qiziqarli.

### 7. YECHIM 3 (9.1–10.6s)
> **«To'lov — bir zumda. Naqd, karta, avtomatik qaytim.»**

Ohang: ishonchli, tez.

### 8. YECHIM 4 (10.6–12.1s)
> **«Chek — avtomatik. 80 millimetrlik termal.»**

Ohang: sodda, tushunarli.

### 9. BOSHQARUV 1 (12.1–13.7s)
> **«Mahsulotlaringiz — barcode, QR, CSV import.»**

Ohang: kasbiy, tushuntirish.

### 10. BOSHQARUV 2 (13.7–15.3s)
> **«Qarzdorlar va smenalar — bir joyda.»**

Ohang: tizimli, ishonchli.

### 11. ANALITIKA (15.3–16.8s)
> **«Daromad — real vaqtda.»**

Ohang: kuchli, diqqat bilan.

### 12. WOW (16.8–17.7s)
> **«Har bir so'm — nazoratda.»**

Ohang: yakuniy, kuchli.

### 13. CTA (17.7–20.1s)
> **«MaxPOS. Biznesingizni zamonaviy boshqaring.»**

Ohang: yorug', ishonchli, yakuniy.

---

## OVUZ TEZLIGI

| Segment | So'zlar soni | Vaqt | Tezlik |
|---|---|---|---|
| Muammo (3 qator) | 18 so'z | 4.2s | ~4.3 so'z/s (sekin) |
| Yechim (4 qator) | 22 so'z | 6.0s | ~3.7 so'z/s (o'rtacha) |
| Boshqaruv (2 qator) | 12 so'z | 3.2s | ~3.8 so'z/s |
| Analitika (2 qator) | 8 so'z | 2.4s | ~3.3 so'z/s |
| CTA (1 qator) | 8 so'z | 2.4s | ~3.3 so'z/s |
| **JAMI** | **68 so'z** | **20.1s** | **~3.4 so'z/s** |

---

## OVUZ ARALASHTIRISH

`build_v3.js` avtomatik aralashtiradi:

```
[bgm_reklama.wav] → volume=0.85 → [music]
[voiceover.wav]   → volume=1.0  → [vocal]
[music][vocal] → amix → [aout]
```

---

## WAV FAYL TALABLARI

| Parametr | Qiymat |
|---|---|
| Format | PCM 16-bit |
| Sample rate | 44100 Hz |
| Kanallar | Mono yoki Stereo |
| Davomiylik | ~20.1s (voiceover.wav fayl) |
| Bitrate | ~705 kbps (16×44100×1) |

---

## VOICEOVER.QO'SHISH

1. `voiceover.wav` faylini `video-tools/reklama/` ga qo'ying.
2. `node build_v3.js` — avtomatik aralashtiradi.
3. Agar `voiceover.wav` yo'q bo'lsa — faqat musiqa bilan render qilinadi.

---

## QAYTA YOZISH

O'zgartirish kerak bo'lsa:

1. `voiceover.wav` ni qayta yozing (yuqoridagi matnlarga asosan).
2. `node build_v3.js` — qayta render.
3. Yoki matnni o'zgartiring: `build_v3.js` dagi `big:`, `sub:`, `tagline:`, `langs:` qiymatlarini tahrirlang.

---

## TEKSHIRISH

```bash
# Voiceover faylni tekshirish:
ffprobe -i voiceover.wav -show_entries stream=channels,sample_rate,duration -v quiet -of csv="p=0"
# → 1,44100,20.10 (yoki yaqin)
```
