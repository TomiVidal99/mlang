import { randomUUID } from "crypto";
import { Position, Range, TextDocument } from "vscode-languageserver";

export interface IKeyword {
  id: string;
  name: string;
  range: Range;
  uri: string;
}

export function getFunctionDefinitions(document: TextDocument): IKeyword[] {
  const definitions: IKeyword[] = [];
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
