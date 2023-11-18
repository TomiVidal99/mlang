import {
  type CompletionItem,
  CompletionItemKind,
  type TextDocumentPositionParams,
  InsertTextFormat,
} from 'vscode-languageserver';
import { getCompletionKeywords } from '../data';
import { visitors } from '../server';

export function handleCompletion({
  params,
}: {
  params: TextDocumentPositionParams;
}): CompletionItem[] {
  const items: CompletionItem[] = getCompletionKeywords();

  const visitor = visitors.get(params.textDocument.uri);
  if (visitor?.definitions === undefined) return items;

  const { definitions } = visitor;

  items.push(
    ...definitions
      .map((def) => {
        // TODO: think how to consider the completion based on the current cursor position
        // console.log('def: ' + JSON.stringify(def));
        const args =
          def?.arguments?.length !== undefined && def?.arguments?.length > 0
            ? def.arguments.map((d, i) => {
                return (
                  `${i !== 0 ? ' ' : ''}` +
                  '${' +
                  `${i + 1}:${d.name}${
                    d.type !== 'DEFAULT_ARGUMENT' ? '' : ` = ${d.content}`
                  }` +
                  '}'
                );
              })
            : '';
        const insertText =
          def.type !== 'FUNCTION'
            ? def.name
            : `${def.name}(${
                (Array.isArray(args) ? args.map((a) => a) : args) as string
              });`;
        const item: CompletionItem = {
          label: def.name,
          kind:
            def.type === 'FUNCTION'
              ? CompletionItemKind.Function
              : CompletionItemKind.Variable,
          documentation: def.documentation,
          data: def.arguments,
          insertText,
          insertTextFormat: InsertTextFormat.Snippet,
        };
        return item;
      })
      .filter(
        (item, index, self) =>
          index === self.findIndex((i) => i.label === item.label),
      ),
  );

  return items;
}
