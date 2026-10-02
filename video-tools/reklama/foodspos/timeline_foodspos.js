// timeline_foodspos.js — foodsPOS Instagram Reels (9:16, 1080x1920, 30fps, ~27.3s)
// Ssenariy: HOOK 0-3s / TRANSITION 3-5s / SHOWCASE 5-20s / PAYOFF 20-25s / CTA 25-30s
// Single source of truth for build_foodspos_reels.js va make_audio_foodspos.js.
'use strict';

const S = 'shots/';

const CLIPS = [
  // 1. HOOK (0-3s): qorong'u kadr, qizil X, katta savol
  {
    name: 'hook', kind: 'hook', dur: 3.0,
    big1: 'Hali ham qo‘lda',
    big2: 'hisob yuritasizmi?',
    sub: 'Qog‘oz chek · Sekin hisob · Xato',
  },

  // 2. TRANSITION (3-5s): wipe/glitch -> yorug' foodsPOS
  {
    name: 'wipe', kind: 'wipe', dur: 2.0,
    big: 'Muammo ortda qoldi',
    tag: 'foodsPOS — yorug‘ zamonaviy tizim',
  },

  // 3. MAIN SHOWCASE (5-20s): 6 x 2.5s jump cuts
  {
    name: 's_pos', kind: 'shot', dur: 2.5, file: S + '03_pos.png',
    big: 'Tezkor kassa', chip: 'Tezkor',
    sub: 'Mahsulot tanlash — soniyada',
  },
  {
    name: 's_prod', kind: 'shot', dur: 2.5, file: S + '10_products.png',
    big: 'Aniq ombor', chip: 'Aniq',
    sub: 'Kategoriya va kartochkalar tartibli',
  },
  {
    name: 's_rep', kind: 'chart', dur: 2.5,
    big: 'Real vaqtda hisobot', chip: 'Real vaqtda',
    sub: 'Grafik jonli chiziladi',
  },
  {
    name: 's_debt', kind: 'shot', dur: 2.5, file: S + '09_debtors.png',
    big: 'Mijozlar bazasi', chip: 'Har joyda',
    sub: 'Qarzdorlar to‘liq nazoratda',
  },
  {
    name: 's_tg1', kind: 'telegram', dur: 2.5, bot: 'client',
    big: 'Buyurtma — Telegramda', chip: 'Telegram',
    sub: '@foodsPOS_bot dan buyurtma keldi',
  },
  {
    name: 's_tg2', kind: 'telegram', dur: 2.5, bot: 'admin',
    big: 'Admin nazorati', chip: 'Nazorat',
    sub: '@klentlarchek_bot ga bildirishnoma',
  },

  // 4. EMOTIONAL PAYOFF (20-25s): climax
  {
    name: 'payoff', kind: 'shot', dur: 4.5, file: S + '02_dashboard.png',
    big: 'Tabassum bilan boshqaring', chip: 'Mamnun mijozlar',
    sub: 'To‘la do‘kon · Real daromad',
  },

  // 5. CTA / OUTRO (25-30s): logo bilan tugash (qora fade YO‘Q)
  {
    name: 'cta', kind: 'cta', dur: 5.0,
    brand: 'foodsPOS',
    tagline: 'biznesingiz uchun to‘liq yechim',
    button: 'Profilga o‘ting',
    contacts: '@foodsPOS_bot · @klentlarchek_bot',
  },
];

const TRANSITIONS = [
  'fade',       // hook -> wipe
  'smoothleft', // wipe -> s_pos (glitch/wipe hissi)
  'smoothleft', // s_pos -> s_prod
  'smoothleft', // s_prod -> s_rep
  'smoothleft', // s_rep -> s_debt
  'smoothleft', // s_debt -> s_tg1
  'fade',       // s_tg1 -> s_tg2 (telefon ichida almashish)
  'smoothup',   // s_tg2 -> payoff (climax ko'tarilish)
  'smoothup',   // payoff -> cta
];

const XF = 0.25;
const FPS = 30;

function computeOffsets() {
  const offs = [];
  let acc = CLIPS[0].dur;
  for (let i = 1; i < CLIPS.length; i++) {
    offs.push(acc - XF);
    acc += CLIPS[i].dur - XF;
  }
  return offs;
}

function totalDuration() {
  let t = CLIPS[0].dur;
  for (let i = 1; i < CLIPS.length; i++) t += CLIPS[i].dur - XF;
  return t;
}

function segmentStarts() {
  const offs = computeOffsets();
  return [0, ...offs];
}

module.exports = { CLIPS, TRANSITIONS, XF, FPS, computeOffsets, totalDuration, segmentStarts };
