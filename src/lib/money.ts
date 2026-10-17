/** ETH transport uses decimal strings. Calculations use integer wei, never floats. */
export function wei(value: string): bigint {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error("Valor ETH inválido");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"));
}
export function decimal(value: bigint): string {
  const fraction = (value % 10n ** 18n)
    .toString()
    .padStart(18, "0")
    .replace(/0+$/, "");
  return `${value / 10n ** 18n}${fraction ? `.${fraction}` : ""}`;
}
export function eth(value: string): string {
  const [a, b = ""] = value.split(".");
  return `${a}.${b.padEnd(2, "0")} ETH`;
}
export function times(value: string, quantity: number) {
  return decimal(wei(value) * BigInt(quantity));
}
