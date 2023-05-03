import * as fs from "fs";

/**
 * Returns weather a path it's a file, directory or none.
 * works also if the path it's a symlink.
 * @returns {"file" | "dir" | "none"}
 */
export function getPathType(path: string): "file" | "dir" | "none" {
  try {
    const stats = fs.lstatSync(path);

    if (stats.isFile()) {
      return "file";
    } else if (stats.isDirectory()) {
      return "dir";
    } else if (stats.isSymbolicLink()) {
      const targetPath = fs.realpathSync(path);
      // log("symlink: " + JSON.stringify(targetPath));
      if (fs.existsSync(targetPath)) {
        const targetStats = fs.statSync(targetPath);

        if (targetStats.isFile()) {
          return "file";
        } else if (targetStats.isDirectory()) {
          return "dir";
        } else {
          return "none";
        }
      } else {
        return "none";
      }
    } else {
      return "none";
    }
  } catch (e) {
    return "none";
  }
}
