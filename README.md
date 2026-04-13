# facturacion-electronica-ec

> **v0.1.0-beta.1** — 6/6 documentos AUTORIZADOS contra SRI PRUEBAS. API inestable, no es 1.0.

Libreria TypeScript para emision de comprobantes electronicos del SRI Ecuador.

Los 6 tipos de documentos tributarios han sido validados end-to-end contra el ambiente de pruebas del SRI (build XML, firmado XAdES-BES, envio SOAP, autorizacion):

| codDoc | Documento | SRI PRUEBAS |
|--------|-----------|-------------|
| 01 | Factura | AUTORIZADO |
| 03 | Liquidacion de Compra | AUTORIZADO |
| 04 | Nota de Credito | AUTORIZADO |
| 05 | Nota de Debito | AUTORIZADO |
| 06 | Guia de Remision | AUTORIZADO |
| 07 | Comprobante de Retencion | AUTORIZADO |

---

## Advertencias tecnicas obligatorias

### 1. Requiere certificado .p12

Necesita un archivo `.p12` emitido por una CA autorizada por el SRI (Security Data, ANF Ecuador, etc.). Sin certificado no puede firmar ni enviar documentos.

### 2. `sequenceProvider` es obligatorio

Usted debe implementar `ISequenceProvider` respaldado por su base de datos. `UnsafeMemorySequenceProvider` existe solo para tests — pierde la cuenta al reiniciar.

### 3. Integration tests solo ambiente PRUEBAS

Hardcoded a `ambiente: '1'`. Un safeguard bloquea `ambiente: '2'` en tests.

### 4. Firmado de liquidacionCompra depende de import fragil

Usa `ec-sri-invoice-signer/dist/src/signature/signature` (path privado del upstream). Si cambia, solo afecta `LIQUIDACION_COMPRA`. La interfaz `ISigner` permite reemplazo completo.

---

## Instalacion

```bash
npm install facturacion-electronica-ec ec-sri-invoice-signer
```

## Quick Start

```typescript
import { readFileSync } from 'fs';
import { FacturaYa } from 'facturacion-electronica-ec';

const fy = new FacturaYa({
  emisor: {
    ruc: '0992877878001',
    razonSocial: 'MI EMPRESA S.A.',
    dirMatriz: 'Guayaquil',
    establecimiento: '001',
    puntoEmision: '001',
    direccionEstablecimiento: 'Guayaquil, Sucursal',
    obligadoContabilidad: true,
    ambiente: '1',
  },
  p12: readFileSync('./firma.p12'),
  p12Password: process.env.P12_PASSWORD,
  sequenceProvider: miProviderDeBaseDeDatos, // OBLIGATORIO
});

const result = await fy.emitirFactura({
  fechaEmision: '13/04/2026',
  tipoIdentificacionComprador: '07',
  razonSocialComprador: 'CONSUMIDOR FINAL',
  identificacionComprador: '9999999999999',
  totalSinImpuestos: 100.00,
  totalDescuento: 0,
  totalConImpuestos: [
    { codigo: '2', codigoPorcentaje: '4', baseImponible: 100.00, valor: 15.00 }
  ],
  propina: 0,
  importeTotal: 115.00,
  pagos: [{ formaPago: '01', total: 115.00 }],
  detalles: [{
    codigoPrincipal: 'PROD001',
    descripcion: 'Servicio de consultoria',
    cantidad: 1,
    precioUnitario: 100.00,
    descuento: 0,
    precioTotalSinImpuesto: 100.00,
    impuestos: [
      { codigo: '2', codigoPorcentaje: '4', tarifa: 15, baseImponible: 100.00, valor: 15.00 }
    ],
  }],
});

console.log(result.estado);       // 'AUTORIZADO'
console.log(result.claveAcceso);  // 49 digitos
```

## ISequenceProvider

```typescript
import type { ISequenceProvider, DocumentType } from 'facturacion-electronica-ec';

class PostgresSequenceProvider implements ISequenceProvider {
  async next(estab: string, ptoEmi: string, docType: DocumentType): Promise<string> {
    const row = await db.query(
      'UPDATE sequences SET val = val + 1 WHERE estab=$1 AND pto=$2 AND doc=$3 RETURNING val',
      [estab, ptoEmi, docType]
    );
    return row.val.toString().padStart(9, '0');
  }

  async rollback(estab: string, ptoEmi: string, docType: DocumentType): Promise<void> {
    await db.query(
      'UPDATE sequences SET val = val - 1 WHERE estab=$1 AND pto=$2 AND doc=$3',
      [estab, ptoEmi, docType]
    );
  }
}
```

## Catalogos SRI

```typescript
import { catalogRegistry } from 'facturacion-electronica-ec';

catalogRegistry.get('impuestos-iva', '4');  // { code: '4', description: 'IVA 15%', rate: 15 }

catalogRegistry.override('impuestos-iva', {
  '5': { code: '5', description: 'IVA 16%', rate: 16 },
});
```

## Acceso bajo nivel

```typescript
const xml = fy.buildXml('FACTURA', facturaData);
const signedXml = await fy.signXml(xml, 'FACTURA');
const recepcion = await fy.sendToSri(signedXml);
const auth = await fy.checkAuthorization(claveAcceso);
```

## Configuracion avanzada

```typescript
new FacturaYa({
  // ...emisor, p12, sequenceProvider
  signer: customSigner,          // Reemplazar firmador XAdES
  sriClient: customClient,       // Reemplazar cliente SOAP
  logger: console,
  authorizationDelayMs: 1500,
  maxError70Retries: 3,
  maxSendRetries: 2,
  sendRetryDelayMs: 2000,
  hooks: { onXmlBuilt, onXmlSigned, onSriRecepcion, onSriAutorizacion, onAuthorized, onError },
});
```

## Requisitos

- Node.js >= 18
- Certificado `.p12` vigente
- `ec-sri-invoice-signer` >= 1.6.0 (peer dependency)

## Desarrollo

```bash
pnpm install
pnpm -r build
npx vitest run
node tests/sdk/run-full-validation.mjs  # requires .env.test
```

## Licencia

MIT
