import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tarron/dwarfstead/',
  build: {
    outDir: '../../docs/tarron/dwarfstead',
    emptyOutDir: true,
  },
});
