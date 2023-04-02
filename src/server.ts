import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
  TextDocumentPositionParams,
  Diagnostic,
  PublishDiagnosticsParams,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { ISettings } from "./data";
import { handleDidOpenFile, handleDidOpenTextDocument, handleOnCompletion, handleOnDefinition, handleOnDidChangeConfiguration, handleOnInitialize, handleOnInitialized, updateCompletionList, validateTextDocument } from "./handlers";
import { handleOnReference } from "./handlers/handleOnReference";
import { formatURI } from "./utils";
import { handleOnDidChangeContent } from "./handlers/handleDidChangeTextDocument";
import { handleOnDidSave } from "./handlers/handleDidSaveTextDocument";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments<TextDocument>(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

// Cache the settings of all open documents
export const documentSettings = new Map<string, Thenable<ISettings>>();

export function log(message: string): void {
  // TODO: this is only for dev purposes
  // return;
  connection.sendRequest("window/showMessage", {
    type: MessageType.Info,
    message,
  });
}

documents.onDidChangeContent((change) => handleOnDidChangeContent({change}));
documents.onDidOpen((change) => handleDidOpenFile({change}));
documents.onDidSave((change) => handleOnDidSave({change}));
connection.onInitialize((params) => handleOnInitialize({ params, hasDiagnosticRelatedInformationCapability, hasWorkspaceFolderCapability, hasConfigurationCapability, connection }));
connection.onInitialized(() => handleOnInitialized({ hasConfigurationCapability, hasWorkspaceFolderCapability, connection }));
connection.onDidOpenTextDocument((params) => handleDidOpenTextDocument({params}));
connection.onDefinition((params) => handleOnDefinition({ params, documents }));
connection.onReferences((params) => handleOnReference({params}));
connection.onDidChangeConfiguration((change) => handleOnDidChangeConfiguration({ documents, change, hasConfigurationCapability, connection }));
documents.onDidClose((e) => {
  // Only keep settings for open documents
  documentSettings.delete(e.document.uri);
});
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document, hasConfigurationCapability, connection);
  log("Changed");
  updateCompletionList({document: change.document});
});

// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams) => handleOnCompletion({documentPosition: _textDocumentPosition, documents}));

// This handler resolves additional information for the item selected in
// the completion list.
// connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
//   if (item.data === 1) {
//     item.detail = "TypeScript details";
//     item.documentation = "TypeScript documentation";
//   }
//   return item;
// });

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change
  connection.console.log("We received an file change event");
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

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
  return connection.sendDiagnostics(params);
}

