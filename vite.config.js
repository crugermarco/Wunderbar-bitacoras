import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/google-script': {
        target: 'https://script.google.com/macros/s/AKfycbyzq1D-H7v9IT3necFTTgUhGJ3bGqOB1G5f342Rh4Jey4mL6RFkBauYjdVBmyrjgz2Z/exec',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-script/, '/exec'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url);
          });
        }
      }
    }
  }
})