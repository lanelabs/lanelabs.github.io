import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/tarron/bedtime-story-app/',
  build: {
    outDir: '../../docs/tarron/bedtime-story-app',
    emptyOutDir: true,
  },
});
