import { DidOpenTextDocumentParams, TextDocumentChangeEvent } from "vscode-languageserver";
import { readDocuments } from "../managers";
import { TextDocument } from "vscode-languageserver-textdocument";
import { log } from "../server";

export function handleDidOpenTextDocument({params}: {params: DidOpenTextDocumentParams}): void {
  const {textDocument} = params;
  const {uri, languageId, version, text} = textDocument;
  log("openning doc");
  if (readDocuments.includes(params.textDocument.uri)) return;

  log(`opened '${params.textDocument.uri}'`);

  const doc = TextDocument.create(uri, languageId, version, text);
  // updateFunctionList({documents: [doc]});
}

export function handleDidOpenFile({change}: {change: TextDocumentChangeEvent<TextDocument>}): void {
  const document = change.document;
  log("changed: " + document.uri);
}
