import { Range } from "vscode-languageserver";
import { Symbols } from ".";

export type TokenType = keyof typeof Symbols | "NUMBER" | "ILLEGAL" | "IDENTIFIER" | "STRING" | "KEYWORD" | "VECTOR";

export type Token = {
  content: string,
  type: TokenType,
}

export type ExpressionType = "IDENTIFIER" | "NUMBER" | "STRING";

export interface FunctionData {
  args?: Token[];
}

export interface Expression {
  type: TokenType | "BINARY_OPERATION" | "FUNCTION_CALL" | "VARIABLE_VECTOR";
  value: string | string[];
  LHO?: Expression;
  RHO?: Expression;
  operator?: string;
  functionData?: FunctionData;
}

export type StatementType = "ASSIGNMENT" | "FUNCTION_CALL" | "MO_ASSIGNMENT" | "FUNCTION_DEFINITION";

export interface Statement {
  type: StatementType
  supressOutput: boolean;
  operator?: string;
  LHE?: Expression;
  RHE?: Expression | Statement[];
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
