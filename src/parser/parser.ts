import { Range, Position, Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { GRAMMAR, IToken, TokenNameType } from "./grammar";
import { IKeyword, addNewDocument, debounce, formatURI, getRangeFrom2Points, parseMultipleMatchValues } from "../utils";
import { randomUUID } from "crypto";
import { addDocumentsFromPath, log } from "../server";
import { TextDocument } from "vscode-languageserver-textdocument";

interface IFunctionDefintion {
  start: Position;
  end?: Position;
  type: TokenNameType;
  name: string;
  arguments?: string[];
  output?: string[];
}

interface IFunctionReference {
  start: Position;
  end: Position;
  name: string;
  arguments?: string[];
  output?: string[];
}

interface IVariableDefinition {
  start: Position;
  end?: Position;
  type: TokenNameType;
  name: string;
}

interface IVariableReference {
  start: Position;
  end: Position;
  name: string;
}

export class Parser {
  private uri: string;
  private text: string;
  private functionsDefinitions: IFunctionDefintion[];
  private functionsReferences: IFunctionReference[];
  private variablesDefinitions: IVariableDefinition[];
  private variablesReferences: IVariableReference[];
  private diagnostics: Diagnostic[];
  private lines: string[];

  public constructor(document: TextDocument) {
    this.text = document.getText();
    this.lines = this.text.split("\n");
    this.uri = document.uri;
    this.functionsDefinitions = [];
    this.functionsReferences = [];
    this.variablesDefinitions = [];
    this.variablesReferences = [];
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

    const functionDefinition: IFunctionDefintion = {
      start: Position.create(
        lineNumber,
        match.index +
        match[0].indexOf(match.groups?.name)
      ),
      type: token.name,
      arguments: parseMultipleMatchValues(match.groups?.args),
      output: parseMultipleMatchValues(match.groups?.retval),
      name: match.groups?.name,
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
    const functionDefinition: IFunctionDefintion = {
      start: Position.create(lineNumber, 0),
      end: Position.create(lineNumber, 0),
      // start: Position.create(
      //   lineNumber - 1,
      //   match.index + match[0].indexOf(match.groups?.name)
      // ),
      // end: Position.create(lineNumber - 1, match.index + match[0].indexOf(match.groups?.name) + match.groups?.name.length),
      name: match[1],
      type: token.name,
      arguments: parseMultipleMatchValues(match.groups?.retval),
    };
    this.functionsDefinitions.push(functionDefinition);
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
    this.handleReferenceAddPath({match});

    const args = parseMultipleMatchValues(match.groups?.retval);
    const outputs = parseMultipleMatchValues(match.groups?.retval);

    const reference: IFunctionReference = {
      name: match.groups?.name ? match.groups?.name : "ERROR",
      start: Position.create(lineNumber, match.index),
      end: Position.create(lineNumber, match.index + match[0].indexOf(match.groups?.name)),
    };
    if (args.length > 0) {
      reference.arguments = args;
    }
    if (outputs.length > 0) {
      reference.output = outputs;
    }

    this.functionsReferences.push(reference);
  }

  handleReferenceAddPath({match}: { match: RegExpMatchArray; }): void {
    if (match.groups?.name === "addpath") {
      const paths = parseMultipleMatchValues(match.groups?.args);
      log("addpath found: " + JSON.stringify(paths));
      paths.length === 1 ? addDocumentsFromPath(paths[0]) : paths.forEach((p) => {addDocumentsFromPath(p);});
    }
  }

  /**
   * Returns the functions references of the document
   * TODO: think on how to add arguments and return values checking and completion.
   */
  getFunctionsReferences(): IKeyword[] {
    const references: IKeyword[] = this.functionsReferences.map((reference) => {
      const ref: IKeyword = {
        id: randomUUID(),
        name: reference.name,
        uri: formatURI(this.uri),
        range: {
          start: reference.start,
          end: reference.end,
        },
      };
      return ref;
    });
    return references;
  }

  /**
   * TODO: this should send the diagnostics to an array to be handled later
   * Sets a diagnostic for when the line does not 
   * have a ';' no output to console character
   */
  consoleOutputWarning({ line, lineNumber, match, token }: { line: string; lineNumber: number, match: RegExpMatchArray, token: IToken }): void {
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
  public getFunctionsDefinitions(): IKeyword[] {
    const definitions = this.functionsDefinitions.map((fn) => {
      if (!fn?.end) {
        return;
      }
      const fnDef: IKeyword = {
        name: fn.name,
        id: randomUUID(),
        uri: this.uri,
        range: getRangeFrom2Points(fn.start, fn.end),
      };
      return fnDef;
    });
    return definitions;
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
