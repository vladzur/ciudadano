import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.spec.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@ciudadano/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
