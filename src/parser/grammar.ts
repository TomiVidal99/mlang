export interface IToken {
  name: TokenNameType;
  pattern: RegExp;
}

export type TokenNameType =
  | "END"
  | "FUNCTION_WITH_OUTPUT"
  | "FUNCTION_NO_OUTPUT"
  | "FUNCTION_WITHOUT_NAME";

export const GRAMMAR: IToken[] = [
  {
    name: "FUNCTION_WITH_OUTPUT",
    pattern:
      /function\s+(\[(?:\s*\w+\s*,)*\s*\w+\s*\])\s*=\s*(\w+)\s*\(([\w\s,]*)\)/,
  },
  {
    name: "FUNCTION_NO_OUTPUT",
    pattern: /^\s*function\s+(\w+)\s*\(([^)]*)\)/,
  },
  // {
  //   name: "FUNCTION_WITHOUT_NAME",
  //   pattern:
  //     /function\s+(\[([a-zA-Z][a-zA-Z0-9_]*,?\s*)*\])?\s*=\s*(.*?)\((.*?)\)/i,
  // },
  { name: "END", pattern: /(endfunction|end)/i },
];
