import { Range } from "vscode-languageserver";
import { Symbols } from ".";

export type TokenType = keyof typeof Symbols | "LITERAL" | "NUMBER" | "ILLEGAL" | "IDENTIFIER" | "STRING" | "KEYWORD";

export type Token = {
  content: string,
  type: TokenType,
}

interface IDefinition {
  name: string;
  position: Range;
}

export interface FunctionDefinition extends IDefinition {
  arguments: void;
}

export interface VariableDefinition extends IDefinition {
  content: string;
}
