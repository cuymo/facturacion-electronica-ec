import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  // Internal packages (@facturaya/*) are bundled INTO this package.
  // Only true external deps that the consumer must install are listed here.
  external: [
    "ec-sri-invoice-signer",
    "ec-sri-invoice-signer/dist/src/signature/signature",
    "fast-xml-parser",
    "xmllint-wasm",
  ],
  // Ensure Node built-ins are not bundled
  platform: "node",
  noExternal: [
    "@facturaya/core",
    "@facturaya/signer",
    "@facturaya/sri-client",
  ],
});
