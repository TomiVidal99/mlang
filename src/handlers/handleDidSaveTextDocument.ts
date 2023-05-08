import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

export function handleOnDidSave({change}: {change: TextDocumentChangeEvent<TextDocument>}): void {
  const document = change.document;
  // updateFunctionList({documents: [document]});
  // log("document saved!");
}
