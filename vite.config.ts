import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.VITE_GROK_API_KEY': JSON.stringify(env.VITE_GROK_API_KEY),
      '__GROK_API_KEY__': JSON.stringify(env.VITE_GROK_API_KEY || env.GROK_API_KEY || "MISSING_IN_CONFIG")
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
