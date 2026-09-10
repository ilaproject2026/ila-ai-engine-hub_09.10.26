import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePluginSqlite } from './server/vitePluginSqlite.js';

export default defineConfig({
  plugins: [react(), vitePluginSqlite()],
  server: {
    port: 3000,
    strictPort: false, // Automatically tries next available port (3001, 3002...) if 3000 is in use
  },
  preview: {
    port: 3000,
    strictPort: false,
  },
});
