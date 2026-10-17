import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// «base» relativa: la misma compilación sirve en GitHub Pages (/kumi/) y dentro de la app nativa.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: { globPatterns: ['**/*.{js,css,html,png,woff2,webmanifest}'], cacheId: 'kumi-app' },
    }),
  ],
  // Las pruebas de igualdad recorren cientos de restaurantes: necesitan más de los 5 s por defecto.
  test: { include: ['pruebas/**/*.test.ts'], testTimeout: 30000 },
});
