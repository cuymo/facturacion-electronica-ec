# facturacion-electronica-ec

> **v0.1.0-beta.1** — Libreria TypeScript para emision de comprobantes electronicos del SRI Ecuador. **6/6 documentos AUTORIZADOS** end-to-end contra SRI PRUEBAS. API inestable hasta v1.0.

[![npm](https://img.shields.io/npm/v/facturacion-electronica-ec.svg)](https://www.npmjs.com/package/facturacion-electronica-ec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Construye, firma con XAdES-BES, envia al SRI y consulta autorizacion de los 6 tipos de comprobantes electronicos del SRI Ecuador, con validacion XSD oficial y catalogos versionados.

## Documentos soportados

| codDoc | Documento | XSD version | SRI PRUEBAS |
|--------|-----------|-------------|-------------|
| 01 | Factura | 1.1.0 | AUTORIZADO |
| 03 | Liquidacion de Compra | 1.1.0 | AUTORIZADO |
| 04 | Nota de Credito | 1.1.0 | AUTORIZADO |
| 05 | Nota de Debito | 1.0.0 | AUTORIZADO |
| 06 | Guia de Remision | 1.1.0 | AUTORIZADO |
| 07 | Comprobante de Retencion | 2.0.0 | AUTORIZADO |

---

## Tabla de contenidos

- [Advertencias obligatorias](#advertencias-obligatorias)
- [Instalacion](#instalacion)
- [Quick Start](#quick-start)
- [API publica completa](#api-publica-completa)
  - [Clase principal: FacturacionElectronicaEC](#clase-principal-facturacionelectronicaec)
  - [Tipos de configuracion](#tipos-de-configuracion)
  - [Sequence Provider (obligatorio)](#sequence-provider-obligatorio)
  - [Tipos de documentos](#tipos-de-documentos)
  - [Errores](#errores)
  - [XML Builders (acceso bajo nivel)](#xml-builders-acceso-bajo-nivel)
  - [Clave de acceso](#clave-de-acceso)
  - [Validacion XSD](#validacion-xsd)
  - [Catalogos SRI](#catalogos-sri)
  - [Schema Registry](#schema-registry)
  - [Validadores de campos](#validadores-de-campos)
  - [Hooks lifecycle](#hooks-lifecycle)
  - [Adaptadores e interfaces](#adaptadores-e-interfaces)
- [Ejemplos por tipo de documento](#ejemplos-por-tipo-de-documento)
- [Codigos SRI mas usados](#codigos-sri-mas-usados)
- [Configuracion avanzada](#configuracion-avanzada)
- [Riesgos conocidos](#riesgos-conocidos)
- [Desarrollo y contribucion](#desarrollo-y-contribucion)

---

## Advertencias obligatorias

### 1. Requiere certificado .p12

Necesita un archivo `.p12` emitido por una CA autorizada por el SRI (Security Data, ANF Ecuador, Banco Central, etc.). Sin certificado no puede firmar ni enviar documentos.

### 2. `sequenceProvider` es OBLIGATORIO

Usted debe implementar `ISequenceProvider` respaldado por su base de datos. **No hay default de produccion**. `UnsafeMemorySequenceProvider` existe solo para tests — pierde la cuenta al reiniciar el proceso.

### 3. La validacion XSD local NO sustituye la del SRI

La validacion XSD incluida (con esquemas oficiales del SRI) es una capa de endurecimiento previa al envio. **El SRI siempre valida en su lado**. Use ambas capas.

### 4. Integration tests solo ambiente PRUEBAS

Los integration tests estan hardcoded a `ambiente: '1'`. Un safeguard bloquea `ambiente: '2'`.

### 5. Firmado de liquidacion de compra depende de import fragil

El firmado de liquidaciones usa `ec-sri-invoice-signer/dist/src/signature/signature` (path privado del upstream). Si cambia, solo afecta `LIQUIDACION_COMPRA`. La interfaz `ISigner` permite reemplazo completo.

---

## Instalacion

```bash
npm install facturacion-electronica-ec ec-sri-invoice-signer
```

**Peer dependency obligatoria**: `ec-sri-invoice-signer >=1.6.0 <2.0.0`
**Peer dependency opcional** (para validacion XSD): `xmllint-wasm >=5.0.0`

```bash
# Si quiere validacion XSD activable en runtime
npm install xmllint-wasm
```

**Requisitos**: Node.js >= 18

---

## Quick Start

```typescript
import { readFileSync } from 'fs';
import { FacturacionElectronicaEC } from 'facturacion-electronica-ec';
import { MiSequenceProvider } from './mi-sequence-provider'; // Usted lo implementa

const fe = new FacturacionElectronicaEC({
  emisor: {
    ruc: '0992877878001',
    razonSocial: 'MI EMPRESA S.A.',
    dirMatriz: 'Guayaquil',
    establecimiento: '001',
    puntoEmision: '001',
    direccionEstablecimiento: 'Guayaquil, Sucursal Centro',
    obligadoContabilidad: true,
    ambiente: '1', // '1' = PRUEBAS, '2' = PRODUCCION
  },
  p12: readFileSync('./firma.p12'),
  p12Password: process.env.P12_PASSWORD!, // NUNCA hardcodee
  sequenceProvider: new MiSequenceProvider(), // OBLIGATORIO
});

const result = await fe.emitirFactura({
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

console.log(result.estado);              // 'AUTORIZADO'
console.log(result.claveAcceso);         // 49 digitos
console.log(result.numeroAutorizacion);  // mismo que claveAcceso si fue autorizado
console.log(result.xmlFirmado);          // XML con firma XAdES-BES
```

---

## API publica completa

### Clase principal: `FacturacionElectronicaEC`

Orquesta el pipeline completo: validacion -> sequence -> claveAcceso -> build XML -> validacion XSD -> firma -> envio SRI -> consulta autorizacion.

#### Metodos de alto nivel (emision completa)

```typescript
class FacturacionElectronicaEC {
  constructor(config: FacturacionElectronicaECConfig);

  // Cada metodo: valida -> construye XML -> firma -> envia al SRI -> consulta autorizacion
  emitirFactura(data: FacturaData): Promise<EmissionResult>;
  emitirLiquidacionCompra(data: LiquidacionCompraData): Promise<EmissionResult>;
  emitirNotaCredito(data: NotaCreditoData): Promise<EmissionResult>;
  emitirNotaDebito(data: NotaDebitoData): Promise<EmissionResult>;
  emitirGuiaRemision(data: GuiaRemisionData): Promise<EmissionResult>;
  emitirRetencion(data: RetencionData): Promise<EmissionResult>;
}
```

#### Metodos de acceso bajo nivel

```typescript
class FacturacionElectronicaEC {
  // Construye XML sin firmar ni enviar
  buildXml(documentType: DocumentType, data: DocumentData, options?: {
    secuencial?: string;
    claveAcceso?: string;
  }): string;

  // Firma XML existente (asincrono)
  signXml(xml: string, documentType: DocumentType): Promise<string>;

  // Envia XML firmado al SRI (un solo intento, sin retry)
  sendToSri(signedXml: string): Promise<SriRecepcionResult>;

  // Consulta autorizacion por clave de acceso (un solo intento)
  checkAuthorization(claveAcceso: string): Promise<SriAutorizacionResult>;

  // Override de catalogos SRI en runtime
  overrideCatalog(name: string, entries: Record<string, CatalogEntry>): void;
}
```

### Tipos de configuracion

```typescript
interface FacturacionElectronicaECConfig {
  // OBLIGATORIOS
  emisor: Emisor;
  p12: Buffer;
  p12Password: string;
  sequenceProvider: ISequenceProvider;

  // OPCIONALES
  signer?: ISigner;                  // Default: EcSriSigner
  sriClient?: ISriClient;            // Default: SriClient
  logger?: Logger;                   // Default: silent
  hooks?: EmissionHooks;
  validateXsd?: boolean;             // Default: false
  authorizationDelayMs?: number;     // Default: 1500
  maxError70Retries?: number;        // Default: 3
  maxSendRetries?: number;           // Default: 2
  sendRetryDelayMs?: number;         // Default: 2000
}

interface Emisor {
  ruc: string;                       // 13 digitos
  razonSocial: string;
  nombreComercial?: string;
  dirMatriz: string;
  establecimiento: string;           // 3 digitos: "001"
  puntoEmision: string;              // 3 digitos: "001"
  direccionEstablecimiento: string;
  contribuyenteEspecial?: string;
  obligadoContabilidad: boolean;
  ambiente: '1' | '2';               // '1' PRUEBAS, '2' PRODUCCION
  agenteRetencion?: string;
}
```

### Resultado de emision

```typescript
interface EmissionResult {
  estado: 'AUTORIZADO' | 'ENVIADO' | 'FIRMADO' | 'DEVUELTO' | 'RECHAZADO';
  ambiente: Ambiente;
  claveAcceso: string;               // 49 digitos
  secuencial: string;                // 9 digitos
  xmlOriginal: string;               // XML sin firmar
  xmlFirmado: string;                // XML con firma XAdES-BES
  numeroAutorizacion: string | null;
  fechaAutorizacion: Date | null;
  recepcionEstado: 'RECIBIDA' | 'DEVUELTA' | null;
  autorizacionEstado: 'AUTORIZADO' | 'NO AUTORIZADO' | null;
  rawRecepcion: SriRecepcionResult | null;
  rawAutorizacion: SriAutorizacionResult | null;
  mensajes: SriMensaje[];
  attempts: number;
}

type EmissionEstado =
  | 'AUTORIZADO'   // Exitoso, finalizado
  | 'ENVIADO'      // Recibido por SRI pero sin respuesta de autorizacion aun
  | 'FIRMADO'      // Firmado pero no enviado (error de comunicacion)
  | 'DEVUELTO'     // SRI lo rechazo en recepcion (estructura, secuencial, etc.)
  | 'RECHAZADO';   // SRI lo rechazo en autorizacion (datos invalidos)
```

### Sequence Provider (obligatorio)

```typescript
interface ISequenceProvider {
  // Devuelve el siguiente secuencial como string de 9 digitos zero-padded
  next(
    establecimiento: string,
    puntoEmision: string,
    documentType: DocumentType
  ): Promise<string>;

  // Opcional: decrementa si SRI devuelve DEVUELTO (secuencial reusable)
  rollback?(
    establecimiento: string,
    puntoEmision: string,
    documentType: DocumentType
  ): Promise<void>;
}
```

#### Implementacion de ejemplo con PostgreSQL

```typescript
import type { ISequenceProvider, DocumentType } from 'facturacion-electronica-ec';

class PostgresSequenceProvider implements ISequenceProvider {
  async next(estab: string, ptoEmi: string, docType: DocumentType): Promise<string> {
    // Atomic UPDATE ... RETURNING evita race conditions
    const { rows } = await db.query(
      `UPDATE sequences
         SET val = val + 1
       WHERE estab = $1 AND pto_emi = $2 AND doc_type = $3
       RETURNING val`,
      [estab, ptoEmi, docType]
    );
    return rows[0].val.toString().padStart(9, '0');
  }

  async rollback(estab: string, ptoEmi: string, docType: DocumentType): Promise<void> {
    await db.query(
      `UPDATE sequences SET val = val - 1
       WHERE estab = $1 AND pto_emi = $2 AND doc_type = $3`,
      [estab, ptoEmi, docType]
    );
  }
}
```

#### `UnsafeMemorySequenceProvider` (solo tests)

```typescript
import { UnsafeMemorySequenceProvider } from 'facturacion-electronica-ec';

const provider = new UnsafeMemorySequenceProvider();
provider.set('001', '001', 'FACTURA', 100);  // Comenzar en 100
provider.reset();                             // Limpiar contadores
```

### Tipos de documentos

```typescript
// Tipos union
type DocumentType =
  | 'FACTURA'
  | 'LIQUIDACION_COMPRA'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO'
  | 'GUIA_REMISION'
  | 'COMPROBANTE_RETENCION';

type DocumentData =
  | FacturaData
  | LiquidacionCompraData
  | NotaCreditoData
  | NotaDebitoData
  | GuiaRemisionData
  | RetencionData;

// Tipos compartidos
interface TaxInfo {
  codigo: string;              // "2" = IVA
  codigoPorcentaje: string;    // "0" 0%, "2" 12%, "4" 15%
  tarifa: number;
  baseImponible: number;
  valor: number;
}

interface TotalTax {
  codigo: string;
  codigoPorcentaje: string;
  baseImponible: number;
  valor: number;
}

interface Payment {
  formaPago: string;           // "01" efectivo, "20" transferencia
  total: number;
  plazo?: number;
  unidadTiempo?: string;
}
```

#### `FacturaData`

```typescript
interface FacturaData {
  fechaEmision: string;        // dd/mm/yyyy
  tipoIdentificacionComprador: string;  // '04' RUC, '05' Cedula, '07' Consumidor Final
  razonSocialComprador: string;
  identificacionComprador: string;
  direccionComprador?: string;
  totalSinImpuestos: number;
  totalDescuento: number;
  totalConImpuestos: TotalTax[];
  propina: number;
  importeTotal: number;
  pagos: Payment[];
  detalles: FacturaDetail[];
}

interface FacturaDetail {
  codigoPrincipal: string;
  codigoAuxiliar?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  impuestos: TaxInfo[];
}
```

#### `NotaCreditoData`

```typescript
interface NotaCreditoData {
  fechaEmision: string;
  tipoIdentificacionComprador: string;
  razonSocialComprador: string;
  identificacionComprador: string;
  codDocModificado: string;             // codDoc del documento que modifica
  numDocModificado: string;             // formato 001-001-000000001
  fechaEmisionDocSustento: string;      // fecha del documento original
  totalSinImpuestos: number;
  valorModificacion: number;
  totalConImpuestos: TotalTax[];
  motivo: string;
  detalles: NotaCreditoDetail[];
}
```

#### `NotaDebitoData`

```typescript
interface NotaDebitoData {
  fechaEmision: string;
  tipoIdentificacionComprador: string;
  razonSocialComprador: string;
  identificacionComprador: string;
  codDocModificado: string;
  numDocModificado: string;
  fechaEmisionDocSustento: string;
  totalSinImpuestos: number;
  impuestos: TaxInfo[];
  valorTotal: number;
  motivos: NotaDebitoMotivo[];
}

interface NotaDebitoMotivo {
  razon: string;
  valor: number;
}
```

#### `GuiaRemisionData`

```typescript
interface GuiaRemisionData {
  dirPartida: string;
  razonSocialTransportista: string;
  tipoIdentificacionTransportista: string;
  rucTransportista: string;
  fechaIniTransporte: string;          // dd/mm/yyyy
  fechaFinTransporte: string;
  placa: string;
  destinatarios: GuiaRemisionDestinatario[];
}

interface GuiaRemisionDestinatario {
  identificacionDestinatario: string;
  razonSocialDestinatario: string;
  dirDestinatario: string;
  motivoTraslado: string;
  ruta?: string;
  codDocSustento?: string;
  numDocSustento?: string;
  numAutDocSustento?: string;          // 49 digitos clave del documento
  fechaEmisionDocSustento?: string;
  detalles: GuiaRemisionDetailItem[];
}
```

#### `RetencionData`

```typescript
interface RetencionData {
  fechaEmision: string;
  tipoIdentificacionSujetoRetenido: string;
  razonSocialSujetoRetenido: string;
  identificacionSujetoRetenido: string;
  periodoFiscal: string;               // mm/yyyy
  parteRel?: string;                   // 'SI' | 'NO', default 'NO'
  docsSustento: RetencionDocSustento[];
}

interface RetencionDocSustento {
  codSustento: string;
  codDocSustento: string;
  numDocSustento: string;              // OJO: la libreria normaliza guiones automaticamente
  fechaEmisionDocSustento: string;
  fechaRegistroContable?: string;
  numAutDocSustento: string;           // 49 digitos clave del documento sustento
  pagoLocExt: string;                  // '01' local, '02' exterior
  totalSinImpuestos: number;
  importeTotal: number;
  impuestosDocSustento: RetencionDocTax[];
  retenciones: RetencionRetencion[];
  pagos: SimplePayment[];
}

interface RetencionRetencion {
  codigo: string;                      // '1' Renta, '2' IVA
  codigoRetencion: string;             // del catalogo SRI
  baseImponible: number;
  porcentajeRetener: number;
  valorRetenido: number;
}
```

### Errores

```typescript
class FacturacionElectronicaECError extends Error {
  readonly code: FacturacionElectronicaECErrorCode;
  readonly sriMensajes?: SriMensaje[];

  // Factory methods
  static validation(message: string): FacturacionElectronicaECError;
  static claveAcceso(message: string): FacturacionElectronicaECError;
  static xmlBuild(message: string): FacturacionElectronicaECError;
  static xmlStructure(message: string): FacturacionElectronicaECError;
  static signing(message: string): FacturacionElectronicaECError;
  static sriReception(message: string, mensajes?: SriMensaje[]): FacturacionElectronicaECError;
  static sriAuthorization(message: string, mensajes?: SriMensaje[]): FacturacionElectronicaECError;
  static sriCommunication(message: string): FacturacionElectronicaECError;
  static sriError70(message: string, mensajes?: SriMensaje[]): FacturacionElectronicaECError;
  static sequence(message: string): FacturacionElectronicaECError;
  static configuration(message: string): FacturacionElectronicaECError;
  static certificate(message: string): FacturacionElectronicaECError;
}

type FacturacionElectronicaECErrorCode =
  | 'VALIDATION'
  | 'CLAVE_ACCESO'
  | 'XML_BUILD'
  | 'XML_STRUCTURE'
  | 'SIGNING'
  | 'SRI_RECEPTION'
  | 'SRI_AUTHORIZATION'
  | 'SRI_COMMUNICATION'
  | 'SRI_ERROR_70'
  | 'SEQUENCE'
  | 'CONFIGURATION'
  | 'CERTIFICATE';

interface SriMensaje {
  identificador: string;     // codigo SRI: '35', '70', etc.
  mensaje: string;
  informacionAdicional: string;
  tipo: string;              // 'ERROR' | 'ADVERTENCIA' | 'INFORMATIVO'
}
```

#### Manejo de errores tipados

```typescript
import { FacturacionElectronicaECError } from 'facturacion-electronica-ec';

try {
  const result = await fe.emitirFactura(data);
} catch (err) {
  if (err instanceof FacturacionElectronicaECError) {
    switch (err.code) {
      case 'VALIDATION':       /* datos invalidos */ break;
      case 'CERTIFICATE':      /* p12 corrupto */ break;
      case 'SIGNING':          /* error firmando */ break;
      case 'SRI_RECEPTION':    /* SRI rechazo en recepcion */
        console.error(err.sriMensajes); break;
      case 'SRI_AUTHORIZATION': /* SRI rechazo en autorizacion */
        console.error(err.sriMensajes); break;
      case 'SRI_COMMUNICATION': /* error de red al SRI */ break;
    }
  }
}
```

### XML Builders (acceso bajo nivel)

```typescript
// Builder por tipo
function buildFacturaXml(ctx: XmlBuildContext, data: FacturaData): string;
function buildLiquidacionCompraXml(ctx: XmlBuildContext, data: LiquidacionCompraData): string;
function buildNotaCreditoXml(ctx: XmlBuildContext, data: NotaCreditoData): string;
function buildNotaDebitoXml(ctx: XmlBuildContext, data: NotaDebitoData): string;
function buildGuiaRemisionXml(ctx: XmlBuildContext, data: GuiaRemisionData): string;
function buildComprobanteRetencionXml(ctx: XmlBuildContext, data: RetencionData): string;

// Dispatcher generico
function buildDocumentXml(
  documentType: DocumentType,
  ctx: XmlBuildContext,
  data: DocumentData
): string;

// Helpers
function escapeXml(text: string): string;
function toFixed2(n: number): string;
function toFixed6(n: number): string;
function buildInfoTributariaXml(ctx: XmlBuildContext): string;

// Contexto que reciben todos los builders
interface XmlBuildContext {
  ambiente: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  dirMatriz: string;
  claveAcceso: string;
  codDoc: string;
  establecimiento: string;
  puntoEmision: string;
  secuencial: string;
  direccionEstablecimiento: string;
  contribuyenteEspecial: string | null;
  obligadoContabilidad: boolean;
}
```

### Clave de acceso

```typescript
function generateClaveAcceso(params: ClaveAccesoParams): string;
function generateCodigoNumerico(): string;     // 8 digitos aleatorios crypto-safe
function computeModulo11(digits: string): string;  // Digito verificador SRI

interface ClaveAccesoParams {
  fechaEmision: string;        // dd/mm/yyyy
  tipoComprobante: string;     // '01', '03', '04', '05', '06', '07'
  ruc: string;                 // 13 digitos
  ambiente: string;            // '1' | '2'
  establecimiento: string;     // 3 digitos
  puntoEmision: string;        // 3 digitos
  secuencial: string;          // 9 digitos
  codigoNumerico: string;      // 8 digitos
  tipoEmision: string;         // '1'
}
```

### Validacion XSD

Valida XML contra los esquemas oficiales del SRI (incluidos en el paquete). Requiere `xmllint-wasm` instalado:

```typescript
async function validateXmlAgainstXsd(
  documentType: DocumentType,
  xml: string
): Promise<XsdValidationResult>;

interface XsdValidationResult {
  valid: boolean;
  errors: string[];
}

function getAvailableXsdTypes(): DocumentType[];
function registerXsdSearchPath(dir: string): void;  // Override avanzado
```

#### Activar validacion XSD en el SDK

```typescript
const fe = new FacturacionElectronicaEC({
  // ...config
  validateXsd: true,  // Valida XSD antes de firmar
});
```

#### Validar manualmente

```typescript
import { validateXmlAgainstXsd, buildFacturaXml } from 'facturacion-electronica-ec';

const xml = buildFacturaXml(ctx, data);
const result = await validateXmlAgainstXsd('FACTURA', xml);

if (!result.valid) {
  console.error('Errores XSD:', result.errors);
}
```

### Catalogos SRI

Catalogos vigentes pre-cargados, sobreescribibles en runtime:

```typescript
import {
  catalogRegistry,
  TIPOS_IDENTIFICACION,
  TIPOS_COMPROBANTE,
  FORMAS_PAGO,
  IMPUESTOS_IVA,
  RETENCION_IVA,
  CODIGOS_IMPUESTO,
  CODIGOS_SUSTENTO,
} from 'facturacion-electronica-ec';

// Consultar
catalogRegistry.get('impuestos-iva', '4');  // { code: '4', description: 'IVA 15%', rate: 15 }
catalogRegistry.list('formas-pago');         // [{ code: '01', ... }, ...]
catalogRegistry.getMeta('impuestos-iva');    // { source, updatedAt, notes }
catalogRegistry.listCatalogs();              // ['impuestos-iva', 'formas-pago', ...]

// Sobreescribir cuando SRI cambie tasas
catalogRegistry.override('impuestos-iva', {
  '5': { code: '5', description: 'IVA 16%', rate: 16 },
});

// Restablecer a defaults
catalogRegistry.reset('impuestos-iva');
catalogRegistry.resetAll();
```

### Schema Registry

Centraliza version, codDoc y rootTag de cada documento. Los builders consultan aqui:

```typescript
import { schemaRegistry } from 'facturacion-electronica-ec';

schemaRegistry.get('FACTURA');           // { documentType, codDoc, rootTag, version, validFrom, validTo }
schemaRegistry.getVersion('FACTURA');     // '1.1.0'
schemaRegistry.getRootTag('FACTURA');     // 'factura'
schemaRegistry.getCodDoc('FACTURA');      // '01'
schemaRegistry.list();                    // [DocumentSchema, ...]

// Override cuando SRI lance nueva version
schemaRegistry.register({
  documentType: 'FACTURA',
  codDoc: '01',
  rootTag: 'factura',
  version: '2.0.0',
  validFrom: '2026-12-01',
  validTo: null,
});
```

### Validadores de campos

```typescript
// Validacion completa por documento
function validateFactura(data: FacturaData): ValidationResult;
function validateLiquidacionCompra(data: LiquidacionCompraData): ValidationResult;
function validateNotaCredito(data: NotaCreditoData): ValidationResult;
function validateNotaDebito(data: NotaDebitoData): ValidationResult;
function validateGuiaRemision(data: GuiaRemisionData): ValidationResult;
function validateRetencion(data: RetencionData): ValidationResult;

// Validadores primitivos
function isValidRuc(value: string): boolean;
function isValidCedula(value: string): boolean;
function isValidFecha(value: string): boolean;          // dd/mm/yyyy
function isValidTipoIdentificacion(value: string): boolean;
function isValidNumDocumento(value: string): boolean;   // 000-000-000000000

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

### Hooks lifecycle

```typescript
interface EmissionHooks {
  onXmlBuilt?(xml: string): void | Promise<void>;
  onXmlSigned?(signedXml: string): void | Promise<void>;
  onSriRecepcion?(result: SriRecepcionResult): void | Promise<void>;
  onSriAutorizacion?(result: SriAutorizacionResult): void | Promise<void>;
  onAuthorized?(claveAcceso: string, numeroAutorizacion: string): void | Promise<void>;
  onError?(error: FacturacionElectronicaECError): void | Promise<void>;
}
```

```typescript
const fe = new FacturacionElectronicaEC({
  // ...config
  hooks: {
    onXmlBuilt: (xml) => log.debug('XML construido:', xml.length),
    onXmlSigned: (signed) => log.debug('Firmado:', signed.length),
    onSriRecepcion: (r) => log.info('SRI recepcion:', r.estado),
    onSriAutorizacion: (a) => log.info('SRI autorizacion:', a.estado),
    onAuthorized: (clave, numAut) => savetoDB({ clave, numAut }),
    onError: (err) => alertOps(err),
  },
});
```

### Adaptadores e interfaces

#### `ISigner` (firmador XAdES)

```typescript
interface ISigner {
  sign(
    xml: string,
    documentType: DocumentType,
    options: SignOptions
  ): Promise<string>;
}

interface SignOptions {
  p12: Buffer;
  p12Password: string;
}

// Implementacion default
class EcSriSigner implements ISigner { /* ... */ }
```

Reemplazo si necesitas otro firmador:

```typescript
class MiSigner implements ISigner {
  async sign(xml, docType, opts) { /* HSM, cloud KMS, etc. */ }
}

new FacturacionElectronicaEC({ ...config, signer: new MiSigner() });
```

#### `ISriClient` (cliente SOAP SRI)

```typescript
interface ISriClient {
  enviarComprobante(signedXml: string, ambiente: Ambiente): Promise<SriRecepcionResult>;
  autorizarComprobante(claveAcceso: string, ambiente: Ambiente): Promise<SriAutorizacionResult>;
}

class SriClient implements ISriClient {
  constructor(options?: SriClientOptions);
}

interface SriClientOptions {
  logger?: Logger;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;          // Default: 30000
}

// Endpoints oficiales (constantes exportadas)
const SRI_ENDPOINTS: {
  '1': { recepcion: string; autorizacion: string };  // PRUEBAS
  '2': { recepcion: string; autorizacion: string };  // PRODUCCION
};
```

#### `Logger` (interfaz)

```typescript
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
```

`console` cumple la interfaz directamente.

---

## Ejemplos por tipo de documento

### Nota de Credito

```typescript
const result = await fe.emitirNotaCredito({
  fechaEmision: '13/04/2026',
  tipoIdentificacionComprador: '04',
  razonSocialComprador: 'CLIENTE S.A.',
  identificacionComprador: '0992877878001',
  codDocModificado: '01',                            // factura
  numDocModificado: '001-001-000000123',             // factura original
  fechaEmisionDocSustento: '01/04/2026',
  totalSinImpuestos: 50.00,
  valorModificacion: 57.50,
  totalConImpuestos: [
    { codigo: '2', codigoPorcentaje: '4', baseImponible: 50.00, valor: 7.50 },
  ],
  motivo: 'Devolucion parcial de mercaderia',
  detalles: [{
    codigoPrincipal: 'PROD001',
    descripcion: 'Producto devuelto',
    cantidad: 1,
    precioUnitario: 50.00,
    descuento: 0,
    precioTotalSinImpuesto: 50.00,
    impuestos: [{ codigo: '2', codigoPorcentaje: '4', tarifa: 15, baseImponible: 50.00, valor: 7.50 }],
  }],
});
```

### Comprobante de Retencion

```typescript
const result = await fe.emitirRetencion({
  fechaEmision: '13/04/2026',
  tipoIdentificacionSujetoRetenido: '04',
  razonSocialSujetoRetenido: 'PROVEEDOR S.A.',
  identificacionSujetoRetenido: '0991234567001',
  periodoFiscal: '04/2026',
  docsSustento: [{
    codSustento: '01',
    codDocSustento: '01',
    numDocSustento: '001-001-000000100',           // se normaliza a '001001000000100'
    fechaEmisionDocSustento: '01/04/2026',
    numAutDocSustento: '...49 digitos de la factura recibida...',
    pagoLocExt: '01',
    totalSinImpuestos: 1000.00,
    importeTotal: 1150.00,
    impuestosDocSustento: [{
      codImpuestoDocSustento: '2',
      codigoPorcentaje: '4',
      baseImponible: 1000.00,
      tarifa: 15.00,
      valorImpuesto: 150.00,
    }],
    retenciones: [{
      codigo: '2',                                   // Retencion IVA
      codigoRetencion: '1',                          // 30% IVA
      baseImponible: 150.00,
      porcentajeRetener: 30.00,
      valorRetenido: 45.00,
    }],
    pagos: [{ formaPago: '20', total: 1150.00 }],
  }],
});
```

### Guia de Remision

```typescript
const result = await fe.emitirGuiaRemision({
  dirPartida: 'Quito, Av. Amazonas N36-152',
  razonSocialTransportista: 'TRANSPORTES X CIA LTDA',
  tipoIdentificacionTransportista: '04',
  rucTransportista: '0991234567001',
  fechaIniTransporte: '13/04/2026',
  fechaFinTransporte: '14/04/2026',
  placa: 'ABC-1234',
  destinatarios: [{
    identificacionDestinatario: '0912345678',
    razonSocialDestinatario: 'CLIENTE FINAL',
    dirDestinatario: 'Guayaquil, Av. 9 de Octubre',
    motivoTraslado: 'Venta directa',
    codDocSustento: '01',
    numDocSustento: '001-001-000000123',
    numAutDocSustento: '...49 digitos...',
    fechaEmisionDocSustento: '13/04/2026',
    detalles: [{
      codigoPrincipal: 'PROD001',
      descripcion: 'Mercaderia',
      cantidad: 10,
    }],
  }],
});
```

### Liquidacion de Compra

```typescript
const result = await fe.emitirLiquidacionCompra({
  fechaEmision: '13/04/2026',
  tipoIdentificacionProveedor: '05',
  razonSocialProveedor: 'PROVEEDOR INFORMAL',
  identificacionProveedor: '0912345678',
  totalSinImpuestos: 100.00,
  totalDescuento: 0,
  totalConImpuestos: [
    { codigo: '2', codigoPorcentaje: '0', baseImponible: 100.00, valor: 0 },
  ],
  importeTotal: 100.00,
  pagos: [{ formaPago: '01', total: 100.00 }],
  detalles: [{
    codigoPrincipal: 'MAT001',
    descripcion: 'Materia prima',
    cantidad: 10,
    precioUnitario: 10.00,
    descuento: 0,
    precioTotalSinImpuesto: 100.00,
    impuestos: [{ codigo: '2', codigoPorcentaje: '0', tarifa: 0, baseImponible: 100.00, valor: 0 }],
  }],
});
```

### Nota de Debito

```typescript
const result = await fe.emitirNotaDebito({
  fechaEmision: '13/04/2026',
  tipoIdentificacionComprador: '04',
  razonSocialComprador: 'CLIENTE MOROSO S.A.',
  identificacionComprador: '0992877878001',
  codDocModificado: '01',
  numDocModificado: '001-001-000000123',
  fechaEmisionDocSustento: '01/03/2026',
  totalSinImpuestos: 100.00,
  impuestos: [
    { codigo: '2', codigoPorcentaje: '4', tarifa: 15, baseImponible: 100.00, valor: 15.00 },
  ],
  valorTotal: 115.00,
  motivos: [
    { razon: 'Interes por mora', valor: 100.00 },
  ],
});
```

---

## Codigos SRI mas usados

### Tipos de identificacion (`tipoIdentificacionComprador`)

| Codigo | Tipo |
|--------|------|
| `'04'` | RUC |
| `'05'` | Cedula |
| `'06'` | Pasaporte |
| `'07'` | Consumidor Final |
| `'08'` | Identificacion del Exterior |

### IVA (`codigoPorcentaje` cuando `codigo: '2'`)

| Codigo | Tarifa | Notas |
|--------|--------|-------|
| `'0'` | 0% | IVA 0% |
| `'2'` | 12% | IVA 12% (historico) |
| `'4'` | 15% | IVA 15% (vigente desde abr 2024) |
| `'6'` | 0% | No objeto de impuesto |
| `'7'` | 0% | Exento de IVA |

### Formas de pago

| Codigo | Descripcion |
|--------|-------------|
| `'01'` | Sin utilizacion del sistema financiero (efectivo) |
| `'15'` | Compensacion de deudas |
| `'16'` | Tarjeta de debito |
| `'17'` | Dinero electronico |
| `'18'` | Tarjeta prepago |
| `'19'` | Tarjeta de credito |
| `'20'` | Otros con utilizacion del sistema financiero (transferencia) |
| `'21'` | Endoso de titulos |

### Retencion IVA (`codigo: '2'`, codigoRetencion)

| Codigo | Porcentaje |
|--------|------------|
| `'1'` | 30% |
| `'2'` | 70% |
| `'3'` | 100% |

(Catalogo completo: usa `catalogRegistry.list('retencion-iva')`)

---

## Configuracion avanzada

### Reintentos y polling

```typescript
new FacturacionElectronicaEC({
  // ...config
  authorizationDelayMs: 1500,    // Delay antes de consultar autorizacion
  maxError70Retries: 3,          // SRI Error 70 (clave duplicada/procesando)
  maxSendRetries: 2,             // Retries para errores HTTP
  sendRetryDelayMs: 2000,
});
```

### Override de adaptadores

```typescript
import { SriClient } from 'facturacion-electronica-ec';

const sriClient = new SriClient({
  logger: console,
  timeoutMs: 60000,
  fetch: customFetch,    // Usar tu propio fetch (proxy, etc.)
});

new FacturacionElectronicaEC({
  // ...config
  sriClient,
});
```

### Logger personalizado

```typescript
import winston from 'winston';

const logger = winston.createLogger({ /* ... */ });

new FacturacionElectronicaEC({
  // ...config
  logger,    // winston cumple la interfaz Logger
});
```

---

## Riesgos conocidos

| Riesgo | Severidad | Mitigacion |
|--------|-----------|------------|
| `ec-sri-invoice-signer` private import para liquidacionCompra | Media | Encapsulado en `EcSriSigner`. `ISigner` permite reemplazo total. |
| Catalogos del SRI quedan obsoletos | Baja | `catalogRegistry.override()` en runtime sin esperar release. |
| XSD del SRI publicados feb 2022 | Baja | XSD en `vendor/sri/xsd/` con checksums SHA-256. Reemplazables. |
| `numDocSustento` con guiones en retencion | N/A | La libreria normaliza automaticamente (15 digitos sin guiones). |

---

## Desarrollo y contribucion

```bash
git clone https://github.com/cuymo/facturacion-electronica-ec.git
cd facturacion-electronica-ec
pnpm install
pnpm -r build
npx vitest run     # 98 unit tests
```

### Integration tests (requiere .p12 de pruebas)

```bash
cp .env.test.example .env.test
# Edita .env.test con tu certificado de pruebas
node tests/sdk/run-full-validation.mjs
```

Los tests de integracion estan **hardcoded a SRI PRUEBAS** (`ambiente: '1'`). Un safeguard bloquea cualquier intento de usar produccion.

## Licencia

MIT — Copyright (c) 2026 contributors

## Enlaces

- **GitHub**: https://github.com/cuymo/facturacion-electronica-ec
- **NPM**: https://www.npmjs.com/package/facturacion-electronica-ec
- **Issues**: https://github.com/cuymo/facturacion-electronica-ec/issues
- **SRI Ecuador**: https://www.sri.gob.ec/facturacion-electronica
