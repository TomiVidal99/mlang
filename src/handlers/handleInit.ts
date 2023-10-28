import { DidChangeConfigurationNotification, InitializeParams, InitializeResult, InitializedParams, TextDocumentSyncKind, _Connection } from "vscode-languageserver";
export let hasConfigurationCapability = false;
export let hasWorkspaceFolderCapability = false;
export let hasDiagnosticRelatedInformationCapability = false;

interface IOnInitializeProps {
  params: InitializeParams;
  connection: _Connection;
}
export function handleOnInitialize({params, connection }: IOnInitializeProps) {
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
      completionProvider: { // allows completion
        workDoneProgress: true,
        resolveProvider: true,
        completionItem: {
          labelDetailsSupport: true,
        },
        triggerCharacters: ["qwertyuiopasdfghjklñzxcvbnm"], // TODO: check if keep this, or make the user have a config for it
      },
      definitionProvider: { // allows goToDefinition
        workDoneProgress: true,
      },
      referencesProvider: { // allows goToReference
        workDoneProgress: true,
      },
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
  params: InitializedParams;
}
export function handleOnInitialized({ params, connection }: IOnInitializedProps) {
  connection.console.log("Mlang Initialized correctly!");

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
