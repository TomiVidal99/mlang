export function formatURI(path: string): string {
  const prefix = "file://";
  const formattedToURI = `${prefix}${path.replace(/ /g, "%20")}`;
  return formattedToURI;
}
