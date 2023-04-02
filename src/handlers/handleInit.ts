import { DidChangeConfigurationNotification, InitializeParams, InitializeResult, TextDocumentSyncKind, _Connection } from "vscode-languageserver";
import { getFilesInWorkspace} from "../managers";
import { URI } from "vscode-uri";
import { log } from "../server";
import { addNewDocument } from "../utils";

export let hasConfigurationCapability = false;
export let hasWorkspaceFolderCapability = false;
export let hasDiagnosticRelatedInformationCapability = false;

interface IOnInitializeProps {
  params: InitializeParams;
  connection: _Connection;
}
export function handleOnInitialize({params, connection}: IOnInitializeProps) {
  const capabilities = params.capabilities;
  const rootUri = params.rootUri;
  const workspace = URI.parse(rootUri).fsPath;
  const documentsInWorkspace = getFilesInWorkspace({workspace});

  documentsInWorkspace.forEach((doc) => {
    addNewDocument(doc);
  });

  // fills the list of function references, to goToReference and goToDefinition
  // updateFunctionList({documents: documentsInWorkspace});
  //
  // functionsMap.forEach((func) => {
  //   log(`fn name: ${func.name}, in ${func.uri}`);
  // });

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace != null && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace != null && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { // allows completion
        resolveProvider: true,
      },
      definitionProvider: { // allows goToDefinition
        workDoneProgress: true,
      },
      // referencesProvider: { // allows goToReference
      //   workDoneProgress: true,
      // }
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
}

interface IOnInitializedProps {
  connection: _Connection;
}
export function handleOnInitialized({connection}: IOnInitializedProps) {
  log("initialized");
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
}
