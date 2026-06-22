import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror tsconfig's "@/*" -> project root so tests can import like the app does.
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
