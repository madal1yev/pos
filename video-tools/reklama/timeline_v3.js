// timeline_v3.js — MaxPOS premium (Apple/Stripe minimal) commercial.
// 13 scenes, 12 xfade @ 0.3s. Total ≈ 23.4s.
// Single source of truth for build_v3.js and make_audio_v3.js.
'use strict';

const S = 'shots/';

const CLIPS = [
  // 1. HOOK — light, giant wordmark
  { name: 'hook', kind: 'hook', dur: 2.4, big: 'MaxPOS', tag: 'Savdo · Ombor · Nazorat' },

  // 2-4. PROBLEM — dark, minimal type beats
  { name: 'p1', kind: 'dark', dur: 2.0, big: 'Cheklar yo\u2018qoladi.', sub: 'Qo\u2018lda yozilgan cheklar — adashib ketadi.' },
  { name: 'p2', kind: 'dark', dur: 2.0, big: 'Qarzlar adashadi.', sub: 'Da\u2019ftardagi qarzlar — hech qayerdan topilmaydi.' },
  { name: 'p3', kind: 'dark', dur: 2.0, big: 'Vaqt qaytmaydi.', sub: 'Har kuni savdoga ketgan 2 soat — qaytmaydi.' },

  // 5-8. SOLUTION: SALE — light, phone + one big idea each
  { name: 's1', kind: 'shot', dur: 2.0, file: S + '07_pos_search.png', big: 'Skanerlang.', chip: 'Shtrix · QR kod' },
  { name: 's2', kind: 'shot', dur: 2.0, file: S + '04_cart.png', big: 'Savatga qo\u2018shing.', chip: 'Promo-kod · Chegirma' },
  { name: 's3', kind: 'shot', dur: 2.0, file: S + '05b_checkout.png', big: 'To\u2018lov — bir zumda.', chip: 'Naqd · Karta · Avto-qaytim' },
  { name: 's4', kind: 'shot', dur: 2.0, file: S + '06_receipt.png', big: 'Chek — avtomatik.', chip: '80mm termal' },

  // 9-10. MANAGEMENT — light, phone + statement
  { name: 'm1', kind: 'shot', dur: 2.1, file: S + '10_products.png', big: 'Mahsulotlaringiz.', chip: 'Barcode · QR · CSV import' },
  { name: 'm2', kind: 'shot', dur: 2.1, file: S + '09_debtors.png', big: 'Qarzdorlar va smenalar.', chip: 'Hisob-kitob · Z-rapot' },

  // 11. NAGTABAN — dashboard revenue (dark to set analytics apart)
  { name: 'a1', kind: 'shotdark', dur: 2.0, file: S + '02_dashboard.png', big: 'Daromad — real vaqtda.', chip: 'Bugun · Hafta · Oy · Yil' },

  // 12. ANIMATED ANALYTICS CARD — growing indigo bars
  { name: 'a2', kind: 'chart', dur: 1.6, big: 'Har bir so\u2018m — nazoratda.', sub: 'Sotuv tahlili jonli diagrammada' },

  // 13. CTA — light, indigo wordmark
  { name: 'cta', kind: 'cta', dur: 2.8, tagline: 'Biznesingizni zamonaviy boshqaring.', sub: 'Modern POS System', langs: 'O\u2018zbek · Русский · English' },
];

const TRANSITIONS = [
  'smoothup', // hook -> p1
  'fade', 'fade', 'fade', // p1->p2->p3->s1
  'smoothright', 'smoothright', 'smoothright', // s1->s2->s3->s4
  'fade', 'fade', 'fade', // s4->m1->m2->a1
  'smoothright', // a1 -> a2
  'smoothup', // a2 -> cta
];

const XF = 0.3;
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

function segmentTimes() {
  const offs = computeOffsets();
  let start = 0;
  const seg = [];
  for (let i = 0; i < CLIPS.length; i++) {
    const end = i < offs.length ? offs[i] + XF + CLIPS[i].dur : start + CLIPS[i].dur;
    seg.push({ clip: CLIPS[i].name, kind: CLIPS[i].kind, start, end });
    start = i < offs.length ? offs[i] : start;
  }
  return seg;
}

function segmentStarts() {
  const offs = computeOffsets();
  return [0, ...offs];
}

module.exports = { CLIPS, TRANSITIONS, XF, FPS, computeOffsets, totalDuration, segmentTimes, segmentStarts };