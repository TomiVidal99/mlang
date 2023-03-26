import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
  TextDocumentPositionParams,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { ISettings } from "./data";
import { handleOnCompletion, handleOnDefinition, handleOnDidChangeConfiguration, handleOnInitialize, handleOnInitialized, validateTextDocument } from ".";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments<TextDocument>(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

// Cache the settings of all open documents
export const documentSettings = new Map<string, Thenable<ISettings>>();

export function log(message: string): void {
  connection.sendRequest("window/showMessage", {
    type: MessageType.Info,
    message,
  });
}

connection.onInitialize((params) => handleOnInitialize({ params, hasDiagnosticRelatedInformationCapability, hasWorkspaceFolderCapability, hasConfigurationCapability }));
connection.onInitialized(() => handleOnInitialized({ hasConfigurationCapability, hasWorkspaceFolderCapability, connection }));
connection.onDefinition((params) => handleOnDefinition({ params, documents }));
connection.onDidChangeConfiguration((change) => handleOnDidChangeConfiguration({ documents, change, hasConfigurationCapability, connection }));
documents.onDidClose((e) => {
  // Only keep settings for open documents
  documentSettings.delete(e.document.uri);
});
documents.onDidChangeContent((change) => {
  // The content of a text document has changed. This event is emitted
  // when the text document first opened or when its content has changed.
  validateTextDocument(change.document, hasConfigurationCapability, connection);
});

// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams) => handleOnCompletion(_textDocumentPosition));

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
