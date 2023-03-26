import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';

export const completionData: CompletionItem[] = [
  {
    label: 'function myFunction()\n\nend',
    kind: CompletionItemKind.Function,
    data: 3,
    detail: 'Function',
    documentation: '[Octave function](https://docs.octave.org/v4.0.1/Defining-Functions.html)'
  }
];