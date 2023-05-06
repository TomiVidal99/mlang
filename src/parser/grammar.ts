// IMPORTANT: the regex that have groups that returns values should be named like so:
// (?<GROUP_NAME>mypattern)

import { completionData } from "../data";

// TODO: arguments need to change to consider default values
// TODO: add end keyword for other methods, else it messes up the other definitions

const COMMON_KEYWORDS = [
  "break",
  "continue",
  "return",
  "exit",
  ...completionData.map((data) => data.label)
];

export interface IToken {
  name: TokenNameType;
  pattern: RegExp;
}

export type TokenNameType =
  | "ANY"
  | "FILE_REFERENCE"
  | "END"
  | "COMMON_KEYWORDS"
  | "COMMENT_BLOCK_START"
  | "COMMENT_BLOCK_END"
  | "DO_STATEMENT"
  | "UNTIL_STATEMENT"
  | "IF_STATEMENT_START"
  | "ELSE_STATEMENT"
  | "ELSE_IF_STATEMENT"
  | "WHILE_STATEMENT_START"
  | "FOR_STATEMENT_START"
  | "VARIABLE_REFERENCE"
  | "VARIABLE_DECLARATION"
  | "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT"
  | "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS"
  | "FUNCTION_REFERENCE_WITHOUT_OUTPUT"
  | "FUNCTION_DEFINITION_WITH_SINGLE_OUTPUT"
  | "FUNCTION_DEFINITION_WITH_MULTIPLE_OUTPUT"
  | "FUNCTION_DEFINITION_WITHOUT_OUTPUT"
  | "ANONYMOUS_FUNCTION";

export const GRAMMAR: IToken[] = [
  {
    name: "FUNCTION_DEFINITION_WITH_MULTIPLE_OUTPUT",
    pattern:
      /function\s+(?:\[\s*(?<retval>[\w\s,]*)\s*\])\s*=\s*(?<name>\w+)\s*\((?<args>.*?)\)/,
  },
  {
    name: "FUNCTION_DEFINITION_WITH_SINGLE_OUTPUT",
    pattern:
      /function\s+(?<retval>\w+)\s*=\s*(?<name>\w+)\s*\((?<args>.*?)\)/,
  },
  {
    name: "FUNCTION_DEFINITION_WITHOUT_OUTPUT",
    pattern: /^\s*function\s+(?<name>\w+)\s*\((?<args>.*?)\)/,
  },
  {
    name: "FUNCTION_REFERENCE_WITHOUT_OUTPUT",
    pattern: /^\s*(?<name>\w+)\((?<args>.*?)\)(?:\s*;|\s*$)/,
  },
  {
    name: "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT",
    pattern: /^\s*(?<retval>\w+)\s*=\s*(?<name>\w+)\((?<args>.*?)\)\s*;?\s*$/,
  },
  {
    name: "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS",
    pattern: /^\s*\[\s*(?<retval>[^\]]+)\s*\]\s*=\s*(?<name>\w+)\((?<args>.*?)\)(?:\s*;|\s*$)/,
  },
  {
    name: "ANONYMOUS_FUNCTION",
    pattern: /(?<name>\w+)\s*=\s*@\((?<args>.*?)\)/,
  },
  // {
  //   name: "VARIABLE_DECLARATION",
  //   pattern: /(\w+)\s*=\s*(.*)/,
  // },
  // {
  //   name: "VARIABLE_REFERENCE",
  //   pattern: /(?<!\w)(?!if|while|for|switch)(?!.*\s=\s)(\w+)(?!\()/,
  // },
  {
    name: "FOR_STATEMENT_START",
    pattern: /^\s*(for).*/,
  },
  {
    name: "WHILE_STATEMENT_START",
    pattern: /^\s*(while).*/,
  },
  {
    name: "IF_STATEMENT_START",
    pattern: /^\s*(if).*/,
  },
  {
    name: "ELSE_IF_STATEMENT",
    pattern: /^\s*(elseif).*/,
  },
  {
    name: "ELSE_STATEMENT",
    pattern: /^\s*(else).*/,
  },
  {
    name: "END",
    pattern: /^\s*(end|endfunction|endwhile|endif|endfor)\b/,
  },
  {
    name: "COMMON_KEYWORDS",
    pattern: new RegExp(`^\\s*(${COMMON_KEYWORDS.join("|")})\\b\\s*;?\\s*`),
  },
  {
    name: "COMMENT_BLOCK_START",
    pattern: /^\s*(break|continue)\b\s*;?\s*$/,
  },
  {
    name: "COMMENT_BLOCK_END",
    pattern: /^\s*(break|continue)\b\s*;?\s*$/,
  },
  {
    name: "FILE_REFERENCE",
    pattern: /^\s*(?<name>[a-zA-Z_]+)\s*(?:;|\(\)|\(\);)?\s*$/,
  },
  {
    name: "ANY",
    pattern: /\S+/,
  },
];
