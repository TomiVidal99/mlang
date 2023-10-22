import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  MessageType,
  Diagnostic,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { handleOnInitialized, handleOnInitialize, handleReferences, handleCompletion } from "./handlers";
import { ISettings } from "./data";
import { Parser, Tokenizer, Visitor } from "./parser";
import { getDiagnosticFromLitingMessage } from "./utils";

const DEBOUNCE_DELAY_MS = 500;

const connection = createConnection(ProposedFeatures.all);
const documentSettings = new Map<string, Thenable<ISettings>>();

export const documents = new TextDocuments<TextDocument>(TextDocument);
export const visitors = new Map<string, Visitor>();
const documentChanges: Map<string, NodeJS.Timer> = new Map();

documents.onDidChangeContent((change) => {
  updateDiagnostics(change.document.uri, change.document.getText());
});
// documents.onDidOpen((change) => {
// const text = change.document.getText();
// const uri = change.document.uri;

// log(`opened '${uri}'`);
// });
// documents.onDidSave((change) => handleOnDidSave({change}));
connection.onInitialize((params) => handleOnInitialize({ params, connection }));
connection.onInitialized((params) => handleOnInitialized({ params, connection }));
// connection.onDidOpenTextDocument((params) => { });
// connection.onDefinition((params) => handleOnDefinition({params, documents}));
connection.onReferences((params) => {
  const uri = params.textDocument.uri;
  const document = documents.get(uri);
  return handleReferences(document, params.position);
});
// connection.onDidChangeConfiguration((change) =>);
// connection.workspace.onDidDeleteFiles((event) => {});
documents.onDidClose((e) => { documentSettings.delete(e.document.uri); });
// documents.onDidChangeContent((change) => {
//   updateDiagnostics(change.document.uri, change.document.getText());
// });
connection.onCompletion((params) => handleCompletion({ params: params }));
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();

// Some functions that depends on the connection
export function logError(message: string): void {
  connection.sendRequest("window/showMessage", {
    type: MessageType.Info,
    message,
  });
}
export function log(message: string | object): void {
  // WARN: this is only for dev purposes
  // if (!process.env.DEVLOPMENT) return;
  connection.sendRequest("window/showMessage", {
    type: MessageType.Info,
    message: typeof message === "string" ? message : JSON.stringify(message),
  });
}

function updateDiagnostics(uri: string, text: string) {
  // Clear any previously scheduled diagnostic updates for this document
  if (documentChanges.has(uri)) {
    clearTimeout(documentChanges.get(uri));
  }

  // Schedule a new diagnostic update after a delay (e.g., 500 ms)
  documentChanges.set(uri, setTimeout(() => {
    const document = documents.get(uri);
    if (document) {
      const tokenizer = new Tokenizer(text);
      const tokens = tokenizer.getAllTokens();
      const parser = new Parser(tokens);
      const ast = parser.makeAST();
      const visitor = new Visitor();
      visitor.visitProgram(ast);

      visitors.set(uri, visitor);

      const errors: Diagnostic[] = parser.getErrors().map(err => getDiagnosticFromLitingMessage(err, 'error'));
      const warnings: Diagnostic[] = parser.getWarnings().map(warn => getDiagnosticFromLitingMessage(warn, 'warn'));

      connection.sendDiagnostics({
        uri,
        diagnostics: [...errors, ...warnings],
      });
    }
  }, DEBOUNCE_DELAY_MS));
}
