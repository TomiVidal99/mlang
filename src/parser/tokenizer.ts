import { Token, getTokenFromSymbols } from "../types";
import { getKeywordsFromCompletion, getRowsAndColsInCursor, isLetter, isNumber } from "../utils";
import {Range} from "vscode-languageserver";

export class Tokenizer {
  private currPos = 0;
  private nextPos = 0;
  private currChar: string;
  private nextChar: string;
  private tokens: Token[] = [];

  constructor(private text: string) {
    this.readChar();
  }

  /**
   * Returns all tokens in the text
   * TODO: maybe update this to use this.tokens??
   */
  public getAllTokens(): Token[] {
    const tokens: Token[] = [];
    do {
      tokens.push(this.getNextToken());
    } while (tokens[tokens.length - 1].type !== "EOF");

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
    if (token && this.isValidStartingToken(token)) {
      this.readChar();
      return this.addToken({
        ...token,
        position: this.getPosition(token.type !== "EOF" ? token.content : ""),
      });
    }

    if (this.currChar === "#" || this.currChar === "%") {
      const comment = this.readComment();
      return this.addToken({
        type: "COMMENT",
        content: comment,
        position: this.getPosition(comment),
      });
    } else if (isLetter(this.currChar)) {
      const intialPos = this.currPos;
      const literal = this.readLiteral();
      const postPos = this.currPos;
      this.currPos = intialPos-1;
      const position = this.getPosition(literal);
      this.currPos = postPos;
      return this.addToken({
        ...this.tokenFromLiteral(literal),
        position,
      });
    } else if (isNumber(this.currChar)) {
      const number = this.readNumber();
      return this.addToken({
        type: "NUMBER",
        content: number,
        position: this.getPosition(number),
      });
    } else if (this.currChar === '"' || this.currChar === "'") {
      const str = this.readLiteralString();
      return this.addToken({
        type: "STRING",
        content: str,
        position: this.getPosition(str),
      });
    } else {
      this.readChar();
      return this.addToken({
        type: "ILLEGAL",
        content: "illegal",
        position: null,
      });
    }

  }

  /**
   * Helper that checks that the current character can be a single token
   * i.e: 1 % 2, '%' it's a valid token.
   * but: % this is a comment, '%' it's NOT a valid token.
   */
  private isValidStartingToken(token: Token): boolean {
    if (token.type !== "MODULUS") return true;
    const lastToken = this.tokens[this.tokens.length - 1];
    return (lastToken && (lastToken.type === "IDENTIFIER" || lastToken.type === "NUMBER"));
  }

  /**
   * Helper that reads a comment and returns the content
   */
  private readComment(): string {
    let comment = "";
    do {
      comment += this.currChar;
      this.readChar();
    } while (this.currChar !== "\n" && this.currPos < this.text.length);
    return comment;
  }

  private addToken(token: Token): Token {
    this.tokens.push(token);
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
          position: null,
        };
      }
    }
    return {
      type: "IDENTIFIER",
      content: literal,
      position: null,
    };
  }


  /**
   * Helper that returns the Range position
   * if endPoint it's provided it will make a range from the current character position
   * to the endPoint. Else it considers that the range it's from the current position
   * to the current position.
   */
  private getPosition(content: string): Range {
    const [line, character] = this.getRowsColsCursor();
    const [lineEndPoint, characterEndPoint] = this.getRowsColsCursor(content);
    return {
      start: {
        line,
        character,
      },
      end: {
        line: lineEndPoint,
        character: characterEndPoint,
      }
    };
  }

  /**
 * Returns the rows and columns corresponding to the current position in the text.
 * TODO: fix possible problems
 * @returns {[number, number]} An array containing the row and column.
 */
  private getRowsColsCursor(content?: string): [number, number] {
    const characterPosition = content ? this.currPos + content.length : this.currPos;
    return getRowsAndColsInCursor({text: this.text, characterPosition});
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
