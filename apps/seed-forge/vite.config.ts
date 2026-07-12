import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "The Seed Engine · World Civilization Core",
        short_name: "Seed Engine",
        description: "A civilization-grade multi-universe operating system with fate simulation and AGI shell",
        theme_color: "#0ea5e9",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          {
            name: "Fate Simulator",
            short_name: "Game",
            description: "Launch the Fate Simulator game",
            url: "/control-center?tab=game",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "AGI Shell",
            short_name: "Shell",
            description: "Open the AGI Shell console",
            url: "/control-center?tab=agi",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // 开发环境不生成 SW
        disableDevLogs: true,
      },
      // 开发环境不注入 SW
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: [
      { find: "@/lib/ial", replacement: path.resolve(__dirname, "../../packages/intelligence/ial-compiler/src") },
      { find: "@/lib/ose", replacement: path.resolve(__dirname, "../../packages/intelligence/ose-reasoner/src") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
}));
