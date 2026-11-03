import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Expose the dev server on your LAN so you can open it from an iPhone on the same Wi-Fi.
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // mapbox-gl is ~1.6 MB on its own; keep it out of the app chunk so app edits cache well.
        manualChunks: { mapbox: ['mapbox-gl'] },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
});
