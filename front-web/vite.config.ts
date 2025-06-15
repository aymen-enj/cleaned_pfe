import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // <-- AJOUTEZ CETTE LIGNE

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // AJOUTEZ LE BLOC SUIVANT
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})