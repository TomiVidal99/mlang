import {
  Range,
  Position,
  Diagnostic,
  DiagnosticSeverity,
} from "vscode-languageserver";
import { BASIC_TYPES_REGEXS, BasicType, GRAMMAR, IToken } from "./grammar";
import {
  checkIfPathExists,
  getNotFoundReferenceDiagnostic,
  getWrongArgumentsDiagnostic,
  parseMultipleMatchValues,
} from "../utils";
import { getAllFilepathsFromPath } from "../server";
import { TextDocument } from "vscode-languageserver-textdocument";
import { randomUUID } from "crypto";

const commentPattern = /^\s*(?!%(?:{|})|#(?:{|}))[#%%].*/;

export type StatementType = "IF" | "WHILE" | "FOR" | "DO" | "FUNCTION";

export interface IReference {
  lineNumber: number;
  name: string;
  depth: string[]; // it's the ordered list of context from the file context to the reference context
}

// make a IArgumentReference
export interface IArgument {
  name: string;
  content: string;
  type: BasicType;
  start?: string;
  step?: string;
  end?: string;
  math_expr?: string;
  isOptional: boolean;
}

export interface IFunctionDefinition {
  uri?: string;
  start: Position;
  end?: Position;
  type: StatementType;
  name: string;
  arguments?: IArgument[];
  output?: string[];
  depth: string; // this indicates weather the function it's defined within another function
  description: string[];
  context: string; // it's the unique identifier of the context that it creates, meaning the depth
}

export interface IFunctionReference {
  start: Position;
  end: Position;
  name: string;
  arguments?: IArgument[];
  output?: string[];
  depth: string[];
}

export interface IVariableDefinition {
  depth: string;
  uri?: string;
  start: Position;
  end?: Position;
  name: string;
  content: string[];
  lineContent: string;
}

export interface ICommentBlock {
  start: Position;
  end?: Position;
}

// TODO: maybe just use an array of lines?
export interface IErrorLines {
  lineNumber: number;
}

export interface IStatements {
  depth: string;
  type: StatementType;
  start: Position;
  end?: Position;
  context: string;
}

export interface IDepth {
  context: string;
  depth: number;
}

export interface IDepthLog extends IDepth {
  lineNumber: number;
}

export interface IVariableReference {
  name: string;
  start: Position;
  end: Position;
  depth: string;
}

export class Parser {

}
