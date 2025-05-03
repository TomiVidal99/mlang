import {
  type CompletionItem,
  type TextDocumentPositionParams,
} from 'vscode-languageserver';
import { getCompletionKeywords, getCompletionNativeFunctions } from '../data';
import { visitors } from '../server';
import { fromDefinitionToCompletionItem } from '../utils';
import { type Visitor } from '../parser';
import { docManager } from '../types/DocumentsManager';

export function handleCompletion({
  params,
}: {
  params: TextDocumentPositionParams;
}): CompletionItem[] {
  const items: CompletionItem[] = getCompletionKeywords();

  const visitor = visitors.get(params.textDocument.uri);
  if (visitor?.definitions === undefined) return items;

  const { definitions } = visitor;
  const nativeFunctions = getCompletionNativeFunctions();

  console.error('Calling completion!');

  // NATIVE FUNCTION
  items.push(...nativeFunctions);

  // CURRENT FILES REFERENCES
  items.push(
    ...definitions
      .map((def) => fromDefinitionToCompletionItem(def))
      .filter(
        (item, index, self) =>
          index === self.findIndex((i) => i.label === item.label),
      ),
  );

  // REFERENCES IN FILES IN THE CURRENT DIR
  const otherDocuments = docManager
    .getAllUris()
    .filter((uri) => uri !== params.textDocument.uri);

  const _visitors = otherDocuments
    .map((d) => visitors.get(d))
    .filter((visitor) => visitor !== undefined) as Visitor[];

  const otherFilesCompletionItems = _visitors
    .flatMap((v) => v.definitions)
    .filter((def) => def.context === '0')
    .map((def) => fromDefinitionToCompletionItem(def));

  items.push(...otherFilesCompletionItems);

  return items;
}
