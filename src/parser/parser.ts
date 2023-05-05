import { Range, Position, Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { GRAMMAR, IToken, TokenNameType } from "./grammar";
import { parseMultipleMatchValues } from "../utils";
import { addDocumentsFromPath } from "../server";
import { TextDocument } from "vscode-languageserver-textdocument";

export interface IFunctionDefinition {
  start: Position;
  end?: Position;
  type: TokenNameType;
  name: string;
  arguments?: string[];
  output?: string[];
  depth: number; // this indicates weather the function it's defined within another function
}

export interface IFunctionReference {
  start: Position;
  end: Position;
  name: string;
  arguments?: string[];
  output?: string[];
  depth: number;
}

export interface IVariableDefinition {
  start: Position;
  end?: Position;
  type: TokenNameType;
  name: string;
}

export interface IVariableReference {
  start: Position;
  end: Position;
  name: string;
}

export class Parser {
  // private uri: string;
  private text: string;
  private functionsDefinitions: IFunctionDefinition[];
  private functionsReferences: IFunctionReference[];
  // private variablesDefinitions: IVariableDefinition[];
  // private variablesReferences: IVariableReference[];
  private diagnostics: Diagnostic[];
  private lines: string[];

  public constructor(document: TextDocument) {
    this.text = document.getText();
    this.lines = this.text.split("\n");
    // this.uri = document.uri;
    this.functionsDefinitions = [];
    this.functionsReferences = [];
    // this.variablesDefinitions = [];
    // this.variablesReferences = [];
    this.diagnostics = [];

    this.tokenizeText();
  }

  private visitFunctionDefinition({
    match,
    lineNumber,
    token,
    line,
  }: {
    line: string;
    match: RegExpMatchArray;
    token: IToken;
    lineNumber: number;
  }) {

    if (!this.diagnoseKeywordNaming({ line, match, lineNumber })) return;

    const functionDefinition: IFunctionDefinition = {
      start: Position.create(
        lineNumber,
        match.index +
        match[0].indexOf(match.groups?.name)
      ),
      type: token.name,
      arguments: parseMultipleMatchValues(match.groups?.args),
      output: parseMultipleMatchValues(match.groups?.retval),
      name: match.groups?.name,
      depth: this.helperGetFunctionDefinitionDepth({ lineNumber })
    };

    this.functionsDefinitions.push(functionDefinition);
  }

  private closeFunctionDefintion({ lineNumber }: { lineNumber: number }): void {
    for (let i = this.functionsDefinitions.length - 1; i >= 0; i--) {
      const currentFunctionDef = this.functionsDefinitions[i];
      if (!currentFunctionDef.end) {
        currentFunctionDef.end = Position.create(lineNumber, 0);
        return;
      }
    }
    // TODO: should add diagnostics here
    console.error(
      `Error: No matching opening function definition for at line ${lineNumber}`
    );
  }

  private visitAnonymousFunctionDefinition({
    match,
    token,
    lineNumber,
    line,
  }: {
    line: string;
    match: RegExpMatchArray;
    token: IToken;
    lineNumber: number;
  }): void {
    // log("visitAnonymousFunctionDefinition: " + JSON.stringify(match));
    this.diagnoseKeywordNaming({ line, match, lineNumber });
    const functionDefinition: IFunctionDefinition = {
      start: Position.create(lineNumber, 0),
      end: Position.create(lineNumber, 0),
      name: match[1],
      type: token.name,
      arguments: parseMultipleMatchValues(match.groups?.retval),
      depth: this.helperGetFunctionDefinitionDepth({ lineNumber })
    };
    this.functionsDefinitions.push(functionDefinition);
  }

  /**
   * Returns the depth in a function definition of the current function definition.
   * If it's 0 then it means that the function it's defined at file level.
   */
  private helperGetFunctionDefinitionDepth({ lineNumber }: { lineNumber: number }): number {
    if (this.functionsDefinitions.length === 0) {
      // case for a definition at file level
      return 0;
    }
    let foundDepthFlag = false;
    this.functionsDefinitions.forEach((func) => {
      if (func.end && func.end.line > lineNumber) {
        foundDepthFlag = true;
        return func.depth + 1;
      }
    });
    if (!foundDepthFlag) {
      // this cases occurs when there are multiple definitions not closed with the 'end' keyword
      return 0;
    }
  }

  /**
   * Returns the depth in scope of a function reference
   * If it's 0 then it means that the function it's defined at file level.
   */
  private helperGetFunctionReferenceDepth({ lineNumber}: { lineNumber: number}): number {
    if (this.functionsDefinitions.length === 0) {
      // case for a definition at file level
      return 0;
    }
    let foundDepthFlag = false;
    for (let i = this.functionsDefinitions.length; i > 0; i--) {
      const func = this.functionsDefinitions[i-1];
      if (func.start.line < lineNumber && func.end && func.end.line > lineNumber) {
        foundDepthFlag = true;
        return func.depth;
      }
    }
    if (!foundDepthFlag) {
      // this cases occurs when there are one or more definitions not closed with the 'end' keyword
      return -1;
    }
  }

  /**
   * Sends a diagnostics if there are any statement or loop, etc
   * that does not have it's corresponding closing keyword
   */
  checkClosingBlocks(): void {
    const funcDef = this.functionsDefinitions.some((def) => !def.end);
    if (funcDef) {
      const endline = this.lines.length;
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: Position.create(endline, 0),
          end: Position.create(endline, 0)
        },
        message: "missing closing keyword",
        source: "mlang",
      };
      this.diagnostics.push(diagnostic);
    }
  }

  private tokenizeText(): void {
    const lines = this.text.split("\n");
    for (let lineNumber = 1; lineNumber < lines.length + 1; lineNumber++) {
      const line = lines[lineNumber - 1];
      // ignore comments # or %
      if (/^\s*[%#].*/.test(line)) continue;
      for (
        let grammarIndex = 0;
        grammarIndex < GRAMMAR.length;
        grammarIndex++
      ) {
        const token = GRAMMAR[grammarIndex];
        const match = line.match(token.pattern);
        if (!match) continue;
        this.consoleOutputWarning({ line, match, lineNumber: lineNumber - 1, token });
        switch (token.name) {
          case "FUNCTION_DEFINITION_WITH_OUTPUT":
          case "FUNCTION_DEFINITION_WITHOUT_OUTPUT":
            this.visitFunctionDefinition({
              match,
              token,
              lineNumber: lineNumber - 1,
              line,
            });
            break;
          case "ANONYMOUS_FUNCTION":
            this.visitAnonymousFunctionDefinition({
              match,
              lineNumber: lineNumber - 1,
              token,
              line,
            });
            break;
          case "END_FUNCTION":
            this.closeFunctionDefintion({ lineNumber });
            break;
          case "FUNCTION_REFERENCE_WITHOUT_OUTPUT":
          case "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS":
          case "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT":
            this.visitFunctionReference({
              match,
              lineNumber: lineNumber - 1,
              line,
            });
            break;

          case "WHILE_LOOP_START":
          case "WHILE_LOOP_END":
          case "FOR_LOOP_START":
          case "FOR_LOOP_END":
          case "VARIABLE_REFERENCE":
          case "VARIABLE_DECLARATION":
            break;
        }
      }
    }

    this.checkClosingBlocks();

  }

  /**
   * when a function reference it's met.
   */
  visitFunctionReference(
    { line, match, lineNumber }:
      {
        line: string;
        lineNumber: number;
        match: RegExpMatchArray;
      }): void {

    if (!this.diagnoseKeywordNaming({ line, match, lineNumber })) return;
    this.handleReferenceAddPath({ match });

    const args = parseMultipleMatchValues(match.groups?.retval);
    const outputs = parseMultipleMatchValues(match.groups?.retval);

    const reference: IFunctionReference = {
      name: match.groups?.name ? match.groups?.name : "ERROR",
      start: Position.create(lineNumber, match.index),
      end: Position.create(lineNumber, match.index + match[0].indexOf(match.groups?.name)),
      depth: this.helperGetFunctionReferenceDepth({lineNumber}),
    };
    if (args.length > 0) {
      reference.arguments = args;
    }
    if (outputs.length > 0) {
      reference.output = outputs;
    }

    this.functionsReferences.push(reference);
  }

  handleReferenceAddPath({ match }: { match: RegExpMatchArray; }): void {
    if (match.groups?.name === "addpath") {
      const paths = parseMultipleMatchValues(match.groups?.args);
      // log("addpath found: " + JSON.stringify(paths));
      paths.forEach((p) => {
        addDocumentsFromPath(p);
      });
    }
  }

  /**
   * Returns the functions references of the document
   * TODO: think on how to add arguments and return values checking and completion.
   */
  getFunctionsReferences(): IFunctionReference[] {
    return this.functionsReferences;
  }

  /**
   * TODO: this should send the diagnostics to an array to be handled later
   * Sets a diagnostic for when the line does not 
   * have a ';' no output to console character
   */
  consoleOutputWarning({ line, lineNumber, token }: { line: string; lineNumber: number, match: RegExpMatchArray, token: IToken }): void {
    const validTokens = token.name === "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT" || token.name === "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS" || token.name === "FUNCTION_REFERENCE_WITHOUT_OUTPUT" || token.name === "VARIABLE_REFERENCE" || token.name === "VARIABLE_DECLARATION" || token.name === "ANONYMOUS_FUNCTION";
    if (!validTokens || line.trim() === "" || line.endsWith(";")) return;
    const range = Range.create(Position.create(lineNumber, line.length - 1), Position.create(lineNumber, line.length));
    // log(`${JSON.stringify(match)}, ${JSON.stringify(range)}`);
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range: range,
      message: "will output to console",
      source: "mlang",
      // relatedInformation: [
      // {
      //   location: {
      //     uri: formatURI(this.uri),
      //     range: range,
      //   },
      //   message: 'Spelling matters'
      // }]
    };

    this.diagnostics.push(diagnostic);
  }

  /**
   * Returns all the functions defintions for the current document
   */
  public getFunctionsDefinitions(): IFunctionDefinition[] {
    return this.functionsDefinitions.filter((def) => def.end);
  }

  public getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }

  /**
  * Checks that the keyword name it's correct. 
  * @returns {boolean} - true if it's a valid name.
  */
  private diagnoseKeywordNaming({ line, match, lineNumber }: { line: string, match: RegExpMatchArray, lineNumber: number }): boolean {
    const validNamingPattern = /^[a-zA-Z][^\s]*$/;
    const isNameValid = validNamingPattern.test(match.groups?.name);
    if (!isNameValid) {
      // sends error diagnostics
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: Position.create(lineNumber, line.indexOf(match.groups?.name)),
          end: Position.create(lineNumber, line.indexOf(match.groups?.name) + match.groups.name?.length - 1)
        },
        message: "wrong naming",
        source: "mlang",
      };
      this.diagnostics.push(diagnostic);
    }
    return isNameValid;
  }

}
