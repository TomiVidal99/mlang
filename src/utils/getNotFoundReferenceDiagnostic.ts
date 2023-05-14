import {
  Range,
  Diagnostic,
  DiagnosticSeverity,
  Position,
} from "vscode-languageserver";

export function getNotFoundReferenceDiagnostic(name: string, lineNumber: number): Diagnostic {
  const diagnostic: Diagnostic = {
    range: Range.create(
      Position.create(lineNumber, 0),
      Position.create(lineNumber, 0)
    ),
    message: `reference '${name}' not found. At line ${(
      lineNumber + 1
    ).toString()}`,
    severity: DiagnosticSeverity.Error,
    source: "mlang",
  };
  return diagnostic;
}
