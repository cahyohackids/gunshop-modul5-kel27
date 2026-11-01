import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // icons too should come from the browser disk cache, not the SW precache
      includeManifestIcons: false,
      devOptions: { enabled: true },
      manifest: {
        name: 'Bore & Barrel',
        short_name: 'Bore & Barrel',
        description: 'A small armory — pistols, rifles, and shotguns.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f2f4f5',
        theme_color: '#f2f4f5',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // App shell only (JS/CSS/HTML) — images are NOT handled by the service
        // worker, so the browser serves them from its HTTP cache: DevTools shows
        // "(disk cache)" / "(memory cache)" (Cache-Control set in vercel.json
        // and on Supabase Storage uploads).
        globPatterns: ['**/*.{js,css,html,webmanifest}'],
        runtimeCaching: [
          {
            // API GETs: network first, cached copy only as an offline fallback.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && url.pathname.startsWith('/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200, 206] },
            },
          },
        ],
      },
    }),
  ],
})
