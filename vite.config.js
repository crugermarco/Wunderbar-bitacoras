import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/google-script': {
        target: 'https://script.google.com/macros/s/AKfycbyzZuYw3IBC6w8-02-zMlU6QB3lImGtiWslPX86vn_Yi6pLJfMmdRMMq9Z4MWt-QrLn/exec',
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