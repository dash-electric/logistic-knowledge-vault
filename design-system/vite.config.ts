import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"

const kitSrc = fileURLToPath(new URL("./kit", import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The docs gallery imports the published package name; map it onto the
      // in-repo kit source so there is no build step and no second package.
      "@dash-electric/logistic-kit/lib/utils": `${kitSrc}/lib/utils.tsx`,
      "@dash-electric/logistic-kit": `${kitSrc}/index.tsx`,
    },
  },
  server: { port: 5180 },
})
