import { expect, test } from "bun:test";
import { TokenType } from "../../types";
import { Tokenizer } from "../tokenizer";

test("Test tokenizer, testing Symbols", () => {
  const text = "=-+*/%^.;[]{}()";

  const symbols: TokenType[] = [
    "EQUALS", "SUBTRACTION", "ADDITION", "MULTIPLICATION",
    "DIVISION", "MODULUS", "EXPONENTIATION", "PERIOD",
    "SEMICOLON", "LBRACKET", "RBRACKET", "LSQUIRLY", "RSQUIRLY",
    "LPARENT", "RPARENT", "EOF"
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});

test("Test tokenizer, testing literals", () => {
  const text = "abcde_10 1000 1e-3";

  const symbols: TokenType[] = [
    "LITERAL", "NUMBER", "NUMBER", "EOF"
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});
