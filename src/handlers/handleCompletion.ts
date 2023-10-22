import { CompletionItem, CompletionItemKind, TextDocumentPositionParams } from "vscode-languageserver";
import { completionKeywords } from "../data";
import { visitors } from "../server";

export function handleCompletion({
  params,
}: {
  params: TextDocumentPositionParams;
}): CompletionItem[] {
  return [
    ...completionKeywords(params.position),
    ...visitors.get(params.textDocument.uri).references.map((ref) => {
      const item: CompletionItem = {
        label: ref.name,
        kind: ref.type === "FUNCTION" ? CompletionItemKind.Function : CompletionItemKind.Variable,
        documentation: ref.documentation,
      };
      return item;
    }),
  ];
}
