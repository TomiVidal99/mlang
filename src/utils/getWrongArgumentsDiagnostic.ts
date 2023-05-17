import {
  Diagnostic,
  DiagnosticSeverity,
  Position,
  Range,
} from "vscode-languageserver";

export function getWrongArgumentsDiagnostic({
  name,
  refArgumentsLength,
  refLineNumber,
  defArgumentsLength,
  defOptionalArgsLength,
}: {
  name: string;
  refArgumentsLength: number;
  refLineNumber: number;
  defArgumentsLength: number;
  defOptionalArgsLength: number;
}): Diagnostic {
  const diagnostic: Diagnostic = {
    range: Range.create(
      Position.create(refLineNumber, 0),
      Position.create(refLineNumber, 0)
    ),
    message: 
    `expected ${(defArgumentsLength+defOptionalArgsLength).toString()} got ${refArgumentsLength.toString()} (${defArgumentsLength.toString()} required) arguments for '${name}'. At line ${(
      refLineNumber + 1
    ).toString()}`,
    severity: DiagnosticSeverity.Error,
    source: "mlang",
  };

  return diagnostic;
}
