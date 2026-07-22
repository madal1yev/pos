import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Yangi versiya chiqishi bilan saytni yangilaymiz
    if (confirm('Saytning yangi versiyasi mavjud! Yangilansinmi?')) {
      updateSW(true).then(() => {
        window.location.reload();
      });
    }
  },
  onOfflineReady() {
    console.log('Offline tayyor!');
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Har safar yangi versiyani tekshirish
      setInterval(() => {
        registration.update();
      }, 60000);
    }
  },
  onRegistrError(error) {
    console.error('SW xatosi:', error);
  },
});

// Eski SW larni majburiy yangilash
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.update();
    }
  });
}

export { updateSW };
