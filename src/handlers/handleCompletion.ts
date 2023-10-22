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
    ...visitors.get(params.textDocument.uri).references
    .map((ref) => {
      // TODO: think how to consider the completion based on the current cursor position
      // ACTUALLY this should not be the references but the definitions
      const item: CompletionItem = {
        label: ref.name,
        kind: ref.type === "FUNCTION" ? CompletionItemKind.Function : CompletionItemKind.Variable,
        documentation: ref.documentation,
      };
      return item;
    })
    .filter((item, index, self) => index === self.findIndex((i) => i.label === item.label)),
  ];
}
