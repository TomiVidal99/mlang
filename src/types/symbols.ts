import { type Token, type TokenType } from '.';

/**
 * Represents a set of symbols and their corresponding tokens.
 * @readonly
 * @enum {string}
 */
export const Symbols = {
  NL: '\n',
  EOF: '\0',
  AT: '@',
  COLON: ':',
  COMMA: ',',
  EQUALS: '=',
  SUBTRACTION: '-',
  ADDITION: '+',
  MULTIPLICATION: '*',
  DIVISION: '/',
  MODULUS: '%',
  EXPONENTIATION: '^',
  PERIOD: '.',
  SEMICOLON: ';',
  LBRACKET: '[',
  RBRACKET: ']',
  LSQUIRLY: '{',
  RSQUIRLY: '}',
  LPARENT: '(',
  RPARENT: ')',
} as const;

/**
 * Returns a token corresponding to the given symbol
 * If the given symbol does not exist it returns 'undefined'
 * @returns {Token | undefined} Token symbol | undefined
 */
export function getTokenFromSymbols(char: string): Token | undefined {
  for (const [key, value] of Object.entries(Symbols)) {
    if (value === char) {
      return {
        content: key === 'EOF' ? 'eof' : char,
        type: key as TokenType,
        position: null,
      };
    }
  }

  return undefined;
}
