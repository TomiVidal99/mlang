import { CompletionItem, TextDocumentPositionParams } from "vscode-languageserver";
import { completionData } from "./data";

export function handleOnCompletion(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return completionData;
}
