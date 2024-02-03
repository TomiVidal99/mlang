import {
  readFileSync,
  existsSync,
  lstatSync,
  readlinkSync,
  readdirSync,
} from 'fs';
import { URI } from 'vscode-uri';
import { expandPath } from './expandPath';
import { connection, docManager } from '../server';
import { join, dirname } from 'path';

let counter = 0;

/**
 * Adds a new TextDocument to the docManager list
 * if it fails it returns a list of filepaths that failed, else returns an empty array
 */
export function addNewDocumentFromPath(filepath: string): string[] {
  const expandedPath = expandPath(filepath);
  const failedPaths: string[] = [];

  // CAN BE SYMLINK AND A FOLDER -> CASE THAT THROWS ERROR

  connection.window.showInformationMessage('reading: ' + filepath);

  if (counter > 20) {
    connection.window.showErrorMessage('exceeded calls');
    return [];
  }

  if (existsSync(expandedPath)) {
    try {
      const stats = lstatSync(expandedPath);

      if (stats.isFile()) {
        // It's a regular file
        const text = readFileSync(expandedPath, 'utf8').toString();
        const uri = URI.file(expandedPath).toString();
        docManager.set(uri, text);
        return [];
      } else if (stats.isDirectory()) {
        // It's a directory, handle directory-specific logic if needed
        const files = readdirSync(expandedPath);
        files.forEach((file) => {
          const filePath = join(expandedPath, file);
          failedPaths.push(...addNewDocumentFromPath(filePath));
        });
        return failedPaths;
      } else if (stats.isSymbolicLink()) {
        // its a symbolic link
        const symlinkTarget = readlinkSync(expandedPath);
        if (symlinkTarget) {
          const actualFilePath = join(dirname(expandedPath), symlinkTarget);
          if (existsSync(actualFilePath)) {
            // return addNewDocumentFromPath(actualFilePath);
            counter++;
            const text = readFileSync(expandedPath, 'utf8').toString();
            const uri = URI.file(expandedPath).toString();
            docManager.set(uri, text);
            return [];
          }
        }
        return [expandedPath];
      }
      return [expandedPath];
    } catch (err) {
      connection.window.showErrorMessage(err.toString());
      return [expandedPath];
    }
  }

  return failedPaths;
}
