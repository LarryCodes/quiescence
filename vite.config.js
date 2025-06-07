import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = process.env.ELECTRON === 'true'
  
  return {
    base: isElectron ? './' : '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@styles': resolve(__dirname, './src/css'),
        '@utils': resolve(__dirname, './src/utils'),
        '@components': resolve(__dirname, './src/components'),
        '@assets': resolve(__dirname, './src/assets')
      }
    },
    server: {
      port: 5173,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        }
      }
    },
    define: {
      'process.env.ELECTRON': JSON.stringify(process.env.ELECTRON || 'false'),
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  }
})
