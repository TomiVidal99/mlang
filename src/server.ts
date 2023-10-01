import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { ISettings } from "./data";

export const connection = createConnection(ProposedFeatures.all);
export const documentSettings = new Map < string, Thenable<ISettings>>();

  const documents = new TextDocuments<TextDocument>(TextDocument);

    export function logError(message: string): void {
      connection.sendRequest("window/showMessage", {
        type: MessageType.Info,
        message,
      });
}

    export function log(message: string | object): void {
      // TODO: this is only for dev purposes
      // return;
      connection.sendRequest("window/showMessage", {
        type: MessageType.Info,
        message: typeof message === "string" ? message : JSON.stringify(message),
      });
}

// documents.onDidChangeContent((change) => handleOnDidChangeContent({change}));
// documents.onDidOpen((change) => handleDidOpenFile({change}));
// documents.onDidSave((change) => handleOnDidSave({change}));
// connection.onInitialize((params) => handleOnInitialize({params, connection}));
// connection.onInitialized((params) =>
//   handleOnInitialized({params, connection})
// );
// connection.onDidOpenTextDocument((params) => handleDidOpenTextDocument({params}));
// connection.onDefinition((params) => handleOnDefinition({params, documents}));
// connection.onReferences((params) => handleOnReference({params, documents}));
// connection.onDidChangeConfiguration((change) =>
//   handleOnDidChangeConfiguration({})
// );
// connection.workspace.onDidDeleteFiles((event) => {
      // });
      documents.onDidClose((e) => {
        // Only keep settings for open documents
        documentSettings.delete(e.document.uri);
      });
// documents.onDidChangeContent((change) => {
      // });
      // connection.onCompletion((params) => handleOnCompletion({ params: params }));

      // Make the text document manager listen on the connection
      // for open, change and close text document events
      documents.listen(connection);

    // Listen on the connection
    connection.listen();
