// IMPORTANT: the regex that have groups that returns values should be named like so:
// (?<GROUP_NAME>mypattern)

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
  | "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT"
  | "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS"
  | "FUNCTION_REFERENCE_WITHOUT_OUTPUT"
  | "FUNCTION_DEFINITION_WITH_OUTPUT"
  | "FUNCTION_DEFINITION_WITHOUT_OUTPUT"
  | "ANONYMOUS_FUNCTION";

export const GRAMMAR: IToken[] = [
  {
    name: "FUNCTION_DEFINITION_WITH_OUTPUT",
    pattern:
      /function\s+(?:\[\s*(?<retval>[\w\s,]*)\s*\])\s*=\s*(?<name>\w+)\s*\((?<args>[\w\s,]*)\)/,
  },
  {
    name: "FUNCTION_DEFINITION_WITHOUT_OUTPUT",
    pattern: /^\s*function\s+(?<name>\w+)\s*\((?<args>[^)]*)\)/,
  },
  {
    name: "FUNCTION_REFERENCE_WITHOUT_OUTPUT",
    pattern: /^\s*(?<name>\w+)\((?<args>[^)]*)\)(?:\s*;|\s*$)/,
  },
  {
    name: "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT",
    pattern: /^\s*(?<retval>\w+)\s*=\s*(?<name>\w+)\((?<args>[^)]*)\)\s*;?\s*$/,
  },
  {
    name: "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS",
    pattern: /^\s*\[\s*(?<retval>[^\]]+)\s*\]\s*=\s*(?<name>\w+)\((?<args>[^)]*)\)(?:\s*;|\s*$)/,
  },
  {
    name: "ANONYMOUS_FUNCTION",
    pattern: /(?<name>\w+)\s*=\s*@\((?<args>[^\\)]*)\)/,
  },
  { name: "END_FUNCTION", pattern: /(endfunction|end)/i },
  // {
  //   name: "VARIABLE_DECLARATION",
  //   pattern: /(\w+)\s*=\s*(.*)/,
  // },
  // {
  //   name: "VARIABLE_REFERENCE",
  //   pattern: /(?<!\w)(?!if|while|for|switch)(?!.*\s=\s)(\w+)(?!\()/,
  // },
  // {
  //   name: "FOR_LOOP_START",
  //   pattern: /^\s*for\s+(\w+)\s*=\s*(\S+)\s*:\s*(\S+)\s*(?::\s*(\S+))?/i,
  // },
  // {
  //   name: "FOR_LOOP_END",
  //   pattern: /end\s*for/i,
  // },
  // {
  //   name: "WHILE_LOOP_START",
  //   pattern: /^\s*while\s+(.*)/i,
  // },
  // {
  //   name: "WHILE_LOOP_END",
  //   pattern: /end\s*while/i,
  // },
];
