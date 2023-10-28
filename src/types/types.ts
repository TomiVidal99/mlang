import { Range } from "vscode-languageserver";
import { Symbols } from ".";

export interface LintingMessage {
  message: string;
  range: Range;
}

export interface LintingError extends LintingMessage {
  opt?: any;
}

export interface LintingWarning extends LintingMessage {
  opt?: any;
}

export type TokenType = keyof typeof Symbols | "NUMBER" | "ILLEGAL" | "IDENTIFIER" | "STRING" | "KEYWORD" | "VECTOR" | "COMMENT" | "DEFAULT_VALUE_ARGUMENT";

export type Token = {
  content: string | Token[],
  type: TokenType,
  position: Range | null;
  defaultValue?: Token;
}

export interface FunctionData {
  args?: Token[];
  description?: string;
  closingToken?: Token;
  contextCreated?: string;
}

export interface Expression {
  type: TokenType | "BINARY_OPERATION" | "FUNCTION_CALL" | "VARIABLE_VECTOR" | "ANONYMOUS_FUNCTION_DEFINITION" | "FUNCTION_DEFINITION";
  value: string | string[] | Token[];
  LHO?: Expression;
  RHO?: Expression | Statement[];
  operator?: string;
  functionData?: FunctionData;
  position?: Range;
}

export type StatementType = "ASSIGNMENT" | "FUNCTION_CALL" | "MO_ASSIGNMENT" | "FUNCTION_DEFINITION" | "CONSOLE_OUTPUT";

export interface Statement {
  type: StatementType
  supressOutput: boolean;
  context: string;
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

export type DefinitionType = "FUNCTION" | "VARIABLE" | "ARGUMENT" | "ANONYMOUS_FUNCTION";

export interface Definition extends IDefinition {
  type: DefinitionType;
  documentation: string;
  arguments?: Definition[];
  content?: string;
}

export type ReferenceType = "FUNCTION" | "VARIABLE";

export interface Reference extends IDefinition {
  type: ReferenceType;
  documentation: string;
}
