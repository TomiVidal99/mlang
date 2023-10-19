import { Range } from "vscode-languageserver";
import { Symbols } from ".";

export type TokenType = keyof typeof Symbols | "NUMBER" | "ILLEGAL" | "IDENTIFIER" | "STRING" | "KEYWORD" | "VECTOR" | "COMMENT";

export type Token = {
  content: string,
  type: TokenType,
  position: Range | null;
}

export type ExpressionType = "IDENTIFIER" | "NUMBER" | "STRING";

export interface FunctionData {
  args?: Token[];
  description?: string;
}

export interface Expression {
  type: TokenType | "BINARY_OPERATION" | "FUNCTION_CALL" | "VARIABLE_VECTOR" | "ANONYMOUS_FUNCTION_DEFINITION" | "FUNCTION_DEFINITION";
  value: string | string[];
  LHO?: Expression;
  RHO?: Expression | Statement[];
  operator?: string;
  functionData?: FunctionData;
  position?: Range;
}

export type StatementType = "ASSIGNMENT" | "FUNCTION_CALL" | "MO_ASSIGNMENT" | "FUNCTION_DEFINITION";

export interface Statement {
  type: StatementType
  supressOutput: boolean;
  operator?: string;
  LHE?: Expression;
  RHE?: Expression | Statement[];
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

export interface Reference extends IDefinition {
  opt?: any;
}
