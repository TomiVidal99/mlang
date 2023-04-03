import { TextDocument, TextDocumentChangeEvent } from "vscode-languageserver";
import { updateFunctionList } from "../managers";
import { log } from "console";

export function handleOnDidSave({change}: {change: TextDocumentChangeEvent<TextDocument>}): void {
  const document = change.document;
  // updateFunctionList({documents: [document]});
  // log("document saved!");
}
