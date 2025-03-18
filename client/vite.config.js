// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    // process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': {
                    target: 'http://127.0.0.1:5555'
                    // target: 'https://gingham-nyc.onrender.com'
                    // target: 'https://www.gingham.nyc'
                }
            }
        }, 
        define: {
            'process.env': env
        }
    };
});