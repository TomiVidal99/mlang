import { DidChangeConfigurationNotification, InitializeParams, InitializeResult, TextDocumentSyncKind, _Connection } from "vscode-languageserver";
import { getFilesInWorkspace, updateFunctionList } from "../managers";
import { URI } from "vscode-uri";
import { executeDiagnostics } from "../sendDiagnostics";

interface IOnInitializeProps {
  params: InitializeParams;
  hasConfigurationCapability: boolean;
  hasWorkspaceFolderCapability: boolean;
  hasDiagnosticRelatedInformationCapability: boolean;
  connection: _Connection;
}
export function handleOnInitialize({params, hasConfigurationCapability, hasWorkspaceFolderCapability, hasDiagnosticRelatedInformationCapability, connection}: IOnInitializeProps) {
  const capabilities = params.capabilities;
  const rootUri = params.rootUri;
  const workspace = URI.parse(rootUri).fsPath;
  const documentsInWorkspace = getFilesInWorkspace({workspace});

  // fills the list of function references, to goToReference and goToDefinition
  updateFunctionList({documents: documentsInWorkspace});

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
      referencesProvider: { // allows goToReference
        workDoneProgress: true,
      }
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
  hasConfigurationCapability: boolean;
  hasWorkspaceFolderCapability: boolean;
}
export function handleOnInitialized({connection, hasWorkspaceFolderCapability, hasConfigurationCapability}: IOnInitializedProps) {
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
