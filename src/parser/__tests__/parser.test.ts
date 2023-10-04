import { expect, test } from "bun:test";
import { TokenType } from "../../types";
import { Parser } from "../parser";

test("Test parser, testing getTokens symbols", function() {
  const text = `:=-+*/%^.;[]{}(),`;

  const parser = new Parser(text);
  const tokens = parser.getTextTokens();

  const symbols: TokenType[] = [
    "COLON", "EQUALS", "SUBTRACTION", "ADDITION", "MULTIPLICATION",
    "DIVISION", "MODULUS", "EXPONENTIATION", "PERIOD",
    "SEMICOLON", "LBRACKET", "RBRACKET", "LSQUIRLY", "RSQUIRLY",
    "LPARENT", "RPARENT", "COMMA", "EOF"
  ];

  for (let i = 0; i < symbols.length; i++) {
    const token = tokens[i];
    const symbol = symbols[i];
    expect(token.type).toBe(symbol);
  }

});

test("Test parser, testing getTokens complete text", function() {
  const text = `
    function [a,b] = my_Function(c,d, e)
      a = c + d + " test string ";
      b = e * 1e-3;
    end
  `;

  const parser = new Parser(text);
  const tokens = parser.getTextTokens();

  const symbols: TokenType[] = [
    "KEYWORD", "LBRACKET", "IDENTIFIER", "COMMA", "IDENTIFIER", "RBRACKET", "EQUALS",
    "IDENTIFIER", "LPARENT", "IDENTIFIER", "COMMA", "IDENTIFIER", "COMMA", "IDENTIFIER", "RPARENT",
    "IDENTIFIER", "EQUALS", "IDENTIFIER", "ADDITION", "IDENTIFIER", "ADDITION", "STRING",
    "SEMICOLON", "IDENTIFIER", "EQUALS", "IDENTIFIER",
    "MULTIPLICATION", "NUMBER", "SEMICOLON", "KEYWORD",
  ];

  for (let i = 0; i < symbols.length; i++) {
    const token = tokens[i];
    const symbol = symbols[i];
    expect(token.type).toBe(symbol);
  }

});
