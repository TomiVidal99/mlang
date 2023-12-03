import type { Range } from 'vscode-languageserver';

export const CERO_POSITION: Range = {
  start: {
    line: 1,
    character: 1,
  },
  end: {
    line: 1,
    character: 2,
  },
} as const;
