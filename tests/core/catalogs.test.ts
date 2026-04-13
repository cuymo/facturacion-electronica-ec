import { describe, it, expect, beforeEach } from "vitest";
// Initialize catalogs
import "../../packages/core/src/catalogs/index.js";
import { catalogRegistry } from "../../packages/core/src/catalogs/catalog-registry.js";

describe("CatalogRegistry", () => {
  beforeEach(() => {
    catalogRegistry.resetAll();
  });

  it("should have default catalogs registered", () => {
    const catalogs = catalogRegistry.listCatalogs();
    expect(catalogs).toContain("impuestos-iva");
    expect(catalogs).toContain("formas-pago");
    expect(catalogs).toContain("tipos-identificacion");
    expect(catalogs).toContain("tipos-comprobante");
  });

  it("should look up IVA 15%", () => {
    const entry = catalogRegistry.get("impuestos-iva", "4");
    expect(entry).toBeDefined();
    expect(entry!.rate).toBe(15);
    expect(entry!.description).toContain("15%");
  });

  it("should look up IVA 0%", () => {
    const entry = catalogRegistry.get("impuestos-iva", "0");
    expect(entry).toBeDefined();
    expect(entry!.rate).toBe(0);
  });

  it("should override a catalog entry", () => {
    catalogRegistry.override("impuestos-iva", {
      "4": { code: "4", description: "IVA 16%", rate: 16 },
    });

    const entry = catalogRegistry.get("impuestos-iva", "4");
    expect(entry!.rate).toBe(16);
    expect(entry!.description).toContain("16%");
  });

  it("should reset to defaults after override", () => {
    catalogRegistry.override("impuestos-iva", {
      "4": { code: "4", description: "IVA 20%", rate: 20 },
    });

    catalogRegistry.reset("impuestos-iva");

    const entry = catalogRegistry.get("impuestos-iva", "4");
    expect(entry!.rate).toBe(15);
  });

  it("should track metadata", () => {
    const meta = catalogRegistry.getMeta("impuestos-iva");
    expect(meta).toBeDefined();
    expect(meta!.source).toContain("SRI");
  });

  it("should update metadata on override", () => {
    catalogRegistry.override(
      "impuestos-iva",
      { "99": { code: "99", description: "Test", rate: 99 } },
      { source: "Custom override", updatedAt: "2026-06-01" }
    );

    const meta = catalogRegistry.getMeta("impuestos-iva");
    expect(meta!.source).toBe("Custom override");
  });

  it("should list all entries in a catalog", () => {
    const entries = catalogRegistry.list("formas-pago");
    expect(entries.length).toBeGreaterThan(5);
    expect(entries.some((e) => e.code === "01")).toBe(true);
  });

  it("should throw on override of non-existent catalog", () => {
    expect(() =>
      catalogRegistry.override("non-existent", {
        "1": { code: "1", description: "test" },
      })
    ).toThrow(/not found/);
  });
});
