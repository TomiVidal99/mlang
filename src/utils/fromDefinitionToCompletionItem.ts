import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver';
import { Definition } from '../types';

// TODO: think how to consider the completion based on the current cursor position
// console.log('def: ' + JSON.stringify(def));
export function fromDefinitionToCompletionItem(
  def: Definition,
): CompletionItem {
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
        })`;
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
}
