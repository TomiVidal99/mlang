import { Symbols } from ".";

export type TokenType = keyof typeof Symbols | "FUNCTION" | "LITERAL" | "NUMBER" | "ILLEGAL" | "EOF";

export type Token = {
  content: string,
  type: TokenType,
}
