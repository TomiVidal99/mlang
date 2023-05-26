import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
  Position,
} from "vscode-languageserver/node";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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
import { IFunctionDefinition, IReference, IVariableDefinition } from "./parser";

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
connection.onInitialized(() =>
  handleOnInitialized({ connection })
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
  // if (onChangeContentDelay) {
  //   clearTimeout(onChangeContentDelay);
  // }

  // validateTextDocument(change.document, hasConfigurationCapability, connection); // detects al CAPS
  // updateCompletionList({document: change.document});

  // log(JSON.stringify(documentData.map((d) => d.getDocumentPath())));

  // onChangeContentDelay = setTimeout(async () => {
    updateDocumentData(change.document, (data) => {
      // TODO: maybe think of a better way to handle this case
      // this is because the update of the diagnostics for references and such
      // must be ran after the document has read all the other files
      cleanUnreferencedDocuments(change.document.uri);
      data.postUpdateHooks();
    });
    updatePostParsingDiagnostics();
  // }, CHANGE_CONTENT_DELAY_MS);

});
connection.onCompletion((params) => handleOnCompletion({ params: params }));

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

function getFilesInPaths(filepath: string): string[] {
  const checkedPath = getPathType(filepath);
  switch (checkedPath) {
    case "file":
      try {
        return [filepath];
      } catch (e) {
        log(
          `ERROR: Failed to create document from path ${filepath}: ${e}`
        );
        return [];
      }
    case "dir":
    {
        // log("found dir: " + filepath);
        // const f = getAllMFiles(filepath);
        // const myFils = getAllMFiles(filepath);
        const myFiles = getAllMFiles(filepath);
        // log("myFiles: " + JSON.stringify(myFiles));
        return myFiles;
      }
    case "none":
      log(`ERROR: NONE (${filepath})`);
      return [];
  }
}

export function getAllFilepathsFromPath(p: string): string[] {
  // log("checking : " + p);
  if (p.startsWith('~') && os.homedir()) {
    const replacedString = p.replace("~", os.homedir());
    // return getFilesInPaths(replacedString);
    return getFilesInPaths(path.resolve(replacedString));
  }
  return getFilesInPaths(path.resolve(p));
}

export function addDocumentFromPath(filepath: string): void {
  // check if the document it's not already added in the documentData list
  const alreadyInDocumentData = documentData.map((data) => data.getDocumentPath()).includes(filepath);
  if (alreadyInDocumentData) return;
  addNewDocument(createDocumentFromFilepath(filepath));
}

export function createDocumentFromFilepath(filepath: string): TextDocument {
  const content = fs.readFileSync(filepath, "utf8");
  const doc = TextDocument.create(
    formatURI(filepath),
    "octave",
    1,
    content
  );
  return doc;
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
        .filter((ref) => ref.depth === "")
        .map((ref) => ref.name)
    ),
    ...currentDoc.getVariableDefinitions(-1, true)
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
        functionsDefinitions: getValidFunctionsDefinitionsNames(data),
        references: [
          ...completionData().map((data) => data.label),
          ...getDocumentsToBeExecutable({ currentDocument: data.getURI() }).map(
            (item) => item.label
          ),
        ]
      })
    );
  });
}

function getValidFunctionsDefinitionsNames(currentDoc: DocumentData): IFunctionDefinition[] {
  const a: IFunctionDefinition[] = [
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
      ),
    ...currentDoc.getFunctionsDefinitions(),
    ...documentData.flatMap((data) =>
      data.getExportedFunctions()
    ),
  ];
  // log("a: " + JSON.stringify(a));
  return a;
}

/**
  * Checks that all documents are referencing to the listed documents.
  * if any document in the list it's not referenced will be removed.
  * Default file should be consider, also the files in the current working directory.
  */
function cleanUnreferencedDocuments(currentDocumentURI: string): void {
  const validPaths: string[] = [];

  // working directory files
  const currentDirectoryFiles = getAllFilepathsFromPath(process.cwd());
  const includedByDefault = documentData.filter((d) => currentDirectoryFiles.includes(d.getDocumentPath()));
  validPaths.push(
    ...includedByDefault.map((d) => d.getDocumentPath()),
    ...includedByDefault.flatMap((d) => d.getLocallyReferencedPaths())
  );

  // added by default init file
  if (globalSettings.enableInitFile && globalSettings.defaultInitFile) {
    const pathsIncludedByDefaultFile = getAllFilepathsFromPath(globalSettings.defaultInitFile);
    const includedByDefaultFile = documentData.filter((d) => pathsIncludedByDefaultFile.includes(d.getDocumentPath()));
    validPaths.push(
      ...includedByDefaultFile.map((d) => d.getDocumentPath()),
      ...includedByDefaultFile.flatMap((d) => d.getLocallyReferencedPaths())
    );
  }

  // log("validPaths: " + JSON.stringify(validPaths.map((p) => path.basename(p))));

  // remove unvalid paths
  documentData.forEach((data) => {
    if (!validPaths.includes(data.getDocumentPath()) && data.getURI() !== currentDocumentURI) {
      documentData.splice(documentData.indexOf(data), 1);
    }
  });
}
