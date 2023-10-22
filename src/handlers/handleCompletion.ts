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
    ...visitors.get(params.textDocument.uri).definitions
    .map((def) => {
      // TODO: think how to consider the completion based on the current cursor position
      const item: CompletionItem = {
        label: def.name,
        kind: def.type === "FUNCTION" ? CompletionItemKind.Function : CompletionItemKind.Variable,
        documentation: def.documentation,
      };
      return item;
    })
    .filter((item, index, self) => index === self.findIndex((i) => i.label === item.label)),
  ];
}
