import { Token, getTokenFromSymbols } from "../types";
import { isLetter, isNumber } from "../utils";

export class Tokenizer {
  private currPos = 0;
  private nextPos = 0;
  private text: string;
  private currChar: string;
  private nextChar: string;

  constructor(text: string) {
    this.text = text;
    this.readChar();
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
      return token;
    }

    if (isLetter(this.currChar)) {
      const literal = this.readLiteral();
      return {
        type: "LITERAL",
        content: literal,
      };
    } else if (isNumber(this.currChar)) {
      const number = this.readNumber();
      return {
        type: "NUMBER",
        content: number,
      };
    } else {
      this.readChar();
      return {
        type: "EOF",
        content: "eof",
      };
    }

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
      /\.\d/.test(this.currChar+this.nextChar) ||
      /e\d/.test(this.currChar+this.nextChar) ||
      /e[++-]/.test(this.currChar+this.nextChar) ||
      /-\d/.test(this.currChar+this.nextChar)
    ) {
      literal += this.currChar;
      this.readChar();
    }

    return literal;
  }

}
