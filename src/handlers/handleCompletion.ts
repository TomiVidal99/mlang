import { CompletionItem, TextDocumentPositionParams } from "vscode-languageserver";
import { completionKeywords } from "../data";

export function handleCompletion({
  params,
}: {
  params: TextDocumentPositionParams;
}): CompletionItem[] {
  return [
    ...completionKeywords(params.position),
  ];
}
