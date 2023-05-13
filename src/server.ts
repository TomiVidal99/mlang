import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
} from "vscode-languageserver/node";
import * as fs from "fs";
import * as path from "path";

import { TextDocument } from "vscode-languageserver-textdocument";
import { ISettings, completionData, globalSettings } from "./data";
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
import { getAllMFiles } from "./managers";

const CHANGE_CONTENT_DELAY_MS = 150;
let onChangeContentDelay: NodeJS.Timer | undefined;

export const connection = createConnection(ProposedFeatures.all);
export const documentSettings = new Map<string, Thenable<ISettings>>();
export const documentData: DocumentData[] = [];

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
    updateDocumentData(change.document, (data) => {
      // TODO: maybe think of a better way to handle this case
      // this is because the update of the diagnostics for references and such
      // must be ran after the document has read all the other files
      cleanUnreferencedDocuments(change.document.uri);
      data.postUpdateHooks();
    });
    updatePostParsingDiagnostics();
  }, CHANGE_CONTENT_DELAY_MS);
});
connection.onCompletion((params) => handleOnCompletion({ params: params }));

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

/**
 * Returns the depth in blocks of the cursor.
 */
function getDepthOfCursor(): number {
  return 0;
}

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

function getAllVariableDefinitions(currentDoc: DocumentData): string[] {
  return [...documentData
    .filter((d) =>
      currentDoc
        .getReferences()
        .map((ref) => ref.name)
        .includes(d.getFileName())
    )
    .flatMap((d) =>
      d
        .getVariableDefinitions()
        .filter((ref) => ref.depth === 0)
        .map((ref) => ref.name)
    ),
  ...documentData
    .filter((d) =>
      currentDoc
        .getFunctionsReferences()
        .map((ref) => ref.name)
        .includes(d.getFileName())
    )
    .flatMap((d) =>
      d
        .getVariableDefinitions()
        .filter((ref) => ref.depth === 0)
        .map((ref) => ref.name)
    ),
  ...currentDoc.getVariableDefinitions()
    .filter((def) => def.depth === 0)
    .map((def) => def.name)
  ];
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
        variablesDefinitions: getAllVariableDefinitions(data),
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

function getValidFunctionsReferencesNames(currentDoc: DocumentData): string[] {
  const a = [
    ...documentData
      .filter((d) =>
        currentDoc
          .getReferences()
          .map((ref) => ref.name)
          .includes(d.getFileName())
      )
      .flatMap((d) =>
        d
          .getFunctionsDefinitions()
          // .filter((ref) => ref.depth === 0)
          .map((ref) => ref.name)
      ),
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
          // .filter((ref) => ref.depth === 0)
          .map((ref) => ref.name)
      ),
    ...currentDoc.getFunctionsDefinitions().map((def) => def.name),
    ...documentData.flatMap((data) =>
      data.getExportedFunctions().map((ref) => ref.name)
    ),
  ];
  // log("a: " + JSON.stringify(a));
  return a;
}

/**
  * Checks that all documents are referencing to the listed documents.
  * if any document in the list it's not referenced will be removed.
  */
function cleanUnreferencedDocuments(currentDocumentURI: string): void {
  const referencedPaths = documentData.flatMap((data) => data.getLocallyReferencedPaths());
  if (globalSettings.enableInitFile && globalSettings.defaultInitFile) {
    referencedPaths.push(...getAllFilepathsFromPath(globalSettings.defaultInitFile));
  }
  documentData.forEach((data) => {
    if (data.getURI() !== currentDocumentURI && !referencedPaths.includes(data.getDocumentPath())) {
      // log(`the doc ${data.getDocumentPath()} should not be referenced.`);
      // log(`before removal docs: ${JSON.stringify(documentData.map((d) => d.getFileName()))}`);
      documentData.splice(documentData.indexOf(data), 1);
      // log(`after removal docs: ${JSON.stringify(documentData.map((d) => d.getFileName()))}`);
    }
  });

  // log(JSON.stringify(documentData.map((d) => d.getFileName())));
}
