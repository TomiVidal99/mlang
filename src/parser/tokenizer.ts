import { type Token, getTokenFromSymbols } from '../types';
import {
  getKeywordsFromCompletion,
  getNataiveFunctionsList,
  getRowsAndColsInCursor,
  isLetter,
  isNumber,
} from '../utils';
import { type Range } from 'vscode-languageserver';

const MAX_TOKENS_CALLS = 10000 as const;

export class Tokenizer {
  private text: string;
  private currPos = 0;
  private nextPos = 0;
  private currChar: string;
  private nextChar: string;
  private readonly tokens: Token[] = [];
  private readonly keywords = getKeywordsFromCompletion();
  private readonly nativeFunctions = getNataiveFunctionsList();

  constructor(text = '') {
    this.text = text;
    this.readChar();
  }

  private setInitialConditions(): void {
    this.currPos = 0;
    this.nextPos = 0;
    this.currChar = '';
    this.nextChar = '';
    this.tokens.length = 0;
    this.setRows();
  }

  /**
   * Updates the current text to the provided one.
   */
  public updateText(text: string): void {
    this.text = text;
    this.setInitialConditions();
    this.readChar();
  }

  /**
   * Returns all tokens in the text
   * TODO: maybe update this to use this.tokens??
   */
  public getAllTokens(): Token[] {
    const tokens: Token[] = [];
    let counter = 0;
    do {
      tokens.push(this.getNextToken());
      counter++;
    } while (
      tokens[tokens.length - 1].type !== 'EOF' &&
      counter <= MAX_TOKENS_CALLS
    );

    if (counter >= MAX_TOKENS_CALLS) {
      throw new Error(
        'Tokens calls exeeded. ' +
          JSON.stringify(this.text) +
          ' -> ' +
          JSON.stringify(this.tokens.map((t) => t.type)),
      );
    }

    return tokens;
  }

  /**
   * Gets the next token
   */
  public getNextToken(): Token {
    // ignore spaces and jump lines
    while (this.currChar === ' ') {
      this.readChar();
    }

    const token = getTokenFromSymbols(this.currChar);
    if (token !== undefined && this.isValidStartingToken(token)) {
      this.readChar();
      return this.addToken({
        ...token,
        position: this.getPosition(
          token.type !== 'EOF' ? (token.content as string) : '',
        ),
      });
    }

    if (this.currChar === '#' || this.currChar === '%') {
      const comment = this.readComment();
      return this.addToken({
        type: 'COMMENT',
        content: comment,
        position: this.getPosition(comment),
      });
    } else if (isLetter(this.currChar)) {
      const intialPos = this.currPos;
      const literal = this.readLiteral();
      const postPos = this.currPos;
      this.currPos = intialPos - 1;
      const prevPos = this.getPosition(literal);
      this.currPos = postPos;
      return this.addToken({
        ...this.tokenFromLiteral(literal),
        position: prevPos,
      });
    } else if (isNumber(this.currChar)) {
      const number = this.readNumber();
      return this.addToken({
        type: 'NUMBER',
        content: number,
        position: this.getPosition(number),
      });
    } else if (this.currChar === '"' || this.currChar === "'") {
      const str = this.readLiteralString();
      return this.addToken({
        type: 'STRING',
        content: str,
        position: this.getPosition(str),
      });
    } else {
      this.readChar();
      return this.addToken({
        type: 'ILLEGAL',
        content: 'illegal',
        position: this.getPosition(this.currChar),
      });
    }
  }

  /**
   * Helper that checks that the current character can be a single token
   * i.e: 1 % 2, '%' it's a valid token.
   * but: % this is a comment, '%' it's NOT a valid token.
   */
  private isValidStartingToken(token: Token): boolean {
    if (token.type !== 'MODULUS') return true;
    const lastToken = this.tokens[this.tokens.length - 1];
    return (
      lastToken !== undefined &&
      (lastToken.type === 'IDENTIFIER' || lastToken.type === 'NUMBER')
    );
  }

  /**
   * Helper that reads a comment and returns the content
   */
  private readComment(): string {
    let comment = '';
    do {
      comment += this.currChar;
      this.readChar();
    } while (this.currChar !== '\n' && this.currPos < this.text.length);
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
    if (this.keywords.includes(literal)) {
      return {
        type: 'KEYWORD',
        content: literal,
        position: this.getPosition(literal),
      };
    } else if (this.nativeFunctions.includes(literal)) {
      return {
        type: 'NATIVE_FUNCTION',
        content: literal,
        position: this.getPosition(literal),
      };
    }
    return {
      type: 'IDENTIFIER',
      content: literal,
      position: this.getPosition(literal),
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
      },
    };
  }

  /**
   * Returns the rows and columns corresponding to the current position in the text.
   * TODO: fix possible problems
   * @returns {[number, number]} An array containing the row and column.
   */
  private getRowsColsCursor(content?: string): [number, number] {
    const characterPosition =
      content !== undefined ? this.currPos + content.length : this.currPos;
    return getRowsAndColsInCursor({ text: this.text, characterPosition });
  }

  /**
   * Reads the next character
   */
  private readChar(): void {
    if (this.currPos >= this.text.length || this.text.length <= 3) {
      this.currChar = '\0';
      this.nextChar = '\0';
      return;
    }

    if (this.nextPos === 0) {
      this.currChar = this.text[0];
      this.nextChar = this.text[1];
      this.currPos = 1;
      this.nextPos = 2;
    } else if (this.nextPos >= this.text.length) {
      this.currChar = this.nextChar;
      this.nextChar = '\0';
      this.currPos = this.nextPos;
    } else {
      this.currChar = this.nextChar;
      this.nextChar = this.text[this.nextPos];
      this.currPos = this.nextPos;
      this.nextPos++;
    }
  }

  /**
   * Reads a literal (it's just text, adjacent characters that may contain an underscore '_' or numbers after the first letter)
   * @returns {string} literal
   */
  private readLiteral(): string {
    let literal = '';
    while (
      /[a-zA-Z0-9_]/.test(this.currChar) &&
      this.currPos <= this.text.length
    ) {
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

    while (
      /\d/.test(this.currChar) ||
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
  private readLiteralString(): string {
    let literal = this.currChar;

    do {
      this.readChar();
      literal += this.currChar;
    } while (
      this.currChar !== '"' &&
      this.currChar !== "'" &&
      this.currChar !== '\n' &&
      this.currPos < this.text.length
    );
    this.readChar();

    return literal;
  }
}
