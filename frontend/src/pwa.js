import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Yangi versiya mavjud. Yangilashni xohlaysizmi?')) {
      updateSW();
    }
  },
  onOfflineReady() {
    console.log('Offline tayyor!');
  },
  onRegistrError(error) {
    console.error('SW xatosi:', error);
  },
});

export { updateSW };
