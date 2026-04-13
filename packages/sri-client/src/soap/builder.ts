/**
 * SOAP envelope builders for SRI web services.
 * Ported from EmiteYa src/config/sri.adapter.ts.
 */

import { XMLBuilder } from "fast-xml-parser";

const soapBuilder = new XMLBuilder({
  ignoreAttributes: false,
  processEntities: false,
  suppressEmptyNode: false,
});

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

export function buildRecepcionEnvelope(xmlBase64: string): string {
  const body = soapBuilder.build({
    "soapenv:Envelope": {
      "@_xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
      "@_xmlns:ec": "http://ec.gob.sri.ws.recepcion",
      "soapenv:Header": "",
      "soapenv:Body": {
        "ec:validarComprobante": { xml: xmlBase64 },
      },
    },
  });
  return XML_DECLARATION + "\n" + body;
}

export function buildAutorizacionEnvelope(claveAcceso: string): string {
  const body = soapBuilder.build({
    "soapenv:Envelope": {
      "@_xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
      "@_xmlns:ec": "http://ec.gob.sri.ws.autorizacion",
      "soapenv:Header": "",
      "soapenv:Body": {
        "ec:autorizacionComprobante": {
          claveAccesoComprobante: claveAcceso,
        },
      },
    },
  });
  return XML_DECLARATION + "\n" + body;
}
