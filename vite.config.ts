import { defineConfig } from 'vite'

// GitHub Pages serves this project from /synch-pharma/.
// The base path must match the repo name so asset URLs resolve.
export default defineConfig({
  base: '/synch-pharma/',
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
  },
})
