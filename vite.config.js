
import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // CRUCIAL: Usa rutas relativas para que funcione en GitHub Pages/subcarpetas
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
