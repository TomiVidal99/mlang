import { Tokens } from "../parser/Tokens";

type TokenType = keyof typeof Tokens;

type Token = {
  content: "",
  type: TokenType,
}
