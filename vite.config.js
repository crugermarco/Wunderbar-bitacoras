import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/google-script': {
        target: 'https://script.google.com/macros/s/AKfycbyxLVMjHLZnd_8iMpCMs9_8Qly71JvMIXfw3A00ffi8mPbkjjm0ggFHABP5eLykTx2_/exec',
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