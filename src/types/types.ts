import { Symbols } from ".";

export type TokenType = keyof typeof Symbols | "LITERAL" | "NUMBER" | "ILLEGAL" | "IDENTIFIER" | "STRING" | "KEYWORD";

export type Token = {
  content: string,
  type: TokenType,
}
