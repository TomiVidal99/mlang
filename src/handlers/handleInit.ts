import { DidChangeConfigurationNotification, InitializeParams, InitializeResult, InitializedParams, TextDocumentSyncKind, _Connection } from "vscode-languageserver";
import { getFilesInWorkspace} from "../managers";
import { URI } from "vscode-uri";
import { addDocumentFromPath, createDocumentFromFilepath, documentData, log} from "../server";
import { globalSettings } from "../data";
import { addNewDocument } from "../utils";

export let hasConfigurationCapability = false;
export let hasWorkspaceFolderCapability = false;
export let hasDiagnosticRelatedInformationCapability = false;

interface IOnInitializeProps {
  params: InitializeParams;
  connection: _Connection;
}
export function handleOnInitialize({params, connection }: IOnInitializeProps) {
  const capabilities = params.capabilities;
  // const rootUri = params.rootUri;
  // const workspace = URI.parse(rootUri).fsPath;
  // const documentsInWorkspace = getFilesInWorkspace({workspace});

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
}
export function handleOnInitialized({ connection }: IOnInitializedProps) {
  const documentsInWorkspace = getFilesInWorkspace({workspace: process.cwd()});
  documentsInWorkspace.forEach((doc) => {
    addNewDocument(doc);
  });

  log("initialized, default settings: " + JSON.stringify(globalSettings));
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

  // has in count the default init file if the configuration enables it
  if (globalSettings.enableInitFile) {
    addDocumentFromPath(globalSettings.defaultInitFile);
  }
}
