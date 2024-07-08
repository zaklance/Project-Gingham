// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.REACT_APP_MAP_KEY': JSON.stringify(process.env.REACT_APP_MAP_KEY)
  }
});