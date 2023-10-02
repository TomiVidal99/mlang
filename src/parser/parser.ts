import { Position, Range } from "vscode-languageserver";
import { FunctionDefinition, Token, VariableDefinition } from "../types";
import { Tokenizer } from "./tokenizer";

/**
 * Parses a string (text) into an AST.
 */
export class Parser {

  private tokens: Token[] = [];
  private functionDefinitions: FunctionDefinition[];
  private variableDefinitions: VariableDefinition[];

  constructor(private text: string) {
    this.functionDefinitions = [];
    this.variableDefinitions = [];
    this.getAllTokens();
  }

  private getAllTokens(): void {
    const tokenizer = new Tokenizer(this.text);
    let token: Token;
    do {
      token = tokenizer.getNextToken();
      this.tokens.push(token);
    } while (token.type !== "EOF");
  }

  /**
   * Extracts the functions definitions from the tokens in the text.
   * @returns {void} void
   */
  private createGrammar(): void {
    for (let i = 0; i < this.tokens.length - 1; i++) {
      const currentToken = this.tokens[i];
      const nextToken = this.tokens[i + 1];

      if (currentToken.type === "IDENTIFIER" && nextToken.type === "EQUALS") {
        this.variableDefinitions.push({
          name: currentToken.content,
          content: "content",
          position: Range.create(Position.create(0, 0), Position.create(0, 0))
        });
      }

    }
  }

  /**
   * Returns all the found tokens in a text
   */
  public getTextTokens(): Token[] {
    return this.tokens;
  }

}
