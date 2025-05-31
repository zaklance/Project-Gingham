// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': {
                    target: 'http://127.0.0.1:5555',
                    changeOrigin: true
                }
            }
        },
        define: {
            'process.env.VITE_PROXY_URL': JSON.stringify(env.VITE_PROXY_URL),
            'global': 'globalThis',
            'crypto.getRandomValues': 'crypto.getRandomValues'
        },
        resolve: {
            alias: {
                crypto: 'crypto-browserify'
            }
        },
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: 'globalThis'
                }
            }
        }
    };
});