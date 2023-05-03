import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
  PublishDiagnosticsParams,
  ConnectionError,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { ISettings } from "./data";
import { handleOnCompletion, handleOnDefinition, handleOnDidChangeConfiguration, handleOnInitialize, handleOnInitialized, handleOnReference } from "./handlers";
import { DocumentData, updateDocumentData  } from "./utils";

export const connection = createConnection(ProposedFeatures.all);
export const documentSettings = new Map<string, Thenable<ISettings>>();
export const documentData: DocumentData[] = [];

const documents = new TextDocuments<TextDocument>(TextDocument);

export function log(message: string): void {
  // TODO: this is only for dev purposes
  // return;
  connection.sendRequest("window/showMessage", {
    type: MessageType.Info,
    message,
  });
}

// documents.onDidChangeContent((change) => handleOnDidChangeContent({change}));
// documents.onDidOpen((change) => handleDidOpenFile({change}));
// documents.onDidSave((change) => handleOnDidSave({change}));
connection.onInitialize((params) => handleOnInitialize({ params, connection }));
connection.onInitialized(() => handleOnInitialized({ connection, documents }));
// connection.onDidOpenTextDocument((params) => handleDidOpenTextDocument({params}));
connection.onDefinition((params) => handleOnDefinition({ params, documents }));
connection.onReferences((params) => handleOnReference({params, documents}));
connection.onDidChangeConfiguration((change) => handleOnDidChangeConfiguration({ documents, change, connection }));
documents.onDidClose((e) => {
  // Only keep settings for open documents
  documentSettings.delete(e.document.uri);
});
documents.onDidChangeContent((change) => {
  // validateTextDocument(change.document, hasConfigurationCapability, connection); // detects al CAPS
  // updateCompletionList({document: change.document});
  updateDocumentData(change.document);
});
connection.onCompletion((params) => handleOnCompletion({documentPosition: params, documents}));

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
