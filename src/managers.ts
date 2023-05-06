/*
 * These manager holds data from the files in the workspace.
 */

import { TextDocument } from "vscode-languageserver-textdocument";
import * as fs from "fs";
import * as path from "path";
import { IKeyword, formatURI } from "./utils";
import { _Connection } from "vscode-languageserver";

export const readDocuments: string[] = [];
export const functionsMap = new Map<string, IKeyword>();

export function getFilesInWorkspace({
  workspace,
}: {
  workspace: string;
}): TextDocument[] {
  const files = getAllMFiles(workspace);
  // log(`name: ${workspace}`);
  const documents = files.map((file) => {
    // log(`file (${i}): ${file}`);
    const uri = formatURI(path.resolve(file));
    const content = fs.readFileSync(file, "utf-8");
    const document = TextDocument.create(uri, "octave", 1, content);
    return document;
  });

  return documents;
}

function getAllMFiles(rootDir: string): string[] {
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
