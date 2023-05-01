/**
 * Given a string it returns all the comma separated values
 */
export function parseMultipleMatchValues(values: string): string[] {
  return values === "" ? [] : values.split(",").map((arg) => arg.trim());
}
