import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  // ec-sri-invoice-signer is a peer dep loaded via createRequire at runtime.
  // It must NOT be bundled — the consumer installs it.
  external: ["ec-sri-invoice-signer", "ec-sri-invoice-signer/dist/src/signature/signature"],
});
