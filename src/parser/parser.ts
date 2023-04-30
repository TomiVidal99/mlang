import { TextDocument, Range, Position, Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { GRAMMAR, IToken, TokenNameType } from "./grammar";
import { IKeyword, formatURI, getRangeFrom2Points } from "../utils";
import { randomUUID } from "crypto";
import { log } from "../server";

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

    const args = match[token.name === "FUNCTION_WITHOUT_OUTPUT" ? 2 : 3]
      .split(",")
      .map((arg) => arg.trim());

    const output =
      token.name === "FUNCTION_WITHOUT_OUTPUT"
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
        match[0].indexOf(match[token.name === "FUNCTION_WITH_OUTPUT" ? 2 : 1])
      ),
      type: token.name,
      arguments: args,
      output,
      name: match[token.name === "FUNCTION_WITH_OUTPUT" ? 2 : 1],
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
            case "FUNCTION_WITH_OUTPUT":
            case "FUNCTION_WITHOUT_OUTPUT":
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
            case "FUNCTION_REFERENCE":
              this.visitFunctionReference({ match, lineNumber });
              break;
            // case "WHILE_LOOP_START":
            // case "WHILE_LOOP_END":
            // case "FOR_LOOP_START":
            // case "FOR_LOOP_END":
            // case "VARIABLE_REFERENCE":
            //
            //   break;
            // case "VARIABLE_DECLARATION":
            //   break;
          }
        }
      }
    }
  }

  /**
   * when a function reference it's met.
   */
  visitFunctionReference({ match, lineNumber }: { match: RegExpMatchArray; lineNumber: number; }): void {
    log("FUNCTION REFERENCE: " + JSON.stringify(match) + ", args: " + JSON.stringify(match.groups.args) + ", reval: " + JSON.stringify(match.groups.retval));
    const reference: IFunctionReference = {
      name: match.groups.name,
      start: Position.create(lineNumber, match.index),
      end: Position.create(lineNumber, match.index + match[0].indexOf(match.groups.name))
    };
    if (match.groups?.args && match.groups?.args !== "") {
      reference.arguments = match.groups.args.split(",").map(arg => arg.trim());
    }
    if (match.groups?.retval && match.groups?.retval !== "") {
      reference.output = match.groups.retval.split(",").map(out => out.trim());
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
}
