import type { Range } from 'vscode-languageserver';

export const CERO_POSITION: Range = {
  start: {
    line: 0,
    character: 0,
  },
  end: {
    line: 0,
    character: 0,
  },
} as const;
