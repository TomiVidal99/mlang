export function getPathFromURI(URI: string): string {
  return URI.split("file://")[1].replace("%20", " ");
}
