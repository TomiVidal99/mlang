import { Token } from "../types";
import { Tokenizer } from "./tokenizer";

export class Parser {
  private tokenizer: Tokenizer;
  private tokens: Token[] = [];

  constructor(text: string) {
    this.tokenizer = new Tokenizer(text);
    this.getAllTokens();
  }

  private getAllTokens(): void {
    let token: Token;
    do {
      token = this.tokenizer.getNextToken();
      this.tokens.push(token);
    } while (token.type !== "EOF");
  }

  /**
   * Returns all the found tokens in a text
   */
  public getTextTokens(): Token[] {
    return this.tokens;
  }

}
