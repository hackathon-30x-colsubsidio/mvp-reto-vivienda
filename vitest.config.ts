import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const raiz = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // El alias "@/*" del tsconfig, a mano: vitest 3 corre sobre vite 7,
      // que todavía no resuelve los paths del tsconfig por su cuenta.
      "@": raiz,
      // "server-only" es un guard de Next: revienta si un componente de
      // cliente importa el módulo. Fuera de Next no hay quien lo
      // resuelva, así que en los tests apunta a un módulo vacío.
      // El guard sigue vivo donde importa: en el build de Next.
      "server-only": `${raiz}test/server-only-stub.ts`,
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Los tests corren SIN RED: el mapeo de la DB y la vista se
    // verifican contra fixtures (AGENTS.md, feedback loops).
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
