import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  type Diagnostic,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  handleOnInitialized,
  handleOnInitialize,
  handleReferences,
  handleCompletion,
  handleDefinitions,
} from './handlers';
import { type ISettings } from './data';
import { Parser, Tokenizer, Visitor } from './parser';
import { getDiagnosticFromLitingMessage } from './utils';

// THIS IS THE TIME THAT IT WAITS BEFORE TRIGGERING A REFRESH
// OF PARSING THE DOCUMENT WHEN THE USER IT'S TYPING
// TODO: this should be an user setting
const DEBOUNCE_DELAY_MS = 1000;

export const connection = createConnection(ProposedFeatures.all);
const documentSettings = new Map<string, Thenable<ISettings>>();

export const documents = new TextDocuments<TextDocument>(TextDocument);
export const visitors = new Map<string, Visitor>();
const documentChanges = new Map<string, NodeJS.Timer>();

documents.onDidChangeContent((change) => {
  updateDocumentData(change.document.uri, change.document.getText());
});
// documents.onDidOpen((change) => {
// const text = change.document.getText();
// const uri = change.document.uri;

// log(`opened '${uri}'`);
// });
// documents.onDidSave((change) => handleOnDidSave({change}));
connection.onInitialize((params) => handleOnInitialize({ params, connection }));
connection.onInitialized((params) => {
  handleOnInitialized({ params, connection });
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
// connection.onDidChangeConfiguration((change) =>);
// connection.workspace.onDidDeleteFiles((event) => {});
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
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
function updateDocumentData(uri: string, text: string): void {
  // Clear any previously scheduled diagnostic updates for this document
  if (documentChanges.has(uri)) {
    clearTimeout(documentChanges.get(uri));
  }

  // Schedule a new diagnostic update after a delay (e.g., 500 ms)
  documentChanges.set(
    uri,
    setTimeout(() => {
      const document = documents.get(uri);
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

      connection
        .sendDiagnostics({
          uri,
          diagnostics,
        })
        .catch((err) => {
          throw new Error(err);
        });
    }, DEBOUNCE_DELAY_MS),
  );
}
