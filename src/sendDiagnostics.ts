import { Diagnostic, PublishDiagnosticsParams } from "vscode-languageserver";
import { connection } from "./server";
import { formatURI } from "./utils";
import { log } from "./server";

const diagnosticsBuffer: PublishDiagnosticsParams[] = [];

export async function sendDiagnostics({
  diagnostics,
  uri,
}: {
  diagnostics: Diagnostic[];
  uri: string;
}): Promise<void> {
  const formattedUri = formatURI(uri);
  // log(
  //   `got diagnostics to show ${JSON.stringify(
  //     diagnostics
  //   )}, path ${formattedUri}`
  // );
  const params: PublishDiagnosticsParams = {
    diagnostics: [...diagnostics],
    uri: formattedUri,
  };
  diagnosticsBuffer.push(params);
  //return connection.sendDiagnostics(params);
}

export function executeDiagnostics() {
  diagnosticsBuffer.forEach((params) => {
    connection.sendDiagnostics(params);
  });
}
