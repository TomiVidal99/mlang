import { CERO_POSITION } from '../constants';
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
  }

  /**
   * It's called after all the tokenizing process has been done
   * It creates some more complex tokens like STRUCT_ACCESS
   */
  private postTokenizationHook(): void {
    this.makeStructAccess();
    this.makeCellArrayAccess();
    this.makeIdentifierReferences();
  }

  /**
   * Makes the more complex token of the CELL_ARRAY_ACCESS
   * example: myCellArray{2} -> IDENTIFIER, 'LSQUIRLY', n amount of basic types
   * comma separated or : (myCellArray{:})
   * TODO: refactor and improve MAX_CALLS1 and MAX_CALLS2
   */
  private makeCellArrayAccess(): void {
    return;
    const newList: Token[] = [];
    let MAX_CALLS1 = 0;
    let MAX_CALLS2 = 0;
    let i = 0;

    while (i < this.tokens.length && MAX_CALLS1 < MAX_TOKENS_CALLS) {
      if (this.isCellArrayAccessAt(i)) {
        const cellArrayAccess = this.extractNestedCellArrayAccessNode(i + 2);
      } else {
        newList.push(this.tokens[i]);
        i++;
        continue;
      }
    }

    console.log('tok: ' + JSON.stringify(newList.map((t) => t.type)));

    // return;

    if (MAX_CALLS1 >= MAX_TOKENS_CALLS) {
      console.log('ERROR 1');
      return;
    }

    if (MAX_CALLS2 >= MAX_TOKENS_CALLS) {
      console.log('ERROR 1');
      return;
    }

    this.tokens.length = 0;
    this.tokens.push(...newList);
  }

  /**
   * Checks weather there is or not an array access at the given position
   */
  private isCellArrayAccessAt(i: number) {
    return (
      i < this.tokens.length - 2 &&
      (this.tokens[i].type === 'IDENTIFIER' ||
        this.tokens[i].type === 'STRUCT_ACCESS' ||
        this.tokens[i].type === 'CELL_ARRAY_ACCESS') &&
      this.tokens[i + 1].type === 'LSQUIRLY'
    );
  }

  /**
   * Checks weather the given Token it's of type:
   * 'NUMBER' | 'IDENTIFIER' | 'STRUCT_ACCESS' | 'CELL_ARRAY_ACCESS'
   * TODO: is there any other type that can access an struct access??? (idk)
   */
  private isBasicTokenData(token: Token): boolean {
    return (
      token.type === 'NUMBER' ||
      token.type === 'STRING' ||
      token.type === 'IDENTIFIER' ||
      token.type === 'STRUCT_ACCESS' ||
      token.type === 'CELL_ARRAY_ACCESS'
    );
  }

  /**
   * Makes the more complex tokens IDENTIFIER_REFERENCEs
   */
  private makeIdentifierReferences(): void {
    const newList: Token[] = [];
    let i = 0;
    while (i < this.tokens.length) {
      if (
        i < this.tokens.length - 1 &&
        this.tokens[i].type === 'AT' &&
        this.tokens[i + 1].type === 'IDENTIFIER'
      ) {
        newList.push({
          type: 'IDENTIFIER_REFERENCE',
          position: {
            start: this.tokens[i].position?.start ?? CERO_POSITION.start,
            end: this.tokens[i + 1].position?.end ?? CERO_POSITION.end,
          },
          content: [this.tokens[i], this.tokens[i + 1]],
        });
        i = i + 2;
      } else {
        newList.push(this.tokens[i]);
        i++;
      }
    }

    this.tokens.length = 0;
    this.tokens.push(...newList);
  }

  /**
   * Makes STRUCT_ACCESS out of more basic tokens in the tokens list
   */
  private makeStructAccess(): void {
    const newList: Token[] = [];
    let i = 0;
    while (i < this.tokens.length) {
      if (
        i < this.tokens.length - 3 &&
        this.tokens[i].type === 'IDENTIFIER' &&
        this.tokens[i + 1].type === 'PERIOD' &&
        this.tokens[i + 2].type === 'IDENTIFIER'
      ) {
        let lastTokenIndex = i + 2;
        const content = [
          this.tokens[i],
          this.tokens[i + 1],
          this.tokens[i + 2],
        ];
        while (
          lastTokenIndex < this.tokens.length - 3 &&
          this.tokens[lastTokenIndex + 1].type === 'PERIOD' &&
          this.tokens[lastTokenIndex + 2].type === 'IDENTIFIER'
        ) {
          lastTokenIndex = lastTokenIndex + 2;
        }
        const structAccess: Token = {
          type: 'STRUCT_ACCESS',
          content,
          position: {
            start: this.tokens[i].position?.start ?? CERO_POSITION.start,
            end: content[content.length - 1].position?.end ?? CERO_POSITION.end,
          },
        };
        newList.push(structAccess);
        i = lastTokenIndex + 1;
      } else {
        newList.push(this.tokens[i]);
        i++;
      }
    }
    this.tokens.length = 0;
    this.tokens.push(...newList);
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
    // const tokens: Token[] = [];
    let counter = 0;
    let currentToken: Token = this.getNextToken();
    while (currentToken.type !== 'EOF' && counter <= MAX_TOKENS_CALLS) {
      currentToken = this.getNextToken();
      counter++;
    }

    if (counter >= MAX_TOKENS_CALLS) {
      throw new Error(
        'Tokens calls exeeded. ' +
          JSON.stringify(this.text) +
          ' -> ' +
          JSON.stringify(this.tokens.map((t) => t.type)),
      );
    }

    this.postTokenizationHook();

    return this.tokens;
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
        position: this.getPositionAfterCursor(
          token.type !== 'EOF' ? (token.content as string) : '',
        ),
      });
    }

    if (this.currChar === '#' || this.currChar === '%') {
      const codeBreakToken = this.isCodeBreak();
      if (codeBreakToken !== undefined) return this.addToken(codeBreakToken);
      const comment = this.readComment();
      return this.addToken({
        type: 'COMMENT',
        content: comment,
        position: this.getPositionAfterCursor(comment),
      });
    } else if (isLetter(this.currChar)) {
      // const initialPos = this.currPos;
      const literal = this.readLiteral();
      // const postPos = this.currPos;
      // this.currPos = initialPos - 1;
      // const prevPos = this.getPosition(literal);
      // this.currPos = postPos;
      return this.addToken({
        ...this.tokenFromLiteral(literal),
        position: this.getPositionAfterCursor(literal),
      });
    } else if (isNumber(this.currChar)) {
      const number = this.readNumber();
      return this.addToken({
        type: 'NUMBER',
        content: number,
        position: this.getPositionAfterCursor(number),
      });
    } else if (this.currChar === '"' || this.currChar === "'") {
      const str = this.readLiteralString();
      return this.addToken({
        type: 'STRING',
        content: str,
        position: this.getPositionAfterCursor(str),
      });
    } else {
      this.readChar();
      return this.addToken({
        type: 'ILLEGAL',
        content: 'illegal',
        position: this.getPositionAfterCursor(this.currChar),
      });
    }
  }

  /**
   * Helper that checks weather the current token and the next one
   * correspods to a code break type. (## or %%)
   * TODO: ## only works for octave.
   */
  private isCodeBreak(): Token | undefined {
    const codeBreak = `${this.currChar}${this.nextChar}`;
    if (codeBreak === '##' || codeBreak === '%%') {
      const content = this.readComment();
      return {
        type: 'CODE_BREAK',
        content,
        position: this.getPositionAfterCursor(content),
      };
    }
  }

  /**
   * Returns the Range of a character in the text
   * considering that it starts after the token content has been read
   */
  private getPositionAfterCursor(content: string): Range {
    const initialPosition = this.currPos - content.length;
    const finalPosition = this.currPos;
    this.currPos = initialPosition;
    const [line, character] = this.getRowsColsCursor();
    const [lineEndPoint, characterEndPoint] = this.getRowsColsCursor(content);
    const range: Range = {
      start: {
        line,
        character,
      },
      end: {
        line: lineEndPoint,
        character: characterEndPoint,
      },
    };
    this.currPos = finalPosition;
    return range;
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
   * @returns {[number, number]} An array containing the row and column [[ROW, COL]].
   */
  private getRowsColsCursor(content: string | null = null): [number, number] {
    const characterPosition =
      content !== null ? this.currPos + content.length + 1 : this.currPos;
    return getRowsAndColsInCursor({
      text: this.text,
      characterPosition,
    });
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
