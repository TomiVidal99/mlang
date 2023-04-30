export interface IToken {
  name: TokenNameType;
  pattern: RegExp;
}

export type TokenNameType =
  | "WHILE_LOOP_START"
  | "WHILE_LOOP_END"
  | "FOR_LOOP_START"
  | "FOR_LOOP_END"
  | "VARIABLE_REFERENCE"
  | "VARIABLE_DECLARATION"
  | "END_FUNCTION"
  | "FUNCTION_REFERENCE"
  | "FUNCTION_WITH_OUTPUT"
  | "FUNCTION_WITHOUT_OUTPUT"
  | "ANONYMOUS_FUNCTION";

export const GRAMMAR: IToken[] = [
  {
    name: "FUNCTION_WITH_OUTPUT",
    pattern:
      /function\s+(\[(?:\s*\w+\s*,)*\s*\w+\s*\])\s*=\s*(\w+)\s*\(([\w\s,]*)\)/,
  },
  {
    name: "FUNCTION_WITHOUT_OUTPUT",
    pattern: /^\s*function\s+(\w+)\s*\(([^)]*)\)/,
  },
  {
    name: "FUNCTION_REFERENCE",
    pattern: /^\s*(?<retval>[\w\s,\\[\]]+)\s*=\s*(?<name>[^\\[]+)\s*\((?<args>[^=]*)\)$|^\s*([^\s\\[]+)\s*\(([^=]*)\)$|^\s*([\w,\\[\]]+)\s*=\s*([^\s\\[]+)\s*\(\s*\)$|^\s*([^\s\\[]+)\s*\(\s*\)$/,
  },
  {
    name: "ANONYMOUS_FUNCTION",
    pattern: /(\w+)\s*=\s*@\(([^\\)]*)\)/,
  },
  { name: "END_FUNCTION", pattern: /(endfunction|end)/i },
  {
    name: "VARIABLE_DECLARATION",
    pattern: /(\w+)\s*=\s*(.*)/,
  },
  {
    name: "VARIABLE_REFERENCE",
    pattern: /(?<!\w)(?!if|while|for|switch)(?!.*\s=\s)(\w+)(?!\()/,
  },
  {
    name: "FOR_LOOP_START",
    pattern: /^\s*for\s+(\w+)\s*=\s*(\S+)\s*:\s*(\S+)\s*(?::\s*(\S+))?/i,
  },
  {
    name: "FOR_LOOP_END",
    pattern: /end\s*for/i,
  },
  {
    name: "WHILE_LOOP_START",
    pattern: /^\s*while\s+(.*)/i,
  },
  {
    name: "WHILE_LOOP_END",
    pattern: /end\s*while/i,
  },
];
