import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    // Allow Cloudflare/ngrok/etc. tunnel hostnames when testing on a phone
    allowedHosts: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Service worker + precaching only for production builds
      disable: mode !== 'production',
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'Heart Rate Monitor',
        short_name: 'HR Monitor',
        description: 'Connect to a Bluetooth heart rate monitor and track workouts',
        theme_color: '#c41e3a',
        background_color: '#0f1419',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
}));
