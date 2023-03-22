import { type CompletionItem, type TextDocumentPositionParams } from 'vscode-languageserver';
import { completionData } from './data';
import { connection } from './server';

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return completionData;
    // return [
    // 	{
    // 		lbel: 'TypeScript',
    // 		kind: CompletionItemKind.Text,
    // 		data: 1
    // 	},
    // 	{
    // 		label: 'JavaScript',
    // 		kind: CompletionItemKind.Text,
    // 		data: 2
    // 	},
  //     {
    // 		label: 'function myFunction()\n\nend',
    // 		kind: CompletionItemKind.Function,
    // 		data: 3,
    // 	}
    // ];
  }
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    // if (item.data === 1) {
    // 	item.detail = 'TypeScript details';
    // 	item.documentation = 'TypeScript documentation';
    // } else if (item.data === 2) {
    // 	item.detail = 'JavaScript details';
    // 	item.documentation = 'JavaScript documentation';
    // } else if (item.data === 3) {
    // 	item.detail = 'Function';
    // 	item.documentation = 'Octave function';
    // }
    return item;
  }
);
