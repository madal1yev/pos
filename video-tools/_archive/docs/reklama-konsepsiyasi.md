# MaxPOS — Reklama video konsepsiyasi (TikTok / Reels / Shorts)

> **Manba:** Ushbu hujjatdagi har bir funksiya, matn va dizayn elementi **MaxPOS ilovasining real kodi**dan olingan
> (`frontend/src/pages/*`, `frontend/src/utils/uzbek.js`, `frontend/src/index.css`). Hech narsa o'ylab topilmagan.
> Sahna tavsiflaridagi ekranlar haqiqiy ilovadan yozib olinadi (qarang: «Texnik eslatmalar»).

---

## 1-BOSQICH — Sayt tahlili (xulosa)

### Sayt nima qiladi va qanday muammoni hal qiladi
MaxPOS — kichik va o'rta do'konlar (oziq-ovqat, retail) uchun **yagona kassa (POS) va ombor boshqaruv tizimi**.
Daftar hisobi, qo'lda qaytim hisoblash, yo'qolib qoladigan cheklar va omborni ko'z bilan kuzatish muammosini hal qiladi.
Bitta tizimda: sotuv, ombor, qarzdorlar, hisobotlar va smena nazorati.

### Asosiy funksiyalar va ishlash logikasi (foydalanuvchi qadamlari)
1. **Login sahifasi** — «Tizimga kirish» yoki «Ro'yxatdan o'tish» (akkaunt yaratish), «Xavfsiz va ishonchli tizim» bloki, demo kirish (`admin@pos.uz`).
2. **Dashboard** — bugungi daromad, oylik tushum, jami mahsulotlar, ombor qiymati, «Kam qoldi», «Tugadi», oxirgi sotuvlar, TOP mahsulotlar.
3. **Kassa (POS)** — asosiy ish ekrani:
   - «Qidirish yoki skanerlash» — mahsulot qidirish yoki **shtrix-kodni skanerlash** (kamera yoki skaner klaviatura orqali);
   - «🔥 Bugungi hot-sotuvlar» — eng ko'p sotilgan mahsulotlarni bir bosishda savatga qo'shish;
   - miqdor tanlash (dona / kg / gram / litr / ml), kalkulyator;
   - savat: miqdorni +/-, **chegirma** (SALE belgisi), buyurtmani **saqlash** (ushlab turish);
   - **To'lov oynasi**: jami summa, soliq %, mijoz nomi, **promo-kod**, **yetkazib berish manzili**, to'lov usuli (**naqd / karta / boshqa**), tezkor pul tugmalari (1k–50k, «Aniq»), **avtomatik qaytim**;
   - sotuv yakunlangach — **chekni chop etish** (80 mm termal chek formati).
4. **Mahsulotlar** — qo'shish/tahrirlash, **shtrix-kod va QR generatsiya**, rasm (kamera), **omnaviy narx/zaxira yangilash**, **CSV import/eksport**, yorliqlar, kam zaxira belgilari.
5. **Sotuvlar** — tarix, sana/to'lov usuli bo'yicha filtr, chekni ko'rish va chop etish, **qaytarish** (return).
6. **Hisobotlar** — kunlik/oylik sotuvlar, TOP sotilganlar, to'lov usullari (diagrammalar), ombor hisoboti, foyda/zarar.
7. **Qarzdorlar** — mijozlar ro'yxati, qarz miqdori va jami qarz. **Yetkazib beruvchilar** — alohida boshqaruv.
8. **Chegirmalar** — chegirmalar + **promo-kodlar** (masalan `BONUS10`).
9. **Smenalar** — smena ochish/yopish, ochilish va yopilish kassasi, kutilgan kassa, farqni hisoblash.
10. **Sozlamalar** — do'kon ma'lumotlari, valyuta va soliq %, chek sozlamalari, kam zaxira chegarasi, **baza zaxira nusxasi** (backup, JSON fayl yuklab olish).

