import { Diagnostic, DiagnosticSeverity, TextDocument, _Connection } from "vscode-languageserver";
import { ISettings, defaultSettings, globalSettings } from "../data";
import { documentSettings } from "../server";

export function getDocumentSettings(
  resource: string,
  hasConfigurationCapability: boolean,
  connection: _Connection
): Thenable<ISettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (result == null) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "settings",
    });

    documentSettings.set(resource, result);
  }
  return result || defaultSettings;
}

export async function validateTextDocument(
  textDocument: TextDocument,
  hasConfigurationCapability: boolean,
  connection: _Connection
): Promise<void> {
  // In this simple example we get the settings for every validate run.
  const settings = await getDocumentSettings(
    textDocument.uri,
    hasConfigurationCapability,
    connection
  );

  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();
  const pattern = /\b[A-Z]{2,}\b/g;
  let m: RegExpExecArray | null;

  let problems = 0;
  const diagnostics: Diagnostic[] = [];
  while (
    (m = pattern.exec(text)) != null &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `${m[0]} is all uppercase.`,
      source: "ex",
    };
    // if (hasDiagnosticRelatedInformationCapability) {
    // 	diagnostic.relatedInformation = [
    // 		{
    // 			location: {
    // 				uri: textDocument.uri,
    // 				range: Object.assign({}, diagnostic.range)
    // 			},
    // 			message: 'Spelling matters'
    // 		},
    // 		{
    // 			location: {
    // 				uri: textDocument.uri,
    // 				range: Object.assign({}, diagnostic.range)
    // 			},
    // 			message: 'Particularly for names'
    // 		}
    // 	];
    // }
    diagnostics.push(diagnostic);
  }

  // Send the computed diagnostics to client.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
