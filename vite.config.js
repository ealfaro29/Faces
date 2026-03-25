import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }))
    },
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
