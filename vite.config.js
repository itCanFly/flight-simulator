import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/home/sitcanplay/',

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu.html'),
        gameplay: resolve(__dirname, 'gameplay.html'),
      },
    },
  },
})