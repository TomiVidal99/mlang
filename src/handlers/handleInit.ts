import {
  DidChangeConfigurationNotification,
  type InitializeParams,
  type InitializeResult,
  type InitializedParams,
  TextDocumentSyncKind,
  type _Connection,
} from 'vscode-languageserver';
import { getFilesInWorkspace } from '../utils';
import { docManager } from '../types/DocumentsManager';

export let hasConfigurationCapability = true;
export let hasWorkspaceFolderCapability = true;
export let hasDiagnosticRelatedInformationCapability = false;

interface IOnInitializeProps {
  params: InitializeParams;
  connection: _Connection;
}
export function handleOnInitialize({
  params,
  connection,
}: IOnInitializeProps): InitializeResult<any> {
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
    capabilities.textDocument?.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        // allows completion
        workDoneProgress: true,
        resolveProvider: true,
        completionItem: {
          labelDetailsSupport: true,
        },
        triggerCharacters: ['qwertyuiopasdfghjklñzxcvbnm'], // TODO: check if keep this, or make the user have a config for it
      },
      definitionProvider: {
        // allows goToDefinition
        workDoneProgress: true,
      },
      referencesProvider: {
        // allows goToReference
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

  // first read all the files in the current directory
  // then load them all into Documents
  const { workspaceFolders } = params;
  if (
    workspaceFolders &&
    workspaceFolders.length > 0 &&
    workspaceFolders[0]?.name
  ) {
    const filesInRootFolder = getFilesInWorkspace({
      workspace: workspaceFolders[0].name,
    });
    filesInRootFolder.forEach((d) => docManager.set(d.uri, d.getText()));
  }

  // handleDefaultPath();

  return result;
}

interface IOnInitializedProps {
  connection: _Connection;
  params: InitializedParams;
}
export async function handleOnInitialized({
  params,
  connection,
}: IOnInitializedProps): Promise<void> {
  connection.console.log('Mlang Initialized correctly!');

  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    await connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined,
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log('Workspace folder change event received.');
    });
  }
}
