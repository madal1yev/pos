import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {
    console.log('Offline tayyor!');
  },
  onRegistrError(error) {
    console.error('SW xatosi:', error);
  },
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      if (reg.active && reg.active.scriptURL.includes('workbox-')) {
        reg.update();
      }
    }
  });
}

export { updateSW };
