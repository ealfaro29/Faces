import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/', // Absolute paths for BrowserRouter on custom domain
    server: {
        proxy: {
            '/api/roblox': {
                target: 'https://thumbnails.roblox.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/roblox/, '')
            }
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});
