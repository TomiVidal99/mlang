import { Range, Position, Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { GRAMMAR, IToken, TokenNameType } from "./grammar";
import { IKeyword, formatURI, getRangeFrom2Points, parseMultipleMatchValues } from "../utils";
import { randomUUID } from "crypto";
import { log } from "../server";
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

  public constructor(document: TextDocument) {
    this.text = document.getText();
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
  }: {
    match: RegExpMatchArray;
    token: IToken;
    lineNumber: number;
  }) {

    if (!this.diagnoseKeywordNaming({ match, lineNumber })) return;

    const args = match[token.name === "FUNCTION_DEFINITION_WITHOUT_OUTPUT" ? 2 : 3]
      .split(",")
      .map((arg) => arg.trim());

    const output =
      token.name === "FUNCTION_DEFINITION_WITHOUT_OUTPUT"
        ? []
        : match[1]
          .slice(1, -1)
          .slice(-1, -1)
          .split(",")
          .map((arg) => arg.trim());

    const functionDefinition: IFunctionDefintion = {
      start: Position.create(
        lineNumber,
        match.index +
        match[0].indexOf(match[token.name === "FUNCTION_DEFINITION_WITH_OUTPUT" ? 2 : 1])
      ),
      type: token.name,
      arguments: args,
      output,
      name: match[token.name === "FUNCTION_DEFINITION_WITH_OUTPUT" ? 2 : 1],
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
  }: {
    match: RegExpMatchArray;
    token: IToken;
    lineNumber: number;
  }): void {
    const functionDefinition: IFunctionDefintion = {
      start: Position.create(
        lineNumber - 1,
        match.index + match[0].indexOf(match[1])
      ),
      end: Position.create(lineNumber - 1, match.index + match[0].length),
      name: match[1],
      type: token.name,
      arguments: match[2].split(",").map((arg) => arg.trim()),
    };
    this.functionsDefinitions.push(functionDefinition);
  }

  private tokenizeText(): void {
    const lines = this.text.split("\n");
    for (let lineNumber = 1; lineNumber < lines.length + 1; lineNumber++) {
      const line = lines[lineNumber - 1];
      // ignore comments # or %
      if (/^\s*[%#].*/.test(line)) return;
      for (
        let grammarIndex = 0;
        grammarIndex < GRAMMAR.length;
        grammarIndex++
      ) {
        const token = GRAMMAR[grammarIndex];
        const match = line.match(token.pattern);
        if (match) {
          this.consoleOutputWarning({ match, lineNumber, token });
          switch (token.name) {
            case "FUNCTION_DEFINITION_WITH_OUTPUT":
            case "FUNCTION_DEFINITION_WITHOUT_OUTPUT":
              this.visitFunctionDefinition({
                match,
                token,
                lineNumber: lineNumber - 1,
              });
              break;
            case "ANONYMOUS_FUNCTION":
              this.visitAnonymousFunctionDefinition({
                match,
                lineNumber,
                token,
              });
              break;
            case "END_FUNCTION":
              this.closeFunctionDefintion({ lineNumber });
              break;
            case "FUNCTION_REFERENCE_WITHOUT_OUTPUT":
              log(`without: ${JSON.stringify(match)}`);
              this.visitFunctionReference({
                match,
                lineNumber
              });
              break;
            case "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS":
              log(`multiple: ${JSON.stringify(match)}`);
              this.visitFunctionReference({
                match,
                lineNumber
              });
              break;
            case "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT":
              log(`single: ${JSON.stringify(match)}`);
              this.visitFunctionReference({
                match,
                lineNumber
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
    }
  }

  /**
   * when a function reference it's met.
   */
  visitFunctionReference(
    { match, lineNumber}:
      {
        lineNumber: number;
        match: RegExpMatchArray;
      }): void {

    if (!this.diagnoseKeywordNaming({match, lineNumber})) return;

    const args = parseMultipleMatchValues(match.groups?.retval ? match.groups?.retval : "");
    const outputs = parseMultipleMatchValues(match.groups?.retval ? match.groups?.retval : "");

    const reference: IFunctionReference = {
      name: match.groups?.name ? match.groups?.name : "ERROR",
      start: Position.create(lineNumber-1, match.index),
      end: Position.create(lineNumber-1, match.index + match[0].indexOf(match.groups?.name)),
    };
    if (args.length > 0) {
      reference.arguments = args;
    }
    if (outputs.length > 0) {
      reference.output = outputs;
    }

    this.functionsReferences.push(reference);
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
  consoleOutputWarning({ lineNumber, match, token }: { lineNumber: number, match: RegExpMatchArray, token: IToken }): void {
    if (token.name !== "VARIABLE_DECLARATION" || match[0].trim() === "" || match[0].endsWith(";")) return;
    const range = Range.create(Position.create(lineNumber, 0), Position.create(lineNumber, match[0].length));
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
  private diagnoseKeywordNaming({ match, lineNumber }: { match: RegExpMatchArray, lineNumber: number }): boolean {
    const validNamingPattern = /^[a-zA-Z][^\s]*$/;
    const isNameValid = validNamingPattern.test(match.groups?.name);
    if (!isNameValid) {
      // sends error diagnostics
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: Position.create(lineNumber, match[0].indexOf(match.groups?.name)),
          end: Position.create(lineNumber, match[0].indexOf(match.groups?.name) + match.groups.name?.length - 1)
        },
        message: "will output to console",
        source: "mlang",
      };
      this.diagnostics.push(diagnostic);
    }
    return isNameValid;
  }

}
