import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('axios')) return 'vendor-http';
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
            return 'vendor-motion';
          }
          if (id.includes('recharts') || /[\\/]node_modules[\\/]d3-/.test(id)) {
            return 'vendor-charts';
          }
          if (id.includes('jspdf')) return 'vendor-jspdf';
          if (id.includes('html2canvas')) return 'vendor-html2canvas';
          if (id.includes('dompurify')) return 'vendor-purify';
          if (id.includes('qrcode')) return 'vendor-qrcode';
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
            return 'vendor-realtime';
          }
          return undefined;
        },
      },
    },
  },
});
