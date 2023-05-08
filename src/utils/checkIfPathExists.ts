import * as fs from "fs";
import { getAllFilepathsFromPath } from "../server";

/**
 * Returns weather a path or directory exists
 */
export function checkIfPathExists(path: string): boolean {
  getAllFilepathsFromPath(path).forEach((p) => {
    if(!fs.existsSync(p)) {
      return false;
    }
  });
  return true;
}
