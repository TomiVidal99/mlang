import { TextDocument, Range, Position } from "vscode-languageserver";
import { GRAMMAR, IToken, TokenNameType } from "./grammar";
import { IKeyword, getRangeFrom2Points } from "../utils";
import { randomUUID } from "crypto";
import { log } from "../server";

export interface IFunctionDefintion {
  start: Position;
  end?: Position;
  type: TokenNameType;
  name: string;
  arguments?: string[];
  output?: string[];
}

export class Parser {
  private uri: string;
  private text: string;
  private FunctionsDefinitions: IFunctionDefintion[];

  public constructor(document: TextDocument) {
    this.text = document.getText();
    this.uri = document.uri;
    this.FunctionsDefinitions = [];
    this.tokenizeText();
  }

  private visitFunctionWithNoOutput({
    match,
    line,
    lineNumber,
    token,
  }: {
    match: RegExpMatchArray;
    line: string;
    token: IToken;
    lineNumber: number;
  }) {

    // log("Match: " + JSON.stringify(match));

    const args = match[token.name === "FUNCTION_NO_OUTPUT" ? 2 : 3]
          .split(",")
          .map((arg) => arg.trim());

    const output = token.name === "FUNCTION_NO_OUTPUT" ? [] : match[1]
          .slice(1, -1)
          .slice(-1, -1)
          .split(",")
          .map((arg) => arg.trim());

    const functionDefinition: IFunctionDefintion = {
      start: Position.create(lineNumber, match.index + match[0].indexOf(match[token.name === "FUNCTION_WITH_OUTPUT" ? 2 : 1])),
      type: token.name,
      arguments: args,
      output,
      name: match[token.name === "FUNCTION_WITH_OUTPUT" ? 2 : 1],
    };

    this.FunctionsDefinitions.push(functionDefinition);
  }

  private closeFunctionDefintion({ lineNumber }: { lineNumber: number }): void {
    for (let i = this.FunctionsDefinitions.length - 1; i >= 0; i--) {
      const currentFunctionDef = this.FunctionsDefinitions[i];
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

  private tokenizeText(): void {
    const lines = this.text.split("\n");
    for (let lineNumber = 1; lineNumber < lines.length + 1; lineNumber++) {
      const line = lines[lineNumber - 1];
      // log("line: " + JSON.stringify(line));
      for (let grammarIndex = 0; grammarIndex < GRAMMAR.length; grammarIndex++) {
        const token = GRAMMAR[grammarIndex];
        const match = line.match(token.pattern);
        // log("(" + j.toString() + ", " + i.toString() + ") " + JSON.stringify(token));
        if (match) {
          switch (token.name) {
            case "FUNCTION_WITH_OUTPUT":
            case "FUNCTION_NO_OUTPUT":
              this.visitFunctionWithNoOutput({
                match,
                line,
                token,
                lineNumber: lineNumber-1,
              });
              break;

            case "FUNCTION_WITHOUT_NAME":
              this.FunctionsDefinitions.push({
                start: Position.create(grammarIndex, match.index),
                name: token.name,
                type: token.name,
              });
              break;

            case "END":
              this.closeFunctionDefintion({ lineNumber: grammarIndex });
              break;
          }
        }
      }
    }
  }

  /**
   * Returns all the functions defintions for the current document
   */
  public getFunctionsDefinitions(): IKeyword[] {
    const definitions = this.FunctionsDefinitions.map((fn) => {
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
}
