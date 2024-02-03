import fs from 'fs';
import path from 'path';

/**
 * Returns all the paths of all .m files in the given folder
 * @param srcPath string
 * @returns output/*.m string[]
 */
export function getAllMFiles(srcPath: string): string[] {
  const files: string[] = [];

  function traverseDir(currentDir: string) {
    const dirEntries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const dirEntry of dirEntries) {
      // const fullPath = `${currentDir}/${dirEntry.name}`;
      const fullPath = path.join(currentDir, dirEntry.name);
      if (dirEntry.isDirectory()) {
        traverseDir(fullPath);
      } else if (dirEntry.isFile() && dirEntry.name.endsWith('.m')) {
        files.push(fullPath);
      }
    }
  }

  traverseDir(srcPath);
  return files;
}
