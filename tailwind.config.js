/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Estética Idotiza (ex VOCAL ULTRA-STUDIO) — fuente de verdad: skill ultra-studio + web idotiza
        white: '#f8f9fa',   // --us-canvas: fondo principal (nunca blanco puro)
        bone: '#f2efe7',    // --us-bone: papel / textura de tinta
        ink: '#0a0a0a',     // --us-ink: casi negro (topbar / displays)
        slate: {
          50: '#f8f9fa',   // --us-canvas
          100: '#edf1f5',
          200: '#e2e8f0',  // --us-grid: bordes / outlines inactivos
          300: '#ccd6e0',
          400: '#96a1b1',
          500: '#6c7686',
          600: '#5a6374',
          700: '#1a1a1a',  // --us-text
          800: '#121212',  // --us-dark
          900: '#0a0a0a',  // --us-display
          950: '#0a0a0a'
        },
        blue: {
          50: '#fdf3f3',
          100: '#fbe4e4',
          200: '#f6cbca',
          300: '#eda6a5',
          400: '#e47777',
          500: '#d93e3e',
          600: '#d32f2f',  // --us-accent: rojo de acento (activo / ON)
          700: '#b32929',
          800: '#8d2020',
          900: '#6b1818',
          950: '#3c0d0d'
        }
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', '"IBM Plex Mono"', 'monospace']
      }
    }
  },
  plugins: [],
}