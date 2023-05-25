
/**
 * Given a string it returns all the comma separated values
 */
export function parseMultipleMatchValues(values: string, removeQuotes?: boolean): string[] {
  if (removeQuotes) {
    return !values || values === "" ? [] : values.split(",").map((arg) => arg.trim().replace(/'/g, "").replace(/"/g, ""));
  }
  return !values || values === "" ? [] : values.split(",").map((arg) => arg.trim());
}
