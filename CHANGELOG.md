# Changelog

## 1.0.1 (2026-07-01)

- Updates README requirements to Node.js `>=24.18.0`.
- Aligns CI with Node.js 24.18.0 and pnpm 11.9.0.
- Normalizes package repository URLs for npm publish metadata.

## 1.0.0 (2026-07-01)

First stable release of `facturacion-electronica-ec`.

### Stable API baseline

- Publishes the SDK as `facturacion-electronica-ec@1.0.0`.
- Requires Node.js `>=24.18.0` and pnpm `11.9.0` for repository development.
- Keeps the public high-level API centered on `FacturacionElectronicaEC`.
- Keeps `sequenceProvider` mandatory for production-safe sequential numbering.

### Reliability hardening

- Normalizes SDK failures to `FacturacionElectronicaECError` where the operation must reject.
- Returns controlled partial states for SRI communication outcomes where appropriate.
- Executes `hooks.onError` for validation, sequence, XML build, XSD, signing, SRI communication, authorization query, and rollback failures.
- Adds regression coverage for runtime-invalid inputs, sequence crashes, XML builder crashes, signer failures, SRI communication failures, and rollback failures.

### Tooling and dependencies

- Updates the workspace to pnpm 11 and current dependency versions.
- Aligns Node types to Node 24 LTS.
- Fixes the root `lint` script so release checks do not fail when package-level lint scripts are absent.

### Validation

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## 0.1.0-beta.1 (2026-04-13)

First public beta of `facturacion-electronica-ec`.
All 6 SRI document types validated end-to-end against SRI PRUEBAS.

Single published package: `facturacion-electronica-ec` (bundles core, signer, sri-client internally).

### Validated against SRI PRUEBAS

| Document | codDoc | Result |
|----------|--------|--------|
| Factura | 01 | AUTORIZADO |
| Liquidacion de Compra | 03 | AUTORIZADO |
| Nota de Credito | 04 | AUTORIZADO |
| Nota de Debito | 05 | AUTORIZADO |
| Guia de Remision | 06 | AUTORIZADO |
| Comprobante de Retencion | 07 | AUTORIZADO |

### Known risks

- `@facturacion-ec/signer` uses a private submodule import from `ec-sri-invoice-signer` for
  liquidacionCompra signing. This path may break on upstream updates.
- SRI catalogs (tax rates, retention codes) are bundled as static defaults. Override via
  `catalogRegistry.override()` if SRI changes rates before a library update.
- `numDocSustento` in comprobanteRetencion is auto-stripped of hyphens (SRI XSD v2.0.0
  requires 15 digits, not `000-000-000000000` format).

### Breaking changes from internal EmiteYa code

- `Emisor` uses SRI codes (`establecimiento: "001"`) instead of database UUIDs
- `sequenceProvider` is mandatory (no default in-memory provider for production)
- All signer methods are async (`ISigner.sign` returns `Promise<string>`)
- Retry, polling, and Error 70 handling are separated in the SDK pipeline config
