import { DidChangeConfigurationNotification, InitializeParams, InitializeResult, TextDocumentSyncKind, _Connection } from "vscode-languageserver";

interface IOnInitializeProps {
  params: InitializeParams;
  hasConfigurationCapability: boolean;
  hasWorkspaceFolderCapability: boolean;
  hasDiagnosticRelatedInformationCapability: boolean;
}
export function handleOnInitialize({params, hasConfigurationCapability, hasWorkspaceFolderCapability, hasDiagnosticRelatedInformationCapability}: IOnInitializeProps) {
  const capabilities = params.capabilities;

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
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
      definitionProvider: {
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
