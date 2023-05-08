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
  getPathFromURI,
  getPathType,
  updateDocumentData,
} from "./utils";
import { getAllMFiles } from "./managers";
import { IFunctionDefinition } from "./parser";

const CHANGE_CONTENT_DELAY_MS = 150;
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
connection.onInitialized((params) =>
  handleOnInitialized({ params, connection })
);
// connection.onDidOpenTextDocument((params) => handleDidOpenTextDocument({params}));
connection.onDefinition((params) => handleOnDefinition({ params, documents }));
connection.onReferences((params) => handleOnReference({ params, documents }));
connection.onDidChangeConfiguration((change) =>
  handleOnDidChangeConfiguration({ documents, change, connection })
);
connection.workspace.onDidDeleteFiles((event) => {
  documentData.forEach((data) => {
    if (event.files.map((f) => f.uri).includes(data.getURI())) {
      documentData.splice(documentData.indexOf(data), 1);
    }
  });
});
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
    updatePostParsingDiagnostics();
  }, CHANGE_CONTENT_DELAY_MS);
});
connection.onCompletion((params) => handleOnCompletion({ params: params }));

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

export function getAllFilepathsFromPath(p: string): string[] {
  let expandedFilepath = p;
  if (p.startsWith('~')) {
    expandedFilepath = expandedFilepath.replace('~', process.env.HOME || '');
  }
  expandedFilepath = path.resolve(expandedFilepath);
  const checkedPath = getPathType(expandedFilepath);
  switch (checkedPath) {
    case "file":
      try {
        return [expandedFilepath];
      } catch (e) {
        log(
          `ERROR: Failed to create document from path ${expandedFilepath}: ${e}`
        );
        return [];
      }
    case "dir":
      return getAllMFiles(expandedFilepath);
    case "none":
      log("ERROR: NONE");
      return [];
  }
}

export function addDocumentsFromPath(filepath: string | null): void {
  getAllFilepathsFromPath(filepath)
    .filter(
      (filepath) =>
        !documentData.map((data) => data.getDocumentPath()).includes(filepath)
    )
    .forEach((filepath) => {
      // log(filepath);
      const content = fs.readFileSync(filepath, "utf8");
      const doc = TextDocument.create(
        formatURI(filepath),
        "octave",
        1,
        content
      );
      addNewDocument(doc);
    });
}

export function getAllFilesInProject(): string[] {
  const files = documentData.map((data) =>
    path.basename(data.getDocumentPath(), ".m")
  );
  return files;
}

/**
 * Checks that references are ok, else send diagnostics.
 * TODO: distinguish between reference does not exist and should import the reference
 */
function updatePostParsingDiagnostics(): void {
  const allFilesInProject = getAllFilesInProject();
  documentData.forEach((data) => {
    connection.sendDiagnostics(
      data.getDiagnostics({
        allFilesInProject,
        functionsDefinitions: [
          ...getValidFunctionsReferencesNames(data),
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
function getValidFunctionsReferencesNames(currentDoc: DocumentData): string[] {
  // const localDefinitions: string[] = [];
  const defs = [
    ...documentData
      .filter((d) =>
        currentDoc
          .getFunctionsReferences()
          .map((ref) => ref.name)
          .includes(d.getFileName())
      )
      .flatMap((d) =>
        d
          .getFunctionsDefinitions()
          .filter((ref) => ref.depth === 0)
          .map((ref) => ref.name)
      ),
    ...currentDoc.getFunctionsDefinitions().map((def) => def.name),
    ...documentData.flatMap((data) =>
      data.getExportedFunctions().map((ref) => ref.name)
    ),
  ];
  return [...defs];
}
