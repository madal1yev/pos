import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW();
  },
  onOfflineReady() {
    console.log('Offline tayyor!');
  },
  onRegistrError(error) {
    console.error('SW xatosi:', error);
  },
});

export { updateSW };
