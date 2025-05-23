import {
  type CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  MarkupKind,
} from 'vscode-languageserver';

export function getCompletionKeywords(): CompletionItem[] {
  return [
    {
      label: 'for',
      // eslint-disable-next-line no-template-curly-in-string
      insertText: 'for (${1:var} = ${2})\n\t${3}\n\nend',
      insertTextFormat: InsertTextFormat.Snippet,
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[for loop](https://docs.octave.org/v4.2.0/The-for-Statement.html)',
      },
    },
    {
      label: 'while',
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[while loop](https://docs.octave.org/v4.2.0/The-while-Statement.html)',
      },
    },
    {
      label: 'if',
      // eslint-disable-next-line no-template-curly-in-string
      insertText: 'if (${1:condition})\n\t${2}\n\nend',
      insertTextFormat: InsertTextFormat.Snippet,
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[if statement](https://docs.octave.org/v4.2.0/The-if-Statement.html)',
      },
    },
    {
      label: 'else',
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[if statement else clause](https://docs.octave.org/v4.2.0/The-if-Statement.html)',
      },
    },
    {
      label: 'elseif',
      // eslint-disable-next-line no-template-curly-in-string
      insertText: 'elseif (${1:condition})\n\t${2}',
      insertTextFormat: InsertTextFormat.Snippet,
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[if statement elseif clause](https://docs.octave.org/v4.2.0/The-if-Statement.html)',
      },
    },
    {
      label: 'switch',
      // eslint-disable-next-line no-template-curly-in-string
      insertText: 'switch (${1:variable})\n\tcase ${2}\notherwise\n\nend',
      insertTextFormat: InsertTextFormat.Snippet,
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[switch statement](https://docs.octave.org/v4.2.0/The-switch-Statement.html)',
      },
    },
    {
      label: 'case',
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[switch statement case clause](https://docs.octave.org/v4.2.0/The-switch-Statement.html#index-case-statement)',
      },
    },
    {
      label: 'otherwise',
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[switch statement otherwise clause](https://docs.octave.org/v4.2.0/The-switch-Statement.html#index-otherwise-statement)',
      },
    },
    {
      label: 'break',
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[break statement](https://docs.octave.org/v4.2.0/The-break-Statement.html#index-break-statement)',
      },
    },
    {
      label: 'continue',
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[continue statement](https://docs.octave.org/v4.2.0/The-continue-Statement.html#index-continue-statement)',
      },
    },
    {
      label: 'return',
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'return statement',
      },
    },
    {
      label: 'end',
      kind: CompletionItemKind.Keyword,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'block end marker',
      },
    },
    {
      label: 'function',
      kind: CompletionItemKind.Keyword,
      // eslint-disable-next-line no-template-curly-in-string
      insertText: 'function ${1:funcName}(${2:funcArgs})\n\t${3:funcBody}\nend',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[block end marker](https://docs.octave.org/v4.2.0/A-Sample-Function-Description.html#A-Sample-Function-Description)',
      },
    },
    {
      label: 'do',
      kind: CompletionItemKind.Keyword,
      // eslint-disable-next-line no-template-curly-in-string
      insertText: 'do\n\t${2:funcBody}\nuntil (${1:condition})',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          '[block end marker](https://docs.octave.org/v5.2.0/The-do_002duntil-Statement.html)',
      },
    },
  ];
}
