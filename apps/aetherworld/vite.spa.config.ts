import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({plugins:[tanstackRouter({target:"react",autoCodeSplitting:true,routesDirectory:path.resolve("src/routes"),generatedRouteTree:path.resolve("src/routeTree.gen.ts")}),react(),tailwindcss(),tsconfigPaths({projects:[path.resolve("tsconfig.json")]})],build:{outDir:"dist",emptyOutDir:true,chunkSizeWarningLimit:1400},resolve:{alias:{"@":path.resolve("src")}}});
