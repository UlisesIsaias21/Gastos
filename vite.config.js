import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo-u4.png'],
      manifest: {
        name: 'Admin · Lista & Gastos & Compras',
        short_name: 'Admin',
        description: 'Lista de compras y control de gastos',
        theme_color: '#07080b',
        background_color: '#07080b',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: '/logo-u4.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/logo-u4.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
