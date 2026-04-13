# Changelog

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

- `@facturaya/signer` uses a private submodule import from `ec-sri-invoice-signer` for
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
