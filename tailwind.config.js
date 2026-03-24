export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Shared Dynamic App Colors
                app: {
                    bg: 'var(--app-bg)',
                    card: 'var(--app-card)',
                    border: 'var(--app-border)',
                    text: 'var(--app-text)',
                    muted: 'var(--app-muted)',
                    accent: 'var(--app-accent)'
                }
            }
        },
    },
    plugins: [],
}
