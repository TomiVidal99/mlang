/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  InitializeResult,
  MessageType,
  CompletionItem,
  TextDocumentPositionParams,
  Range,
} from "vscode-languageserver/node";

import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { completionData } from "./data";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments<TextDocument>(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
// let hasDiagnosticRelatedInformationCapability = false;

export function log(message: string): void {
  connection.sendRequest("window/showMessage", {
    type: MessageType.Info,
    message,
  });
}

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace != null && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace != null && !!capabilities.workspace.workspaceFolders
  );
  // hasDiagnosticRelatedInformationCapability = !!(
  // 	capabilities.textDocument &&
  // 	capabilities.textDocument.publishDiagnostics &&
  // 	capabilities.textDocument.publishDiagnostics.relatedInformation
  // );

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
});

connection.onInitialized(() => {
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
});

connection.onDefinition((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const position = params.position;
  const wordRange = getWordRange(document, position);
  if (!wordRange) {
    return null;
  }

  const word = document.getText(wordRange);

  // Your implementation logic here
  log("searching definition for " + word);

  return null;
});

function getWordRange(document: TextDocument, position: Position): Range | null {
  const line = document.getText({ start: { line: position.line, character: 0 }, end: { line: position.line + 1, character: 0 } });
  const word = line.match(/[\w\d]+/g)?.find(w => document.offsetAt(position) >= line.indexOf(w) && document.offsetAt(position) < line.indexOf(w) + w.length);
  if (!word) {
    return null;
  }
  const wordStart = line.indexOf(word);
  const wordEnd = wordStart + word.length;
  return Range.create(position.line, wordStart, position.line, Math.min(wordEnd, line.length));
}

// function getDefinition(connection: Connection, document: TextDocument, position: Position): Location[] {
//   const wordRange = getWordRange(document, position);
//   if (!wordRange) {
//     return [];
//   }
//   const word = document.getText(wordRange);
//   const locations: Location[] = [];
//
//   // search all open documents for the definition of the word
//   connection.workspace.getWorkspaceFolders()?.forEach(folder => {
//     connection.workspace.textDocuments.forEach(doc => {
//       if (doc.uri.startsWith(folder.uri)) {
//         const definitionPosition = findDefinition(doc, word);
//         if (definitionPosition) {
//           locations.push(Location.create(doc.uri, definitionPosition));
//         }
//       }
//     });
//   });
//
//   return locations;
// }
//
// function findDefinition(document: TextDocument, word: string): Position | null {
//   for (let i = 0; i < document.lineCount; i++) {
//     const line = document.getText({ start: { line: i, character: 0 }, end: { line: i + 1, character: 0 } });
//     const index = line.indexOf(word);
//     if (index !== -1) {
//       const range = Range.create(i, index, i, index + word.length);
//       if (isDefinition(document, range)) {
//         return range.start;
//       }
//     }
//   }
//   return null;
// }
//
// function isDefinition(document: TextDocument, range: Range): boolean {
//   // TODO: implement your own logic to determine if the given range is a definition
//   return true;
// }

// The example settings
interface ISettings {
  maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ISettings = { maxNumberOfProblems: 1000 };
let globalSettings: ISettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings = new Map<string, Thenable<ISettings>>();

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <ISettings>(change.settings.settings || defaultSettings);
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ISettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (result == null) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "settings",
    });

    documentSettings.set(resource, result);
  }
  return result || defaultSettings;
}

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return completionData;
  }
);

// This handler resolves additional information for the item selected in
// the completion list.
// connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
//   if (item.data === 1) {
//     item.detail = "TypeScript details";
//     item.documentation = "TypeScript documentation";
//   }
//   return item;
// });

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  // In this simple example we get the settings for every validate run.
  const settings = await getDocumentSettings(textDocument.uri);

  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();
  const pattern = /\b[A-Z]{2,}\b/g;
  let m: RegExpExecArray | null;

  let problems = 0;
  const diagnostics: Diagnostic[] = [];
  while (
    (m = pattern.exec(text)) != null &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `${m[0]} is all uppercase.`,
      source: "ex",
    };
    // if (hasDiagnosticRelatedInformationCapability) {
    // 	diagnostic.relatedInformation = [
    // 		{
    // 			location: {
    // 				uri: textDocument.uri,
    // 				range: Object.assign({}, diagnostic.range)
    // 			},
    // 			message: 'Spelling matters'
    // 		},
    // 		{
    // 			location: {
    // 				uri: textDocument.uri,
    // 				range: Object.assign({}, diagnostic.range)
    // 			},
    // 			message: 'Particularly for names'
    // 		}
    // 	];
    // }
    diagnostics.push(diagnostic);
  }

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log("We received an file change event");
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
