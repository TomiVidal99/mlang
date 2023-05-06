import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
} from "vscode-languageserver/node";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { TextDocument } from "vscode-languageserver-textdocument";
import { ISettings, completionData } from "./data";
import {
  getDocumentsToBeExecutable,
  handleOnCompletion,
  handleOnDefinition,
  handleOnDidChangeConfiguration,
  handleOnInitialize,
  handleOnInitialized,
  handleOnReference,
} from "./handlers";
import {
  DocumentData,
  addNewDocument,
  formatURI,
  getPathType,
  updateDocumentData,
} from "./utils";
import { getFilesInWorkspace } from "./managers";

const CHANGE_CONTENT_DELAY_MS = 300;
let onChangeContentDelay: NodeJS.Timer | undefined;

export const connection = createConnection(ProposedFeatures.all);
export const documentSettings = new Map<string, Thenable<ISettings>>();
export const documentData: DocumentData[] = [];

const documents = new TextDocuments<TextDocument>(TextDocument);

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
connection.onInitialize((params) => handleOnInitialize({ params, connection }));
connection.onInitialized(() => handleOnInitialized({ connection }));
// connection.onDidOpenTextDocument((params) => handleDidOpenTextDocument({params}));
connection.onDefinition((params) => handleOnDefinition({ params, documents }));
connection.onReferences((params) => handleOnReference({ params, documents }));
connection.onDidChangeConfiguration((change) =>
  handleOnDidChangeConfiguration({ documents, change, connection })
);
documents.onDidClose((e) => {
  // Only keep settings for open documents
  documentSettings.delete(e.document.uri);
});
documents.onDidChangeContent((change) => {
  if (onChangeContentDelay) {
    clearTimeout(onChangeContentDelay);
  }

  // validateTextDocument(change.document, hasConfigurationCapability, connection); // detects al CAPS
  // updateCompletionList({document: change.document});

  // log(JSON.stringify(documentData.map((d) => d.getDocumentPath())));

  onChangeContentDelay = setTimeout(async () => {
    updateDocumentData(change.document);
    updatePostParsingDiagnostics(change.document.uri);
  }, CHANGE_CONTENT_DELAY_MS);
});
connection.onCompletion((params) => handleOnCompletion({ params: params }));

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

export function addDocumentsFromPath(filepath: string | null): boolean {
  const expandedFilepath = path.resolve(filepath).replace("~", os.homedir());
  log("expandedFilepath: " + expandedFilepath);
  const checkedPath = getPathType(expandedFilepath);
  log("adding path: " + expandedFilepath);
  switch (checkedPath) {
    case "file":
      try {
        const content = fs.readFileSync(expandedFilepath, "utf8");
        const doc = TextDocument.create(
          formatURI(expandedFilepath),
          "octave",
          1,
          content
        );
        addNewDocument(doc);
        fs.closeSync(fs.openSync(expandedFilepath, "r"));
        return true;
      } catch (e) {
        log(
          `ERROR: Failed to create document from path ${expandedFilepath}: ${e}`
        );
        return false;
      }
    case "dir":
      getFilesInWorkspace({ workspace: expandedFilepath }).forEach((doc) => {
        addNewDocument(doc);
      });
      return true;
    case "none":
      log("ERROR: NONE");
      return false;
  }
}

export function getAllFilesInProject(): string[] {
  const files = documentData.map((data) =>
    path.basename(data.getDocumentPath(), ".m")
  );
  return files;
}

/**
 * Checks that references are ok, else send diagnostics.
 */
function updatePostParsingDiagnostics(uri: string): void {
  const allFilesInProject = getAllFilesInProject();
  documentData.forEach((data) => {
    connection.sendDiagnostics(
      data.getDiagnostics({
        allFilesInProject,
        functionsDefinitions: [
          // ...getValidFunctionsReferencesNames(),
          ...completionData.map((data) => data.label),
          ...getDocumentsToBeExecutable({ currentDocument: data.getURI() }).map(
            (item) => item.label
          ),
        ],
      })
    );
  });
}

// TODO: make this
function getValidFunctionsReferencesNames(): string[] {
  const localDefinitions: string[] = [];
  // const localDefinitions = documentData.flatMap((data) =>
  //   data
  //     .getFunctionsReferences()
  //     .filter((ref) => ref.name === path.basename(data.getFileName()))
  //     .map((ref) => ref.name)
  // );
  // log("documentData: " + JSON.stringify(documentData.map((data) => data.getDocumentPath())));
  // log("localDefinitions: " + JSON.stringify(localDefinitions));
  return [...localDefinitions];
}
