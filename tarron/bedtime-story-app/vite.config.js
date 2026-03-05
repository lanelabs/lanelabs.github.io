import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/tarron/bedtime-story-app/',
  resolve: {
    alias: {
      '@data': path.resolve(__dirname, '../data'),
    },
  },
  build: {
    outDir: '../../docs/tarron/bedtime-story-app',
    emptyOutDir: true,
  },
});
