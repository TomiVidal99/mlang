import { TextDocument, TextDocumentChangeEvent } from "vscode-languageserver";
import { updateFunctionList } from "../managers";

export function handleOnDidChangeContent({change}: {change: TextDocumentChangeEvent<TextDocument>}): void {
  const document = change.document;
  updateFunctionList({documents: [document]});
}
