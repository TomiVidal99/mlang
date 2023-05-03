import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
  PublishDiagnosticsParams,
  ConnectionError,
} from "vscode-languageserver/node";
import * as fs from "fs";
import * as os from "os";

import { TextDocument } from "vscode-languageserver-textdocument";
import { ISettings } from "./data";
import { handleOnCompletion, handleOnDefinition, handleOnDidChangeConfiguration, handleOnInitialize, handleOnInitialized, handleOnReference } from "./handlers";
import { DocumentData, addNewDocument, updateDocumentData  } from "./utils";
import { getFilesInWorkspace } from "./managers";

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
connection.onInitialized(() => handleOnInitialized({ connection }));
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

function checkPath(path: string): "file" | "dir" | "none" {
  try {
    const stat = fs.statSync(path);
    if (stat.isFile()) {
      return 'file';
    } else if (stat.isDirectory()) {
      return 'dir';
    } 
  } catch (err) {
    if (err.code === 'ENOENT') {
      return 'none';
    } else {
      throw err;
    }
  }
  return 'none';
}

export function addDocumentsFromPath(filepath: string | null): TextDocument | null {
  const checkedPath = checkPath(filepath);
  const validFilePath = filepath.replace("~", os.homedir());
  log("validFilePath: " + JSON.stringify(validFilePath));
  switch (checkedPath) {
    case "file":
      try {
        const content = fs.readFileSync(validFilePath, 'utf8');
        const doc = TextDocument.create(validFilePath, 'text', 1, content);
        addNewDocument(doc);
        fs.closeSync(fs.openSync(validFilePath, 'r'));
        return;
      } catch (e) {
        log(`ERROR: Failed to create document from path ${validFilePath}: ${e}`);
        return null;
      }
    case "dir":
      getFilesInWorkspace({workspace: validFilePath}).forEach((doc) => {
        addNewDocument(doc);
      });
      return;
    case "none":
      log("ERROR: NONE");
    return;
  }
}
