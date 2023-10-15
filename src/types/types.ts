import { Range } from "vscode-languageserver";
import { Symbols } from ".";

export type TokenType = keyof typeof Symbols | "NUMBER" | "ILLEGAL" | "IDENTIFIER" | "STRING" | "KEYWORD";

export type Token = {
  content: string,
  type: TokenType,
}

export type ExpressionType = "IDENTIFIER" | "NUMBER" | "STRING";

export interface Expression {
  type: TokenType | "BINARY_OPERATION";
  value: string;
  LHO?: Expression;
  RHO?: Expression;
  operator?: string;
}

export type StatementType = "ASSIGNMENT";

export interface Statement {
  type: StatementType
  operator: string;
  LHE: Expression;
  RHE: Expression;
  position?: Range;
}

export interface Program {
  type: "Program";
  body: Statement[];
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
