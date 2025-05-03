import {
  readFileSync,
  existsSync,
  lstatSync,
  readlinkSync,
  readdirSync,
} from 'fs';
import { URI } from 'vscode-uri';
import { expandPath } from './expandPath';
import { join, dirname } from 'path';
import { globalSettings } from '../data';
import { docManager } from '../types/DocumentsManager';

/**
 * Adds a new TextDocument to the docManager list
 * if it fails it returns a list of filepaths that failed, else returns an empty array
 */
export function addNewDocumentFromPath(
  filepath: string,
  relativeDepth = 0,
): string[] {
  const expandedPath = expandPath(filepath);

  if (relativeDepth > globalSettings.maxNumberOfProblems) return [];

  try {
    if (existsSync(expandedPath)) {
      const stats = lstatSync(expandedPath);

      if (stats.isFile()) {
        // It's a regular file
        // connection.window.showInformationMessage('Found file: ' + expandedPath);

        // TODO: think how to make this always work with tests
        const uri = URI.file(expandedPath).toString();
        if (docManager.has(uri)) return [];
        const text = readFileSync(expandedPath, 'utf8').toString();
        docManager.set(uri, text);

        return [];
      } else if (stats.isDirectory()) {
        // It's a directory, handle directory-specific logic if needed
        const filesInDir = readdirSync(expandedPath);
        return filesInDir.flatMap((file) => {
          const filePath = join(expandedPath, file);
          return addNewDocumentFromPath(filePath, relativeDepth + 1);
        });
      } else if (stats.isSymbolicLink()) {
        // its a symbolic link
        const symlinkTarget = readlinkSync(expandedPath);
        if (symlinkTarget) {
          const actualPath = join(dirname(expandedPath), symlinkTarget);
          if (existsSync(actualPath)) {
            return addNewDocumentFromPath(actualPath, relativeDepth + 1);
          }
        }
        return [expandedPath];
      }
      return [expandedPath];
    }
  } catch (err) {
    // connection.window.showErrorMessage(err.toString());
    return [expandedPath];
  }

  return [];
}
