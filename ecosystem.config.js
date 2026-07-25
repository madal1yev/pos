// POS Tizimi - PM2 Ecosystem
// Backend frontendni ham serve qiladi (dist/build dan)
// Alohida Vite server kerak emas

module.exports = {
  apps: [
    {
      name: 'pos-backend',
      cwd: './backend',
      script: 'src/server.js',
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
