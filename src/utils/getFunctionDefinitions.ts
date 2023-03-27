import { randomUUID } from "crypto";
import { Position, Range, TextDocument } from "vscode-languageserver";

export interface FunctionDefinition {
  id: string;
  name: string;
  range: Range;
  uri: string;
}

// export function getFunctionDefinitions(
//   document: TextDocument
// ): FunctionDefinition[] {
//   const functionRegex = /function\s+\[?[^\]]*\]?\s*(\w+)\s*=\s*([^(]+)/g;
//   const anonymousFunctionRegex = /@\(?.*\)?\s*(\w+)\s*(?=@|\(|\s*=)/g;
//
//   const functionDefinitions: FunctionDefinition[] = [];
//
//   const lines = document.getText().split(/\r?\n/);
//   let currentFunctionName: string | null = null;
//
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//
//     const functionMatch = functionRegex.exec(line);
//     if (functionMatch) {
//       const functionName = functionMatch[1];
//       const functionArgs = functionMatch[2].trim().split(/\s*,\s*/);
//       const startPosition = { line: i, character: functionMatch.index };
//       currentFunctionName = functionName;
//       functionDefinitions.push({
//         id: randomUUID(),
//         name: functionName,
//         args: functionArgs,
//         startPosition,
//       });
//       continue;
//     }
//
//     const anonymousFunctionMatch = anonymousFunctionRegex.exec(line);
//     if (anonymousFunctionMatch) {
//       const functionName = currentFunctionName || "anonymous";
//       const functionArgs = anonymousFunctionMatch[1].trim().split(/\s*,\s*/);
//       const startPosition = {
//         line: i,
//         character: anonymousFunctionMatch.index,
//       };
//       functionDefinitions.push({
//         id: randomUUID(),
//         name: functionName,
//         args: functionArgs,
//         startPosition,
//       });
//     }
//   }
//
//   return functionDefinitions;
// }

export function getFunctionDefinitions(document: TextDocument): FunctionDefinition[] {
  const definitions: FunctionDefinition[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  let functionStart: Position | null = null;
  let functionName: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (functionStart !== null && functionName !== null) {
      // Check for end of function definition
      if (line.trim().startsWith("end") || line.trim().startsWith("endfunction")) {
        const range = Range.create(functionStart, Position.create(i, line.length));
        definitions.push({ id: randomUUID(), name: functionName, range, uri: document.uri });
        functionStart = null;
        functionName = null;
      }
    } else {
      // Check for start of function definition
      const match = line.match(/^(function|@)\s+(\[?\w+\]?\s*=)?\s*(\w+)\s*\(/i);
      if (match) {
        functionName = match[3];
        functionStart = Position.create(i, match.index || 0);
      }
    }
  }

  return definitions;
}
