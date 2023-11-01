import { CompletionItem, CompletionItemKind, TextDocumentPositionParams, InsertTextFormat } from "vscode-languageserver";
import { completionKeywords } from "../data";
import { visitors } from "../server";

export function handleCompletion({
  params,
}: {
  params: TextDocumentPositionParams;
}): CompletionItem[] {
  const items: CompletionItem[] = completionKeywords;

  const visitor = visitors.get(params.textDocument.uri);
  if (!visitor || !(visitor?.definitions)) return items;

  const { definitions } = visitor;

  items.push(...definitions
    .map((def) => {
      // TODO: think how to consider the completion based on the current cursor position
      const args = def?.arguments?.length > 0 ? def.arguments.map((d, i) => {
        return `${i !== 0 ? ' ' : ''}` + '${' + `${i + 1}:${d.name}${d.type !== "DEFAULT_ARGUMENT" ? "" : ` = ${d.content}`}` + '}';}) : '';
      const insertText = def.type !== "FUNCTION" ? def.name : `${def.name}(${args});`;
      const item: CompletionItem = {
        label: def.name,
        kind: def.type === "FUNCTION" ? CompletionItemKind.Function : CompletionItemKind.Variable,
        documentation: def.documentation,
        data: def.arguments,
        insertText,
        insertTextFormat: InsertTextFormat.Snippet,
      };
      return item;
    })
    .filter((item, index, self) => index === self.findIndex((i) => i.label === item.label))
  );

  return items;
}
