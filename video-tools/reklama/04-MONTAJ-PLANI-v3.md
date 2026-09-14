# MaxPOS — MONTAJ REJASI (v3, 20.1s)

> **Sahna:** 13 sahna | **O'tishlar:** 12 ta xfade (har biri 0.3s)
> **Final umumiy:** 20.10s | **FPS:** 30

---

## 1. SAHNA CHUQURLIGI (har bir sahna nima uchun shunday)

| # | Sahna | Chuqurlik | Nima uchun |
|---|---|---|---|
| 1 | HOOK | Indigo logotip + pill „Savdo·Ombor·Nazorat" | 1.9s — brend aniqlash; pill = nimani boshqaradi |
| 2 | P1 | Qorong'i fon + katta „Cheklar yo'qoladi." | Muammo #1 — savdo nuqtasidagi real og'riq |
| 3 | P2 | „Qarzlar adashadi." | Muammo #2 — hisob-kitob muammosi |
| 4 | P3 | „Vaqt qaytmaydi." | Muammo #3 — vaqt yo'qotish |
| 5 | S1 | Telefon + skaner + „Skanerlang." | Yechim: birinchi qadam — shtrix/QR o'qish |
| 6 | S2 | Telefon + savat + „Savatga qo'shing." | Yechim: savatga qo'shish, chegirma |
| 7 | S3 | Telefon + to'lov + „To'lov — bir zumda." | Yechim: to'lov — naqd/karta/avto |
| 8 | S4 | Telefon + chek + „Chek — avtomatik." | Yechim: avtomatik chek chiqish |
| 9 | M1 | Telefon + mahsulotlar + „Mahsulotlaringiz." | Boshqaruv: inventar, barcode, CSV |
| 10 | M2 | Telefon + qarzdorlar + „Qarzdorlar va smenalar." | Boshqaruv: hisob-kitob |
| 11 | A1 | Qorong'i fon + dashboard + „Daromad — real vaqtda." | Analitika — qorong'i fon ajratadi |
| 12 | A2 | **Jonli diagramma** (7 ustun o'sadi) + „Har bir so'm — nazoratda." | "Wow" effekt — qo'shimcha vizual |
| 13 | CTA | MaxPOS + „Biznesingizni zamonaviy boshqaring." + pill + 3 til | Yakuniy chaqiriq |

---

## 2. O'TISHLAR REJASI (12 ta xfade)

```
HOOK ──smoothup──► P1 ──fade──► P2 ──fade──► P3 ──fade──► S1
S1 ──smoothright──► S2 ──smoothright──► S3 ──smoothright──► S4
S4 ──fade──► M1 ──fade──► M2 ──fade──► A1
A1 ──smoothright──► A2 ──smoothup──► CTA
```

### O'tish turlari va sabablari

| O'tish | Nima uchun | Joy |
|---|---|---|
| **smoothup** | Tepaga ko'tarish — yangi boshlanish (optimizm) | HOOK→P1, A2→CTA |
| **fade** | Yumshoq o'tish — o'xshash sahnalar orasida | P1→P2, P2→P3, P3→S1, S4→M1, M1→M2, M2→A1 |
| **smoothright** | O'ngga siljish — oqim (savdo jarayoni) | S1→S2, S2→S3, S3→S4, A1→A2 |

### Vaqtlar (offset hisoblash)

```
hook:    0.000 → 2.200
p1:      1.900 → 3.600     (offset 1.900, xfade 0.3s)
p2:      3.300 → 5.000
p3:      4.700 → 6.400
s1:      6.100 → 7.900
s2:      7.600 → 9.400
s3:      9.100 → 10.900
s4:      10.600 → 12.400
m1:      12.100 → 14.000
m2:      13.700 → 15.600
a1:      15.300 → 17.100
a2:      16.800 → 18.000
cta:     17.700 → 20.100
```

---

## 3. VIZUAL TIZIM

### Rang palitrası

| Element | Yorug' sahna | Qorong'i sahna |
|---|---|---|
| Fon gradient | #FBFBFF → #E7EBF7 (pastga) | #10162E → #05070F (pastga) |
| Brend rang | #6366F1 (indigo) | #4F46E5 (indigo) |
| Asosiy matn | #0B1020 (qora) | #FFFFFF (oq) |
| Sub matn | #526078 (kulrang) | #C7D2FE (och indigo) |
| Pill badge | #6366F1 fon + oq matn | #4F46E5 fon + oq matn |
| Glow blob | #6366F1, 10% alpha | #4F46E5, 10% alpha |

### Tipografiya

| Element | 9:16 (px) | 16:9 (px) | Shirinlik |
|---|---|---|---|
| Hook/CTA wordmark | 150 | 190 | Bold, indigo |
| Katta matn (dark) | 88 | 116 | Bold, oq, soya bilan |
| Sarlavha (shot) | 66 | 92 | Bold, qora/oq |
| Sub text | 32 | 42 | Regular, kulrang |
| Chip/pill matn | 34 | 40 | Medium, oq |

### Telefon mockup

- **9:16:** 664×1180 px, x=208, y=470 — ekran markazda, burchak radiusi 13%
- **16:9:** 470×836 px, x=1310, y=122 — o'ng tomonda, chapda matn maydoni
- Harakat: `x += 10*sin(t*0.8)`, `y += 7*sin(t*1.05)` — yumshoq suzuvchi effekt
- Soya: yuqoridan 18px pastda, yumshoq (alpha 0.45, blur 40px)

### Glow blob

- Har doim ekranning o'ng yuqori qismida
- Harakat: `x += 80*sin(t*0.55)`, `y += 45*cos(t*0.45)` — juda sekin, sezilarli
- Alpha: 0.10 — seziladi, lekin ekranni bosib qo'ymaydi

---

## 4. RITM TABELYASI

```
BPM 100 → beat = 0.6s

|---2.2s---|---1.7s---|---1.7s---|---1.7s---|---1.8s---|---1.8s---|---1.8s---|---1.8s---|---1.9s---|---1.9s---|---1.8s---|---1.2s---|---2.4s---|
  HOOK        P1         P2         P3         S1         S2         S3         S4         M1         M2         A1         A2         CTA
    ▲           ▲                    ▲           ▲           ▲                    ▲           ▲                    ▲           ▲           ▲
  impact      whoosh               tick       beep        cha-ching           printer     tick                   tick      riser→impact  sparkle
```

Sahna = ~2.4-3.6 beat (oddiy uyquda qolish vaqti)
SFX = har sahna oxirida / boshida signal → ritmni ushlab turadi

---

## 5. EDITOR REJASI (Agar qo'lda tahrir kerak bo'lsa)

1. MP4 import → timeline
2. Bizning `build_v3.js` chiqargan MP4 → to'g'ridan-to'g'ri ishlatiladi
3. Qo'shimcha matn / ovoz kerak bo'lsa:
   - `voiceover.wav` qo'shish → `build_v3.js` avtomatik mixlaydi
   - Qo'shimcha tekst overlay → DaVinci Resolve / Premiere drawtext
4. Export: H.264, CRF 20, AAC 192k, faststart
