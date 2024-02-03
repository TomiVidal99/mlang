import {
  createConnection,
  ProposedFeatures,
  type Diagnostic,
  TextDocuments,
  DiagnosticSeverity,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  handleOnInitialized,
  handleOnInitialize,
  handleReferences,
  handleCompletion,
  handleDefinitions,
  hasConfigurationCapability,
} from './handlers';
import { defaultSettings, type ISettings } from './data';
import { Parser, Tokenizer, Visitor } from './parser';
import { getDiagnosticFromLitingMessage } from './utils';
import { DocumentsManager } from './types/DocumentsManager';
import { readFileSync } from 'fs';
import { URI } from 'vscode-uri';

export const connection = createConnection(ProposedFeatures.all);
// const documentSettings = new Map<string, Thenable<ISettings>>();
export let globalSettings: ISettings = defaultSettings;
export const docManager = new DocumentsManager();

// TODO refactor visitor and documentSettings into the DocumentsManager class
export const documents = new TextDocuments(TextDocument);
export const visitors = new Map<string, Visitor>();
const documentChanges = new Map<string, NodeJS.Timer>();

documents.onDidChangeContent((change) => {
  updateDocumentData(change.document.uri, change.document.getText());
});
documents.onDidOpen((change) => {
  const text = change.document.getText();
  const uri = change.document.uri;
  docManager.set(uri, text);
  // connection.window.showInformationMessage('did open: ' + uri);
});
// documents.onDidSave((change) => handleOnDidSave({change}));
connection.onInitialize((params) => handleOnInitialize({ params, connection }));
connection.onInitialized(async (params) => {
  await handleOnInitialized({ params, connection });
});
// connection.onDidOpenTextDocument((params) => {});
connection.onDefinition(
  async (params) => await handleDefinitions({ params, documents }),
);
connection.onReferences((params) => {
  const uri = params.textDocument.uri;
  const document = documents.get(uri);
  if (document === undefined) return [];
  return handleReferences(document, params.position);
});
connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    globalSettings = change.settings.settings;
  } else {
    globalSettings = defaultSettings;
  }

  if (globalSettings.enableInitFile) {
    const text = readFileSync(globalSettings.defaultInitFile).toString();
    const uri = URI.file(globalSettings.defaultInitFile).toString();
    docManager.set(uri, text);
  }

  // Revalidate all open text documents
  // disabled - uses example code
  // documents.all().forEach(validateTextDocument);
});
// connection.workspace.onDidDeleteFiles((event) => {});
documents.onDidClose((e) => {
  const uri = e.document.uri;
  docManager.delete(uri);
  // documentSettings.delete(uri);
});
// documents.onDidChangeContent((change) => {
//   updateDiagnostics(change.document.uri, change.document.getText());
// });
connection.onCompletion((params) => handleCompletion({ params }));
connection.onCompletionResolve((item) => {
  // if (item.kind.valueOf() === 3 && item.command) {
  //   // IT'S A FUNCTION
  //   return {
  //     ...item,
  //     insertText: `${item.label}()`,
  //   };
  // }

  return item;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();

// CLEAN UP Handler
connection.onExit(() => {
  // Iterate through the scheduled updates and cancel them
  documentChanges.forEach((docChanges) => {
    clearTimeout(docChanges);
  });

  // Clear the documentChanges map
  documentChanges.clear();
});

/**
 * Updates the references, definitions and diagnostics
 * And updates that new data on the visitors map
 */
export function updateDocumentData(uri: string, updatedText?: string): void {
  // Clear any previously scheduled diagnostic updates for this document
  if (documentChanges.has(uri)) {
    clearTimeout(documentChanges.get(uri));
  }

  // Schedule a new diagnostic update after a delay (e.g., 500 ms)
  documentChanges.set(
    uri,
    setTimeout(() => {
      const document = docManager.get(uri);
      const text = updatedText ?? document?.getText();
      if (document === null || document === undefined) return;
      const tokenizer = new Tokenizer(text);
      const tokens = tokenizer.getAllTokens();
      const parser = new Parser(tokens);
      const ast = parser.makeAST();
      const visitor = new Visitor();
      const visitorErrors = visitor.getErrors();
      visitor.visitProgram(ast);
      visitors.set(uri, visitor);

      const errors: Diagnostic[] = parser
        .getErrors()
        .map((err) => getDiagnosticFromLitingMessage(err, 'error'));
      const warnings: Diagnostic[] = parser
        .getWarnings()
        .map((warn) => getDiagnosticFromLitingMessage(warn, 'warn'));

      const diagnostics: Diagnostic[] = [
        ...errors,
        ...warnings,
        ...visitorErrors,
      ];

      if (diagnostics.length > globalSettings.maxNumberOfProblems) {
        const maxReachedDiagnostic: Diagnostic = {
          range: {
            start: {
              line: 0,
              character: 0,
            },
            end: {
              line: 0,
              character: 1,
            },
          },
          message: 'Maximum number of problems reached',
          severity: DiagnosticSeverity.Error,
          source: 'mlang',
        };
        connection
          .sendDiagnostics({
            uri,
            diagnostics: [maxReachedDiagnostic],
          })
          .catch((err) => {
            throw new Error(err);
          });
      } else {
        connection
          .sendDiagnostics({
            uri,
            diagnostics,
          })
          .catch((err) => {
            throw new Error(err);
          });
      }
    }, globalSettings.defaultDebounceTimeMS),
  );
}
