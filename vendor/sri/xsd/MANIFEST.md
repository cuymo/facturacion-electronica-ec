# SRI XSD Schemas — Official Files

These XSD files are the **official schemas** published by the Servicio de Rentas Internas (SRI) of Ecuador for electronic document validation.

**DO NOT modify these files.** If the SRI publishes updated schemas, replace the files and update this manifest.

## Source

Downloaded from: https://www.sri.gob.ec/facturacion-electronica
Section: "Esquemas XSD Y XML"
Date obtained: 2026-04-13

## Files

| File | Document | Version | Size | SHA-256 |
|------|----------|---------|------|---------|
| `factura_V1.1.0.xsd` | Factura | 1.1.0 | 36,356 bytes | `62db9bf0ecceb00ef2b7ed136e59224815e5e5e33c77efc6a0552001e052eb8b` |
| `LiquidacionCompra_V1.1.0.xsd` | Liquidacion de Compra | 1.1.0 | 28,338 bytes | `58c9cd96edf93d92ef6692cd028e689080257c9ba2941fe04fe1d426ebc4b5b6` |
| `NotaCredito_V1.1.0.xsd` | Nota de Credito | 1.1.0 | 21,834 bytes | `379e9f270d71ab4578f130a736c9abe5eb1d7969375ecdef55d2973583ec5ab0` |
| `NotaDebito_V1.0.0.xsd` | Nota de Debito | 1.0.0 | 20,056 bytes | `f40323adef667a2d95de75a611272a78b73a7f82711201bd7a7a52d3bb353fd6` |
| `GuiaRemision_V1.1.0.xsd` | Guia de Remision | 1.1.0 | 21,647 bytes | `4777fd94b5f7b108da3db0dd3d2c71d1539ced221cba246ebeaa40fb17f3dee1` |
| `ComprobanteRetencion_V2.0.0.xsd` | Comprobante de Retencion | 2.0.0 | 28,644 bytes | `1e006d6d16c791c8f5b23d1f3e006cd066ccba2bfb797a3cb9098bd09c793cb7` |

## ZIP sources (SRI portal)

```
factura.zip           -> factura_V1.1.0.xsd
                         (also contains V1.0.0, V2.0.0, V2.1.0)
liquidacion.zip       -> LiquidacionCompra_V1.1.0.xsd
                         (also contains V1.0.0)
nota_credito.zip      -> NotaCredito_V1.1.0.xsd
                         (also contains V1.0.0)
nota_debito.zip       -> NotaDebito_V1.0.0.xsd
guia_remision.zip     -> GuiaRemision_V1.1.0.xsd
                         (also contains V1.0.0)
retencion.zip         -> ComprobanteRetencion_V2.0.0.xsd
                         (also contains V1.0.0)
```

## Verification

```bash
cd vendor/sri/xsd
sha256sum -c <<'EOF'
62db9bf0ecceb00ef2b7ed136e59224815e5e5e33c77efc6a0552001e052eb8b *factura_V1.1.0.xsd
58c9cd96edf93d92ef6692cd028e689080257c9ba2941fe04fe1d426ebc4b5b6 *LiquidacionCompra_V1.1.0.xsd
379e9f270d71ab4578f130a736c9abe5eb1d7969375ecdef55d2973583ec5ab0 *NotaCredito_V1.1.0.xsd
f40323adef667a2d95de75a611272a78b73a7f82711201bd7a7a52d3bb353fd6 *NotaDebito_V1.0.0.xsd
4777fd94b5f7b108da3db0dd3d2c71d1539ced221cba246ebeaa40fb17f3dee1 *GuiaRemision_V1.1.0.xsd
1e006d6d16c791c8f5b23d1f3e006cd066ccba2bfb797a3cb9098bd09c793cb7 *ComprobanteRetencion_V2.0.0.xsd
EOF
```
