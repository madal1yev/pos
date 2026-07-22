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
        NODE_ENV: 'development',
        PORT: 5000,
      },
    },
    {
      name: 'pos-frontend',
      cwd: './frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host',
      interpreter: 'node',
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
