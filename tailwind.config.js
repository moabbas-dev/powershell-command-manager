/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#0d1117',
          sidebar: '#161b22',
          surface: '#21262d',
          border: '#30363d',
          text: '#e6edf3',
          muted: '#7d8590'
        },
        status: {
          running: '#238636',
          'running-fg': '#3fb950',
          failed: '#da3633',
          'failed-fg': '#f85149',
          stopped: '#6e7681',
          completed: '#1f6feb',
          'completed-fg': '#58a6ff',
          starting: '#e3b341',
          'starting-fg': '#f0c25e'
        }
      },
      fontFamily: {
        mono: ["'Cascadia Code'", 'Consolas', "'Courier New'", 'monospace']
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
}
