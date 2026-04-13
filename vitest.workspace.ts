import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/*/vitest.config.ts",
  {
    test: {
      include: ["tests/**/*.test.ts"],
      name: "integration",
    },
  },
]);
