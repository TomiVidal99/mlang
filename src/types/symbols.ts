import { Token, TokenType } from ".";

/**
 * Represents a set of symbols and their corresponding tokens.
 * @readonly
 * @enum {string}
 */
export const Symbols = {
  EQUALS: "=",
  SUBTRACTION: "-",
  ADDITION: "+",
  MULTIPLICATION: "*",
  DIVISION: "/",
  MODULUS: "%",
  EXPONENTIATION: "^",
  PERIOD: ".",
  SEMICOLON: ";",
  LBRACKET: "[",
  RBRACKET: "]",
  LSQUIRLY: "{",
  RSQUIRLY: "}",
  LPARENT: "(",
  RPARENT: ")",
} as const;

export function getTokenFromSymbols(char: string): Token | undefined {
  for (const [key, value] of Object.entries(Symbols)) {
    if (value === char) {
      return {
        content: char,
        type: key as TokenType,
      };
    }
  }
}
