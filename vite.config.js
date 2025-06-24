// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',                            // Explicitly set root
  plugins: [react()],
  build: {
    outDir: 'dist',                     // Default output
    rollupOptions: {
      input: './index.html',            // 👈 This line fixes the error
    },
  },
});