### Interfeys (UI/UX)
- Asosiy rang: **indigo (#6366f1)**, fonda och kulrang (#f7f7fb), karta elementlar `rounded-2xl`, yumshoq soyalar, indigo→ko'k gradientlar.
- Shrift: **Inter** (300–800), katta qalin sarlavhalar.
- **Yorug'/tun (dark) rejim** ikki yoqlama — interfeys har ikki rejimda to'liq ishlaydi.
- **3 til**: o'zbek, rus, ingliz; valyuta formatlash (`1 234 567 so'm`).
- Mobil/planshet uchun moslashuvchan: katta bosish maydonlari, quyi panel, `safe-area`.
- **PWA** — saytni telefonga «ilova sifatida» o'rnatish mumkin.
- Tovushlar: muvaffaqiyat, skanerlash, yangi buyurtma ovozlari.

### Target auditoriya
Kichik va o'rta do'kon egasi/direktori, kassirlar, omborchi — Uzbekistondagi oziq-ovqat va retail savdo nuqtalari.
Reklama tilida bu: **«do'koningizni bitta tizimda boshqaring»**.

### Eng kuchli 3 ta afzallik
1. **Hammasi bitta joyda** — kassa + ombor + qarzdorlar + hisobotlar + smenalar, real vaqtda.
2. **Tez sotuv** — skaner + hot-sotuvlar + tezkor pul tugmalari + avtomatik qaytim + bir zumda chek.
3. **To'liq nazorat** — dashboard daromad, «kam qoldi» ogohlantirishi, baza zaxira nusxasi, smena nazorati.

### Zaif joylar (reklamada ishlatilmaydi, faqat tushunarli bo'lishi uchun)
- Alohida landing sahifa yo'q — ilovaning o'zi «sayt»; barcha sahifalar login ortida.
- Ba'zi UI matnlar qisman faqat o'zbekcha (rus/ingliz rejimda hammasi tarjima qilinmagan).
- Bo'sh baza bilan ekranlar «bo'sh» ko'rinadi — reklama uchun demo ma'lumotlar kerak.

---

## 2-BOSQICH — Reklama konsepsiyasi

### Maqsad
Tomoshabinga birinchi soniyalardan «qo'lda hisob-kitob — yo'qotilgan pul» degan muammoni ko'rsatib,
**MaxPOS ilovasining real ekranlari orqali** yechimni chiroyli animatsiya bilan namoyish qilish
va «bu menga kerak» degan istak uyg'otish. Yakunda — harakatga chaqiruv (CTA).

### Video metadata
| Parametr | Qiymat |
|---|---|
| Davomiylik | **26 soniya** |
| Format | **9:16 vertical** — 1080×1920 (TikTok / Reels / Shorts) |
| Qahramon | Real ilova (haqiqiy ekranlar, demo data bilan) |
| Til | O'zbek (voice-over + ekran matnlari) |
| FPS / sifat | 60 fps, 1080p |

### Sahna xaritasi
| Vaqt | Sahna | Vazifa |
|---|---|---|
| 0:00–0:03 | HOOK | Diqqatni tortish |
| 0:03–0:08 | Muammo | Ehtiyojni ko'rsatish |
| 0:08–0:15 | Yechim | Kassa ishi (real interfeys) |
| 0:15–0:21 | Afzalliklar | Tez montaj + foydalar |
| 0:21–0:26 | CTA | Harakatga chaqiruv |

---

### SAHNA 1 — HOOK (0:00–0:03)

**Vizual:** Qorong'i fon (#0f172a) ustida katta oq-indigo matn portlaydi: **«QANCHA PUL YO'QOTYAPSIZ?»**.
Orqa planda kassadagi shovqin, navbat, chalkash hisob-kitob kadrlari — juda tez (0.3s) kesimlar, har biriga yorqin indigo "flash".
So'nggi kadrda ilovaning kassa ekraniga zoom-in.

**Qaysi funksiya/sahifa:** Ilovaning **Kassa (POS)** sahifasi — mahsulot panellari, qidiruv va skaner tugmasi ko'rinadi.

**Animatsiya/transition:** Katta matn "scale + fade" bilan keladi, harf-harf emas — butun so'z, kuchli **impact** animatsiya; sahnalar orasi **whoosh**.
Muhim tugmalarga **glow** (yashil indigo nur) beriladi.

**Ekran matni:** `QANCHA PUL YO'QOTYAPSIZ?` (katta, qalin, markazda)

**Voice-over:** "Kassada navbat, daftarda hisob-kitob… qancha pul yo'qotyapsiz?"

**Sound:** Kuchli **whoosh** (0:00), **impact/bass drop** (0:00.5), **pop** (0:01, matn), qisqa "flash" swooshlar.

---

### SAHNA 2 — MUAMMO (0:03–0:08)

**Vizual:** Daftar va qo'lda yozilgan cheklar tasviri (stock yoki real sahna) → asta-sekin qorong'ilashadi, ustiga sariq-amber ogohlantirish chiziqlari chiqadi:
`Daftar hisobi o'tmishda`. Pastda 3 ta "chip" ketma-ket paydo bo'ladi: **Navbat**, **Xato hisob**, **Yo'qolgan cheklar** — har biri chiqqanda qisqa "tik" tovushi.

**Animatsiya/transition:** Muammo matnlari yuqoridan slide-in; chiplar pastdan **stagger** (0.15s oralig'ida) ko'tariladi; 0:08 da **zoom-out** orqali muammo "o'chadi" va ilova "porlaydi".

**Ekran matnlari:** `Daftar hisobi o'tmishda` → chiplar: `Navbat`, `Xato hisob`, `Yo'qolgan cheklar`

**Voice-over:** "Oddiy daftar endi yetmaydi. Do'koningizga kerak — yagona kassa va ombor tizimi."

**Sound:** Qog'oz shitirlashi (0:03), kulgili "mismatch" notasi (0:04), **tick** ×3 (chiplar), **whoosh** (0:08).

---

### SAHNA 3 — YECHIM: KASSA ISHI (0:08–0:15)

**Vizual:** Telefon ramkasida (3D mockup) ilovaning **Kassa** sahifasi to'liq ko'rinadi — yorug' rejimda, demo data bilan. Ketma-ketlik:

| Vaqt | Nima ko'rinadi (real funksiya) |
|---|---|
| 0:08–0:10 | **«Qidirish yoki skanerlash»** paneli — skaner tugmasi bosiladi, kamera rejimi ochiladi, shtrix-kod "tutiladi" (zoom + yashil glow) |
| 0:10–0:12 | Mahsulot **savatga qo'shiladi** (pop animatsiya), miqdor +, chegirma (SALE) |
| 0:12–0:14 | **To'lov oynasi**: naqd tanlanadi, tezkor pul tugmasi bosiladi, **Qaytim** avtomatik ko'rinadi |
| 0:14–0:15 | **Chek chop etiladi** (termal chek real ko'rinishda) |

**Animatsiya/transition:** Har bir bosishda kursor/matn emas — **glow ring + zoom** ishlatiladi: bosilayotgan tugma 1.2× zoom bo'lib, atrofi indigo nur bilan yoritiladi. Skaner chizig'i to'g'ri chiziq bo'ylab harakatlanadi. Chek chiqqanda "printer" tovushi va qog'oz chiqish animatsiyasi.

**Ekran matnlari:** `1 skaner — 1 soniya` (0:08) → `Qaytim avtomatik` (0:12) → `Chek bir zumda` (0:14)

**Voice-over:** "MaxPOS. Mahsulotni skanerlang, savatga qo'shing, to'lovni yakunlang — qaytimni o'zi hisoblaydi."

**Sound:** Skaner **beep** (0:09), **pop** (0:10, savatga qo'shish), kassa **cha-ching** / notification **ding** (0:13), **printer** tovushi (0:14).

---

### SAHNA 4 — AFZALLIKLAR MONTAJI (0:15–0:21)

**Vizual:** Tez (har ~1.2s) kesimlar — har kesimda ilovaning boshqa sahifasi, pastki qismida yashil belgi `✓` va qisqa matn:

| Vaqt | Sahifa (real) | Ekran matni |
|---|---|---|
| 0:15–0:16.5 | **Dashboard** — bugungi daromad katta raqam, oylik tushum kartalari | `Daromad real vaqtda` |
| 0:16.5–0:18 | **Ombor / Mahsulotlar** — «Kam qoldi» va «Tugadi» ogohlantirishlari, zaxira ko'rsatkichlari | `Kam qolgan — ko'z oldingizda` |
| 0:18–0:19.5 | **Hisobotlar** — kunlik sotuv diagrammasi, to'lov usullari charti | `Hisobotlar bir tugmada` |
| 0:19.5–0:21 | **Qarzdorlar** + **Smenalar** + **Zaxira nusxa** (ketma-ket, har biri 0.5s) | `Qarzdorlar, smenalar, backup` |

**Animatsiya/transition:** Har kesimda **zoom-out + whoosh**; chiplar **slide-up**; sahifa nomlari pastda kichik "pilla" (badge) ko'rinishida. Barcha raqamlar "count-up" animatsiyasi bilan hisoblanadi (0 dan qiymatgacha).

**Ekran matnlari:** `Daromad real vaqtda` → `Kam qolgan — ko'z oldingizda` → `Hisobotlar bir tugmada` → `Qarzdorlar · Smenalar · Backup`

**Voice-over:** "Chek bir zumda chop etiladi. Daromad, ombor, qarzdorlar va hisobotlar — real vaqtda."

**Sound:** Har kesimda **whoosh** (qisqa), chiplarda **tick**, raqam count-up da **tick-tick-tick**, 0:20 da **riser** (CTA ga tayyorgarlik).

---

### SAHNA 5 — CTA (0:21–0:26)

**Vizual:** Ilova kadri yumshoq **zoom-out** qilib kengayadi, fon indigo gradientga aylanadi (indigo→ko'k, tizimda ishlatilgan gradientlar uslubida). Markazda logotip belgisi (do'kon ikonkasi, indigo kvadrat) + katta matn: **`MaxPOS`**. Ostida oq tugma ko'rinishidagi matn: **`Bugun boshlang →`**. Pastda (xavfsiz zona ichida) kichik: `Kassa · Ombor · Qarzdorlar · Hisobotlar` (3 til rejimi eslatmasi bilan: O'zbek · Русский · English).

**Animatsiya/transition:** Logotip **scale-in + sparkle**, tugma 0.3s oralig'ida **pulse** qiladi (diqqatni tortish), matn **fade-up** bilan keladi.

**Ekran matnlari:** `MaxPOS` → `Bugun boshlang →` → `Kassa · Ombor · Qarzdorlar · Hisobotlar`

**Voice-over:** "MaxPOS — do'koningiz bitta tizimda. Bugun boshlang!"

**Sound:** **Impact/sting** (0:21), **sparkle** (0:22), oxirgi tugma **click**.

---

## Voice-over — to'liq matn (o'qishga tayyor)

> **0:00–0:03** — "Kassada navbat, daftarda hisob-kitob… qancha pul yo'qotyapsiz?"
>
> **0:03–0:08** — "Oddiy daftar endi yetmaydi. Do'koningizga kerak — yagona kassa va ombor tizimi."
>
> **0:08–0:15** — "MaxPOS. Mahsulotni skanerlang, savatga qo'shing, to'lovni yakunlang — qaytimni o'zi hisoblaydi."
>
> **0:15–0:21** — "Chek bir zumda chop etiladi. Daromad, ombor, qarzdorlar va hisobotlar — real vaqtda."
>
> **0:21–0:26** — "MaxPOS — do'koningiz bitta tizimda. Bugun boshlang!"

**Ovoz xarakteri:** erkak/yosh professional diktor, tez emas — aniq, ishonchli, "energetik-loyqa" (upbeat-corporate) ohang. Har bir jumla oxirida baland nota pasayishi yo'q — barqaror ishonch toni.

---

## Ekran matnlari — to'plam (har sahna uchun)

| Sahna | Vaqt | Matn |
|---|---|---|
| 1 | 0:00–0:03 | **QANCHA PUL YO'QOTYAPSIZ?** |
| 2 | 0:03–0:08 | Daftar hisobi o'tmishda → Navbat / Xato hisob / Yo'qolgan cheklar |
| 3 | 0:08–0:15 | 1 skaner — 1 soniya → Qaytim avtomatik → Chek bir zumda |
| 4 | 0:15–0:21 | Daromad real vaqtda / Kam qolgan — ko'z oldingizda / Hisobotlar bir tugmada / Qarzdorlar · Smenalar · Backup |
| 5 | 0:21–0:26 | MaxPOS → **Bugun boshlang →** / Kassa · Ombor · Qarzdorlar · Hisobotlar |

Matnlar katta, qalin, **Inter** shrifti (tizimdagi shrift), oq yoki indigo rangda; fon kontrasti uchun yarim shaffof qorong'i "blur" pilla orqasida.

---

## Sound effects — ro'yxat

| Vaqt | Effekt | Manba |
|---|---|---|
| 0:00 | Kuchli whoosh + bass impact | Hook ochilishi |
| 0:01 | Pop | Hook matni |
| 0:03 | Qog'oz shitirlashi / whoosh | Muammo sahna |
| 0:04 | "Mismatch" notasi | Muammo ta'kid |
| 0:05–0:07 | Tick ×3 | Chiplar |
| 0:08 | Whoosh (katta) | Yechimga o'tish |
| 0:09 | Skaner beep | Shtrix-kod |
| 0:10 | Pop | Savatga qo'shish |
| 0:13 | Cha-ching / ding | To'lov yakuni |
| 0:14 | Printer | Chek chiqishi |
| 0:15–0:20 | Whoosh (qisqa) ×5 + tick ×4 + riser | Montaj kesimlari, count-up |
| 0:21 | Impact/sting | CTA |
| 0:22 | Sparkle | Logotip |
| 0:25 | Click | Tugma |

---

## Fon musiqa tavsiyasi

- **Janr:** zamonaviy upbeat elektron / "corporate tech" — issiq sintezator va clap beat, afro-house/usulga moyil emas, toza va professional.
- **Tempo:** 120–126 BPM.
- **Tuzilishi:** 0:00–0:03 kuchli kirish (drop), 0:03–0:08 sokinroq (muammo), **0:08 da beat "yangi qavatga ko'tariladi"** (yechim), 0:15 da energiya oshadi, 0:21 da CTA uchun katta "lift" va yakun.
- **Qidiruv kalitlari:** "upbeat corporate technology", "energetic commercial", "positive electro pop".
- **Manbalar:** Envato Elements / Artlist (royalti), YouTube Audio Library, Pixabay Music (bepul).
- Ovoz balandligi: musiqa −12 dB atrofida, voice-over va sound effects ustun.

---

## Umumiy visual / style yo'nalishi

| Element | Tavsiya |
|---|---|
| Asosiy rang | **Indigo #6366f1** (tizim rangi) — barcha highlight, tugmalar, glow |
| Fon | Muammo sahnalari qorong'i (#0f172a), yechim sahnalari — ilovaning o'zi (yorug' rejim, aniqligi uchun) |
| Qo'shimcha ranglar | Amber/sariq (hot-sotuv, ogohlantirish), emerald/yashil (muvaffaqiyat: ✓, qaytim) |
| Shrift | **Inter** (tizimdagi shrift) — sarlavhalar 800 weight, matnlar 600–700 |
| Kayfiyat | Tez, zamonaviy, professional, ishonchli — "texnologiya pulni qaytaradi" |
| Ramka | Ilova 3D telefonda/planshetda (yumshoq soya, indigo nur), fon esa gradient |
| Vizuallar | Hech qanday to'liq sahifa "static" turmaydi — har doim zoom/glow/harakat |

---

## Texnik eslatmalar (suratga olish/montaj uchun)

1. **Real ilovadan yozib oling** — barcha ekranlar `frontend/` (local: `npm run dev` → `http://localhost:5173`) yoki deploy qilingan manzildan. Login: `admin@pos.uz` / `admin123` (seed ma'lumotlari bilan).
2. **Demo data tayyorlang** — oldindan 8–10 mahsulot (rasm, narx, zaxira), 2–3 mijoz/qarzdor, 1 ta promo-kod (`BONUS10`), kam qolgan mahsulot — Sahna 4 "Kam qoldi" ekrani aniq ko'rinsin.
3. **Sahna 3 ni yozish:** kamera skanerini ochish → shtrix-kodli mahsulotni skanerlash (kartonga bosilgan shtrix-kod ishlatish mumkin) → to'lov → chek. Bu qism bir «shot»da olinadi, montajda tezlashtiriladi.
4. **Rekord sifat:** 1080p, 60 fps (OBS yoki ekran yozish vositasi), telefon ramkasi keyingi montajda (green screen shart emas — kadrni toza kesish kifoya).
5. **Xavfsiz zonalar:** matnlar yuqoridan 20% va pastdan 25% (TikTok UI bloklari) ichida qolsin; asosiy harakat markazda.
6. **CTA manzili:** [SAYT MANZILI] o'rniga saytning asl havolasini qo'ying (logotip ostida yoki oxirgi kadrda 1.5s davomida). Kichik hajmda «O'zbek · Русский · English» — ko'p tilli rejim eslatmasi.
7. **Versiyalar:** asosiy versiyadan tashqari 15 soniyalik qisqa versiya (faqat HOOK + YECHIM + CTA) tayyorlash oson — sahnalar 1, 3, 5 ni ushlab qolish kifoya.
