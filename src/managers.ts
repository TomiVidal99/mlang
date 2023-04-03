/*
 * These manager holds data from the files in the workspace.
 */

import { TextDocument } from "vscode-languageserver-textdocument";
import { log} from "./server";
import * as fs from "fs";
import * as path from "path";
import { FunctionDefinition, getFunctionDefinitions } from "./utils";
import {
  Diagnostic,
  DiagnosticSeverity,
  _Connection,
} from "vscode-languageserver";

export const readDocuments: string[] = [];
export const functionsMap = new Map<string, FunctionDefinition>();

type DiagnosticTupleType = [string, Diagnostic[]];

export function getFilesInWorkspace({
  workspace,
}: {
  workspace: string;
}): TextDocument[] {
  const files = getAllMFiles(workspace);
  // log(`name: ${workspace}`);
  const documents = files.map((file) => {
    // log(`file (${i}): ${file}`);
    const uri = path.resolve(file);
    const content = fs.readFileSync(file, "utf-8");
    const document = TextDocument.create(uri, "octave", 1, content);
    return document;
  });

  return documents;
}

export function updateFunctionList({
  documents,
}: {
  documents: TextDocument[];
}): void {
  const diagnostics: DiagnosticTupleType[] = [];
  documents.forEach((doc) => {
    const functions = getFunctionDefinitions(doc);
    const currentDocFunctionsMap = new Map<string, FunctionDefinition>();
    const currentFileDiagnostics: Diagnostic[] = [];
    readDocuments.push(doc.uri);
    functions.forEach((func) => {
      // TODO: check if a function defined as a script in a file matches other definitions
      // (if both file and functin referece have to same name only show one of them)
      const localDiagnostics = checkIfFunctionAlreadyExists({
        currentFunction: func,
        functionsInDoc: currentDocFunctionsMap,
      });
      currentDocFunctionsMap.set(func.id, func);
      currentFileDiagnostics.push(...localDiagnostics);
      Array.from(functionsMap).filter(([name, f]) => {
        return f.range.start === func.range.start;
      }).length > 0
        ? null
        : (function(){functionsMap.set(func.id, func); log("adding: " + func.name);}());
    });
    if (currentFileDiagnostics.length > 0) {
      const diagnosticTuple: DiagnosticTupleType = [
        doc.uri,
        currentFileDiagnostics,
      ];
      diagnostics.push(diagnosticTuple);
    }
  });

  // Send the computed diagnostics to client.
  if (diagnostics.length > 0) {
    diagnostics.forEach(([uri, diagnostics]) => {
      // TODO: check why diagnostics are not working
      sendDiagnostics({ uri, diagnostics });
    });
  }
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

function checkIfFunctionAlreadyExists({
  functionsInDoc,
  currentFunction,
}: {
  functionsInDoc: Map<string, FunctionDefinition>;
  currentFunction: FunctionDefinition;
}): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  functionsInDoc.forEach((func) => {
    if (func.name === currentFunction.name) {
      // log(`Found redefined function! ${func.name} in (${func.uri}), matched (${currentFunction.uri})`);
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: currentFunction.range,
        message: `"${func.name}" it's already defined.`,
        source: "mlang",
      };
      diagnostics.push(diagnostic);
    }
  });
  return diagnostics;
}
