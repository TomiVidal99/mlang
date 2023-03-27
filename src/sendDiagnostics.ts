import { Diagnostic, DocumentFormattingRequest } from "vscode-languageserver";
import {connection} from "./server";

export async function sendDiagnostics({diagnostics, uri}: {diagnostics: Diagnostic[], uri: string}): Promise<void> {
  const formattedUri = await connection.sendRequest(DocumentFormattingRequest.type, {textDocument: {uri}});
  return connection.sendDiagnostics({diagnostics, uri});
}
