import { Token, getTokenFromSymbols } from "../types";
import { getKeywordsFromCompletion, isLetter, isNumber } from "../utils";

export class Tokenizer {
  private currPos = 0;
  private nextPos = 0;
  private currChar: string;
  private nextChar: string;

  constructor(private text: string) {
    this.readChar();
  }

  /**
   * Returns all tokens in the text
   */
  public getAllTokens(): Token[] {
    const tokens: Token[] = [];
    do {
      tokens.push(this.getNextToken());
    } while (tokens[tokens.length-1].type !== "EOF");

    return tokens;
  }

  /**
   * Gets the next token
   */
  public getNextToken(): Token {

    // ignore spaces and jump lines
    while (/\s/.test(this.currChar)) {
      this.readChar();
    }

    const token = getTokenFromSymbols(this.currChar);
    if (token) {
      this.readChar();
      return this.addToken(token);
    }

    if (isLetter(this.currChar)) {
      const literal = this.readLiteral();
      return this.addToken(this.tokenFromLiteral(literal));
    } else if (isNumber(this.currChar)) {
      const number = this.readNumber();
      return this.addToken({
        type: "NUMBER",
        content: number,
      });
    } else if (this.currChar === '"' || this.currChar === "'") {
      const str = this.readLiteralString();
      return this.addToken({
        type: "STRING",
        content: str,
      });
    } else {
      this.readChar();
      return this.addToken({
        type: "ILLEGAL",
        content: "illegal",
      });
    }

  }

  private addToken(token: Token): Token {
    return token;
  }

  /**
   * Returns the Token corresponding to keywords or literals.
   */
  private tokenFromLiteral(literal: string): Token {
    const keywords = getKeywordsFromCompletion();
    for (const keyword of keywords) {
      if (keyword === literal) {
        return {
          type: "KEYWORD",
          content: literal,
        };
      }
    }
    return {
      type: "IDENTIFIER",
      content: literal,
    };
  }

  /**
 * Returns the rows and columns corresponding to the current position in the text.
 * @returns {[number, number]} An array containing the row and column.
 */
  private getRowsColsCursor(): [number, number] {
    const textUntilCurrentPosition = this.text.slice(0, this.currPos);
    const rows = textUntilCurrentPosition.split('\n');
    const currentRow = rows.length;
    const currentColumn = rows[currentRow - 1].length + 1;

    return [currentRow, currentColumn];
  }

  /**
   * Reads the next character
   */
  private readChar(): void {
    if (this.currPos >= this.text.length || this.text.length <= 3) {
      this.currChar = "\0";
      this.nextChar = "\0";
      return;
    }

    if (this.nextPos === 0) {
      this.currChar = this.text[0];
      this.nextChar = this.text[1];
      this.currPos = 1;
      this.nextPos = 2;
      return;
    } else if (this.nextPos >= this.text.length) {
      this.currChar = this.nextChar;
      this.nextChar = " ";
      this.currPos = this.nextPos;
      return;
    } else {
      this.currChar = this.nextChar;
      this.nextChar = this.text[this.nextPos];
      this.currPos = this.nextPos;
      this.nextPos++;
      return;
    }

  }

  /**
   * Reads a literal (it's just text, adjacent characters that may contain an underscore '_' or numbers after the first letter)
   * @returns {string} literal
   */
  private readLiteral(): string {
    let literal = '';
    while (/[a-zA-Z0-9_]/.test(this.currChar) && this.currPos < this.text.length) {
      literal += this.currChar;
      this.readChar();
    }
    return literal;
  }

  /**
   * Reads a literal number (it can be an integer, a float or a number in scientific notation)
   * @returns {string} literal
   */
  private readNumber(): string {
    let literal = '';

    while (/\d/.test(this.currChar) ||
      /\.\d/.test(this.currChar + this.nextChar) ||
      /e\d/.test(this.currChar + this.nextChar) ||
      /e[++-]/.test(this.currChar + this.nextChar) ||
      /-\d/.test(this.currChar + this.nextChar)
    ) {
      literal += this.currChar;
      this.readChar();
    }

    return literal;
  }

  /**
   * Gets a literal string from the text.
   */
  private readLiteralString() {
    let literal = '"';

    do {
      this.readChar();
      literal += this.currChar;
    } while (this.currChar !== '"' && this.currPos < this.text.length);
    this.readChar();

    return literal;
  }

}
