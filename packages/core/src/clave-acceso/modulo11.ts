/**
 * SRI Modulo 11 check digit algorithm.
 *
 * Extracted from EmiteYa document.datasource.impl.ts.
 * Pure function -- no logging, no side effects.
 *
 * Weights cycle: 2,3,4,5,6,7 applied from RIGHT to LEFT.
 * Special cases: result 11 -> '0', result 10 -> '1'.
 */
export function computeModulo11(digits: string): string {
  const weights = [2, 3, 4, 5, 6, 7];
  let sum = 0;

  for (let i = digits.length - 1, w = 0; i >= 0; i--, w++) {
    const digit = parseInt(digits[i]!, 10);
    const weight = weights[w % weights.length]!;
    sum += digit * weight;
  }

  const remainder = sum % 11;
  const result = 11 - remainder;

  if (result === 11) return "0";
  if (result === 10) return "1";
  return result.toString();
}
