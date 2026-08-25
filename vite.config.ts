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
          manualChunks: {
            vendor: ['react', 'react-dom'],
            state: ['zustand'],
            motion: ['motion'],
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
