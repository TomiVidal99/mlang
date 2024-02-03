/**
 * Removes the quotes from a given string to get only the content
 */
export function cleanStringArg(str: string): string {
  return str.replace(/^["'](.*)["']$/, '$1');
}
