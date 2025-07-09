// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.resolve(__dirname, '../../../../'), '');

    return {
        envDir: path.resolve(__dirname, '../../../../'),
        plugins: [react()],
        server: {
            host: 'admin.localhost',
            port: 5175,
            proxy: {
                '/api': {
                    target: env.VITE_PROXY_URL,
                    changeOrigin: true
                }
            }
        },
        define: {
            global: 'globalThis',
            'crypto.getRandomValues': 'crypto.getRandomValues'
        },
        resolve: {
            alias: {
                crypto: 'crypto-browserify'
            },
            conditions: ['browser']
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