# MaxPOS — RENDER VA EKSPORT (v3, 20.1s)

> **Manbalar:** `build_v3.js` + `timeline_v3.js` + `make_audio_v3.js` + `gfx.js`
> **Chiqish:** `reklama-9x16.mp4` (1080×1920) + `reklama-16x9.mp4` (1920×1080)

---

## 1. TEKSIRISH

```bash
cd video-tools/reklama

# Barcha fayllar mavjudligini tekshiring:
ls -la gfx.js timeline_v3.js build_v3.js make_audio_v3.js bgm_reklama.wav
ls -la ../font.ttf

# Shots mavjudligini tekshiring:
ls ../../shots/07_pos_search.png ../../shots/04_cart.png ../../shots/05b_checkout.png ../../shots/06_receipt.png ../../shots/10_products.png ../../shots/09_debtors.png ../../shots/02_dashboard.png
```

---

## 2. TO'LIQ QAYTA YARATISH

```bash
cd video-tools/reklama

# 1. Musiqa + SFX (faqat kerak bo'lsa)
node make_audio_v3.js        # → bgm_reklama.wav (~20.1s)

# 2. Render (ikkala format)
node build_v3.js              # → reklama-16x9.mp4 + reklama-9x16.mp4

# Yoki faqat bitta format:
node build_v3.js 9x16         # faqat 9:16 (1080×1920)
node build_v3.js 16x9         # faqat 16:9 (1920×1080)
```

---

## 3. OVOZ QO'SHISH

Voiceover faylini `video-tools/reklama/voiceover.wav` ga qo'ying, keyin:

```bash
node build_v3.js              # avtomatik aralashtiradi (bgm 0.85 + vo 1.0)
```

---

## 4. FAYL TIZILMASI

```
video-tools/reklama/
├── gfx.js                    # PNG generator (gradient, pill, blob, phone mask, shadow, icon)
├── timeline_v3.js            # 13 sahna, xfade, computeOffsets/segmentTimes/totalDuration
├── build_v3.js               # Renderer (CLI: node build_v3.js [9x16] [16x9])
├── make_audio_v3.js          # Music + SFX generator → bgm_reklama.wav
├── bgm_reklama.wav           # Final music (20.1s, 44100Hz stereo)
├── reklama-9x16.mp4          # FINAL: 1080×1920, 30fps, H.264 High + AAC 192k
├── reklama-16x9.mp4          # FINAL: 1920×1080, 30fps, H.264 High + AAC 192k
├── tmp/                      # Vaqtinchalik fayllar (scene clips, chart frames, xfade scripts)
├── 01-KONSEPSIYA-va-STORYBOARD-v3.md
├── 02-VOICEOVER-SCRIPT-v3.md
├── 03-MUSIQA-va-SFX-v3.md
├── 04-MONTAJ-PLANI-v3.md
└── 05-RENDER-va-EKSPORT-v3.md
```

---

## 5. TEXNIK XUSUSIYATLAR

### Video

| Parametr | Qiymat |
|---|---|
| Format | MP4 (MPEG-4 Part 14) |
| Video codec | H.264 (libx264) |
| Preset | fast |
| CRF | 20 |
| Pixel format | yuv420p |
| FPS | 30 |
| Flags | +faststart (tez yuklash) |

### Audio

| Parametr | Qiymat |
|---|---|
| Codec | AAC |
| Bitrate | 192k |
| Sample rate | 44100 Hz (konvertatsiya) |
| Kanal | Stereo |

### Formatlar

| Format | O'lcham | Saqlanish joyi |
|---|---|---|
| 9:16 (Instagram Stories/Reels, TikTok) | 1080×1920 | `reklama-9x16.mp4` |
| 16:9 (YouTube, Telegram landscape) | 1920×1080 | `reklama-16x9.mp4` |

---

## 6. TEKSIRLASH (VERIFICATION)

```bash
#_duration
ffprobe -i reklama-9x16.mp4 -show_entries format=duration -v quiet -of csv="p=0"
# → 20.10

ffprobe -i reklama-16x9.mp4 -show_entries format=duration -v quiet -of csv="p=0"
# → 20.10

# Pixel stats (brightness sanity — light scenes should be ~150-220, dark ~15-30)
ffmpeg -ss 1 -i reklama-9x16.mp4 -frames:v 1 -vf signalstats -f null -
# → YAVG for hook scene (~219)

ffmpeg -ss 4 -i reklama-9x16.mp4 -frames:v 1 -vf signalstats -f null -
# → YAVG for dark problem scene (~29)

ffmpeg -ss 8 -i reklama-9x16.mp4 -frames:v 1 -vf signalstats -f null -
# → YAVG for solution shot scene (~221)
```

---

## 7. SOCIAL MEDIA SPEC

| Platform | Format | Davomiylik | Eslatma |
|---|---|---|---|
| Instagram Reels | 9:16 | 20.1s ✅ | Thumbnail: hook sahnasidan |
| Instagram Stories | 9:16 | 20.1s ✅ | 15s limit yo'q (Stories 60s gacha) |
| Telegram Video | 9:16 yoki 16:9 | 20.1s ✅ | Ikki format mavjud |
| TikTok | 9:16 | 20.1s ✅ | Trend musiqalar bilan aralashtirish mumkin |
| YouTube Shorts | 9:16 | 20.1s ✅ | |
| YouTube (normal) | 16:9 | 20.1s ✅ | |

---

## 8. TEGIRLAR QO'SHISH

Agar poster kerak bo'lsa (Instagram uchun):

```bash
# Hook sahnasidan 1-soniyadagi kadrdan poster
ffmpeg -ss 1 -i reklama-9x16.mp4 -frames:v 1 poster_hook.png
ffmpeg -ss 18 -i reklama-9x16.mp4 -frames:v 1 poster_cta.png
```

---

## 9. XATO LAR

| Xato | Yechim |
|---|---|
| `font.ttf topilmadi` | `video-tools/font.ttf` mavjudligini tekshiring |
| `shots/*.png topilmadi` | `../../shots/` papkasidagi fayllar mavjudligini tekshiring |
| `ffmpeg error` | ffmpeg-static mavjudligini tekshiring: `ls ../node_modules/ffmpeg-static/ffmpeg.exe` |
| `chart frames error` | `tmp/` papkasini tozalang: `rm -rf tmp && node build_v3.js` |
| Qora ekran (light sahna) | `gfx.js` yangilang: `bg_light` PNG to'g'ri yaratilganligini tekshiring |
