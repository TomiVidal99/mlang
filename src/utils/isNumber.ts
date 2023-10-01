export function isNumber(str: string): boolean {
  return !isNaN(parseFloat(str));
}
