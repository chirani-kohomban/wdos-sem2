import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'data/*.json'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}']
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'Urban Harvest Hub',
        short_name: 'UHH',
        description: 'Urban Harvest Hub PWA',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
