import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  const isVercel = !!process.env.VERCEL
  return {
    plugins: [react()],
    base: isVercel ? '/' : '/AniMesh/',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Shader bodies are pure data (no deps) — keep them in their own
            // chunk so app code (stores/renderer/UI) stays tiny and the data
            // chunk is cached independently while it changes rarely.
            // D21 full lazy import.meta.glob per-category split intentionally
            // deferred: 9 static importers + sync render/cache flow make the
            // ~90KB-gz first-load saving not worth the blank-library risk.
            if (id.includes('shaders/library') || id.includes('shaders/milkdrop-generated') ||
                id.includes('shaders/reactive-collection') || id.includes('shaders/heroes')) return 'shader-data'
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor'
            if (id.includes('node_modules/zustand')) return 'state'
            if (id.includes('node_modules/motion')) return 'motion'
          },
        },
      },
      target: 'es2020',
      minify: 'esbuild',
    },
    server: {
      port: 3000,
      host: true,
    },
  }
})
