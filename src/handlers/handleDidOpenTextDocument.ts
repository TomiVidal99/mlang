import { DidOpenTextDocumentParams } from "vscode-languageserver";
import { readDocuments, updateFunctionList } from "../managers";
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
