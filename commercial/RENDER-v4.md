# MaxPOS Commercial v4 — Render & Export Workflow (40s, 9:16 + 16:9)

## 1. Tayyor holat (nimadan boshlaymiz)
- `shots/` — 13 ta real UI screenshot (01_login … 11_settings). v4 shularni ishlatadi, yangi shot shart emas.
- `video-tools/reklama/build_v3.js` — ffmpeg renderer (9:16 + 16:9, xfade 0.3s, drawtext). v4 — shu faylning kengaytmasi.
- `video-tools/reklama/reklama-9x16.mp4` / `reklama-16x9.mp4` — v3 (23.7s) tayyor. v4 = 40s, timeline `commercial/timeline-v4.json`.
- `video-tools/reklama/bgm_reklama.wav` — v3 musiqasi (qisqa). v4 uchun 40s lik yangisini generatsiya qilish kerak (2-bandga qarang).

## 2. Musiqa (40s, copyright-safe, o'zimiz generatsiya qilamiz)
`video-tools/make_audio.js` — 26s lik. 40s uchun nusxalab o'zgartiring:
- `DUR = 40`, akkord sikl Am–F–C–G takrorlanadi (har biri 4s).
- Riser: 28.0 → 29.2s (analytics→speed), ikkinchi riser 34.0 → 35.0s (speed→CTA).
- Clap 8.0s dan keyin to'liq groove (solution boshlanishi bilan).
- Render: `node make_audio_v4.js` → `commercial/bgm-v4.wav` (44.1kHz stereo).
- Alternativ (tayyor royalty-free): Pixabay/YouTube Audio Library — qidiruv: "upbeat corporate technology 120 BPM energetic commercial". VO ostida -12dB.

## 3. v3 → v4: build scriptda nima o'zgaradi
`build_v3.js` nusxasini `build_v4.js` qiling, faqat `timeline_v3` o'rniga `commercial/timeline-v4.json` ni o'qing:
- CLIPS soni 13 → 7 sahna (ichki beatlar match-cut, xfade faqat 6 chegara: hook→problem→solution→manage→analytics→speed→cta, XF=0.3s).
- Jami: 3+5+7+7+7+6+5 − 6×0.3 ≈ 38.2s + 0.5s end-hold + 1.3s head/tail padding = 40.0s.
- Font: `video-tools/font.ttf` (Inter). Ranglar: indigo `#4F46E5`, dark `#0F172A`, light `#F7F7FB`.
- 9:16 telefon ramkasi: v3 dagi `phone: {w:664,h:1180,x:208,y:470}` ni saqlang; 16:9 da `phone right + caption left` kompozitsiyani saqlang.

## 4. Render buyruqlari
```bash
cd video-tools/reklama
node make_audio_v4.js            # commercial/bgm-v4.wav (40s)
node build_v4.js                 # commercial/out-v4-9x16.mp4 + out-v4-16x9.mp4
```
Tekshirish:
```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 commercial/out-v4-9x16.mp4
# kutilgan: ~40.0
```

## 5. Remotion alternativi (motion-graphics versiya)
```bash
cd video-tools
npm run dev      # studio preview (VIDEO 1080x1920, 30fps — Root.tsx dagi duration ni 40*30=1200 ga ko'taring)
npm run build    # out/video.mp4 (H264 CRF18)
```
Scenes: HookScene / ProblemScene / KassaScene / DashboardScene / InventoryScene / ReportsScene / DebtorsScene / CTAScene mavjud — v4 uchun SpeedScene (FAST/SIMPLE/SMART/MODERN) qo'shing.

## 6. Export settings (final)
| Format | Rezolyutsiya | FPS | Video | Audio | Fayl |
|---|---|---|---|---|---|
| 9:16 | 1080×1920 | 30 | H.264 High, CRF 18–20, preset slow, yuv420p, ~12–15 Mbps | AAC 192k 48kHz | `MaxPOS-commercial-9x16.mp4` |
| 16:9 | 1920×1080 | 30 | H.264 High, CRF 18–20, preset slow, yuv420p, ~12–15 Mbps | AAC 192k 48kHz | `MaxPOS-commercial-16x9.mp4` |
| 15s cutdown | 1080×1920 | 30 | shu sozlama | shu | `MaxPOS-commercial-15s.mp4` (S1+S3+S7) |
- Captions: `commercial/captions-uz.srt` ni CapCut/Premiere da import qiling (xavfsiz zona: yuqoridan 20%, pastdan 25% ga matn qo'ymang).
- Voiceover: `commercial/voiceover-uz.txt` — ElevenLabs / native speaker, WAV 48kHz, -3dB peak, musiqa bilan ducking.

## 7. Yangi screenshot kerak bo'lsa (faqat real UI)
```bash
cd backend && npm run dev      # :5000
cd frontend && npm run dev     # :5173, login admin@pos.uz / admin123
```
OBS: 1080p 60fps, yorug' rejim (aniqlik uchun), demo data (8-10 mahsulot, 2 qarzdor, BONUS10 promo, 1 kam-qoldi mahsulot).

## 8. Qat'iy cheklovlar
- O'ylab topilgan feature, telefon, website, narx — TAQIQLANADI. CTA da faqat brand + tagline.
- UI ni deformatsiya qilmang, matn o'qilishi shart, transition lar mahsulotni ko'rsatishga xizmat qilsin.
