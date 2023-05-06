import { Range, Position, Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { GRAMMAR, IToken, TokenNameType } from "./grammar";
import { parseMultipleMatchValues } from "../utils";
import { addDocumentsFromPath, log } from "../server";
import { TextDocument } from "vscode-languageserver-textdocument";

const commentPattern = /^\s*(?!%(?:{|})|#(?:{|}))[#%%].*/;

// TODO: think better how should the end keyword and such close the opened definitions/statements

export interface IFunctionDefinition {
  uri?: string;
  start: Position;
  end?: Position;
  type: TokenNameType;
  name: string;
  arguments?: string[];
  output?: string[];
  depth: number; // this indicates weather the function it's defined within another function
  description: string[];
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

export interface ICommentBlock {
  start: Position;
  end?: Position;
}

// TODO: maybe just use an array of lines?
export interface IErrorLines {
  lineNumber: number;
}

export class Parser {
  private text: string;
  private functionsDefinitions: IFunctionDefinition[];
  private functionsReferences: IFunctionReference[];
  private potentialErrorLines: IErrorLines[];
  // private variablesDefinitions: IVariableDefinition[];
  // private variablesReferences: IVariableReference[];
  private commentBlocks: ICommentBlock[];
  private diagnostics: Diagnostic[];
  private lines: string[];

  public constructor(document: TextDocument) {
    this.text = document.getText();
    this.lines = this.text.split("\n");
    this.functionsDefinitions = [];
    this.functionsReferences = [];
    this.commentBlocks = [];
    this.potentialErrorLines = [];
    // this.variablesDefinitions = [];
    // this.variablesReferences = [];
    this.diagnostics = [];

    this.tokenizeText();
  }

  private visitCommentBlock({match, lineNumber, start}: {match: RegExpMatchArray, lineNumber: number, start: boolean}): void {
    // starts the creation of a block
    if (start) {
      const block: ICommentBlock = {
        start: Position.create(lineNumber, 0),
      };
      this.commentBlocks.push(block);
      return;
    }

    // error if closing never opened block
    if (this.commentBlocks.length === 0) {
      const diagnostic: Diagnostic = {
        range: {
          start: Position.create(lineNumber, 0),
          end: Position.create(lineNumber, 0),
        },
        message: "TypeError: need to open a comment block before closing it",
        severity: DiagnosticSeverity.Error,
      };
      this.diagnostics.push(diagnostic);
      return;
    }

    // close the block
    this.commentBlocks.forEach((block) => {
      if (!block.end) {
        block.end = Position.create(lineNumber, 0);
        return;
      }
    });
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
      depth: this.helperGetFunctionDefinitionDepth({ lineNumber }),
      description: this.helperGetFunctionDefinitionDescription({lineNumber: lineNumber}),
    };

    this.functionsDefinitions.push(functionDefinition);
  }

  /**
   * Returns the commented lines after the function definition
   */
  helperGetFunctionDefinitionDescription({lineNumber}: {lineNumber: number}): string[] {
    const lines: string[] = [this.lines[lineNumber]];
    let currentLine = lineNumber+1;
    while (this.lines.length > currentLine && commentPattern.test(this.lines[currentLine])) {
      lines.push(this.lines[currentLine]);
      currentLine++;
    }
    return lines;
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
      depth: this.helperGetFunctionDefinitionDepth({ lineNumber }),
      description: this.helperGetFunctionDefinitionDescription({lineNumber: lineNumber}),
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
      if (!func.end || func.end.line > lineNumber) {
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
    this.sendDiagnositcError(this.functionsDefinitions.some((def) => !def.end), "missing closing keyword");
    this.sendDiagnositcError(this.commentBlocks.some((block) => !block.end), "missing closing comment block '%} or #}'");
  }

  private sendDiagnositcError(condition: boolean, message: string): void {
    if (condition) {
      const endline = this.lines.length;
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: Position.create(endline, 0),
          end: Position.create(endline, 0)
        },
        message,
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
      if (commentPattern.test(line)) continue;
      for (
        let grammarIndex = 0;
        grammarIndex < GRAMMAR.length;
        grammarIndex++
      ) {
        const token = GRAMMAR[grammarIndex];
        const match = line.match(token.pattern);
        if (!match) {
          // this.potentialErrorLines.push({lineNumber: lineNumber-1});
          continue;
        }
        this.consoleOutputWarning({ line, match, lineNumber: lineNumber - 1, token });
        switch (token.name) {
          case "FUNCTION_DEFINITION_WITH_SINGLE_OUTPUT":
          case "FUNCTION_DEFINITION_WITH_MULTIPLE_OUTPUT":
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
          case "FUNCTION_REFERENCE_WITHOUT_OUTPUT":
          case "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS":
          case "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT":
            this.visitFunctionReference({
              match,
              lineNumber: lineNumber - 1,
              line,
            });
            break;

          case "COMMON_KEYWORDS":
          case "DO_STATEMENT":
          case "UNTIL_STATEMENT":
          case "IF_STATEMENT_START":
          case "ELSE_STATEMENT":
          case "ELSE_IF_STATEMENT":
          case "WHILE_STATEMENT_START":
          case "FOR_STATEMENT_START":
          case "VARIABLE_REFERENCE":
          case "VARIABLE_DECLARATION":
            break;

          case "END":
            this.closeFunctionDefintion({ lineNumber });
            break;

          case "COMMENT_BLOCK_START":
            this.visitCommentBlock({match, lineNumber: lineNumber-1, start: true});
            break;
          case "COMMENT_BLOCK_END":
            this.visitCommentBlock({match, lineNumber: lineNumber-1, start: false});
            break;

          default:
          // case "ANY":
            // this should be the last item in the list
            // if execute it should warn that the current line did not match any token
            // thus conclude that the line has an error
            // TODO: maybe i dont need this?
            // this.potentialErrorLines.push({lineNumber: lineNumber-1});
          break;
        }
      }
    }

    this.checkClosingBlocks();
    // this.cleanUpPotentialErrorLines();
    // log(JSON.stringify(this.commentBlocks));

  }

  // Removes the lines that are commented
  private cleanUpPotentialErrorLines(): void {
    this.potentialErrorLines.forEach((line) => {
      this.commentBlocks.forEach((block) => {
        if (block.end && block.start.line < line.lineNumber && block.end.line > line.lineNumber) {
          return;
        }
      });
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: Position.create(line.lineNumber, 1),
          end: Position.create(line.lineNumber, 1)
        },
        message: "syntax error?",
        source: "mlang",
      };
      this.diagnostics.push(diagnostic);
    });
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
