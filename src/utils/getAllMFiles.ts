import fs from 'fs';
import path from 'path';

export function getAllMFiles(rootDir: string): string[] {
  const files: string[] = [];

  function traverseDir(currentDir: string) {
    const dirEntries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const dirEntry of dirEntries) {
      //const fullPath = `${currentDir}/${dirEntry.name}`;
      const fullPath = path.join(currentDir, dirEntry.name);
      if (dirEntry.isDirectory()) {
        traverseDir(fullPath);
      } else if (dirEntry.isFile() && dirEntry.name.endsWith(".m")) {
        files.push(fullPath);
      }
    }
  }

  traverseDir(rootDir);
  return files;
}
