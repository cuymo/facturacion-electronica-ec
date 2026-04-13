import type { DocumentType } from "@facturaya/core";

/**
 * Provides sequential document numbers.
 *
 * Consumers MUST implement this interface backed by their own
 * persistence layer (database, file, etc.) for production use.
 *
 * The SDK does NOT ship a default production-ready provider.
 * UnsafeMemorySequenceProvider is available for tests/examples only.
 */
export interface ISequenceProvider {
  /**
   * Get the next sequential number for the given emission point and document type.
   * Must return a 9-digit zero-padded string, e.g. "000000001".
   *
   * Implementations should ensure atomicity to prevent duplicate sequences
   * under concurrent access.
   */
  next(
    establecimiento: string,
    puntoEmision: string,
    documentType: DocumentType
  ): Promise<string>;

  /**
   * Roll back a sequence that was consumed but not used successfully.
   * Called when SRI returns DEVUELTO (reception rejected), meaning
   * the sequence is safe to reuse.
   *
   * Optional. If not implemented, sequences are never rolled back.
   */
  rollback?(
    establecimiento: string,
    puntoEmision: string,
    documentType: DocumentType
  ): Promise<void>;
}

/**
 * In-memory sequence provider for testing and examples ONLY.
 *
 * WARNING: This provider is NOT safe for production use because:
 * - State is lost on process restart
 * - Not atomic under concurrent access
 * - No persistence
 *
 * Use it only for tests, examples, and development.
 */
export class UnsafeMemorySequenceProvider implements ISequenceProvider {
  private counters = new Map<string, number>();

  private key(
    establecimiento: string,
    puntoEmision: string,
    documentType: DocumentType
  ): string {
    return `${establecimiento}:${puntoEmision}:${documentType}`;
  }

  async next(
    establecimiento: string,
    puntoEmision: string,
    documentType: DocumentType
  ): Promise<string> {
    const k = this.key(establecimiento, puntoEmision, documentType);
    const current = this.counters.get(k) ?? 0;
    const next = current + 1;
    this.counters.set(k, next);
    return next.toString().padStart(9, "0");
  }

  async rollback(
    establecimiento: string,
    puntoEmision: string,
    documentType: DocumentType
  ): Promise<void> {
    const k = this.key(establecimiento, puntoEmision, documentType);
    const current = this.counters.get(k) ?? 0;
    if (current > 0) {
      this.counters.set(k, current - 1);
    }
  }

  /** Reset all counters. Useful in tests. */
  reset(): void {
    this.counters.clear();
  }

  /** Set a specific counter value. Useful for migration scenarios in tests. */
  set(
    establecimiento: string,
    puntoEmision: string,
    documentType: DocumentType,
    value: number
  ): void {
    this.counters.set(
      this.key(establecimiento, puntoEmision, documentType),
      value
    );
  }
}
