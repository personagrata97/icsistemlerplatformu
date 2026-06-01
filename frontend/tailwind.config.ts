import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#009c45',
                    hover: '#007a36',
                },
                secondary: '#f3f4f6',
                danger: '#ef4444',
                warning: '#f59e0b',
                success: '#10b981',
                info: '#3b82f6',
            },
            fontFamily: {
                sans: ['var(--font-poppins)', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
export default config
