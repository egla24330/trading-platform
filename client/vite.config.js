/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/

export default defineConfig({

  
})


// client/vite.config.js


export default defineConfig({
  base: '/', // correct for serving at root
  plugins: [react(), tailwindcss(),],
  build: {
    outDir: '../backend/client-dist', // ✅ place dist in backend root
    emptyOutDir: true,
  },
});
*/


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
   plugins: [react(), tailwindcss(),],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false
      },
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true
      }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
