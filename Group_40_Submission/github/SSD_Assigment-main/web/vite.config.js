import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Was nested inside `resolve`, where Vite silently ignores it, so the
  // exclusion never took effect. Moved to the top level.
  optimizeDeps: {
    exclude: ["jspdf", "jspdf-autotable"],
  },

  build: {
    // V-16: source maps would publish the entire readable frontend source -
    // including the auth flow and every role check - next to the bundle.
    sourcemap: false,
  },

  esbuild: {
    // V-16: strip console and debugger from production builds. The app logs
    // the full user object (src/pages/Report/Reports.jsx:93) and complete
    // invoices with customer PII (src/pages/Invoice/SalesHistory.jsx:1351).
    // Removing the calls at build time means that data cannot reach the
    // browser console on a shared shop terminal, while leaving the logging
    // available during development.
    drop: command === "build" ? ["console", "debugger"] : [],
  },

  // V-13: escapeHtml has a jsdom-backed regression suite that parses the
  // escaped output to prove the browser sees text, not elements.
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
  },

  server: {
    // Do not silently fall through to another port: if 5173 is taken, fail
    // loudly rather than serving the dev app on an origin that is not in the
    // API's CORS allow-list or Google's authorised redirect URIs.
    port: 5173,
    strictPort: true,
  },
}))
