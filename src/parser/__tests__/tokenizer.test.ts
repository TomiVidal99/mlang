import { expect, test } from "bun:test";
import { TokenType } from "../../types";
import { Tokenizer } from "../tokenizer";

test("Octave/Matlab Tokenizer, testing Symbols", () => {
  const text = `@:=-+*/1%^.;[]{}(),`;

  const symbols: TokenType[] = [
    "AT", "COLON", "EQUALS", "SUBTRACTION", "ADDITION", "MULTIPLICATION",
    "DIVISION", "NUMBER", "MODULUS", "EXPONENTIATION", "PERIOD",
    "SEMICOLON", "LBRACKET", "RBRACKET", "LSQUIRLY", "RSQUIRLY",
    "LPARENT", "RPARENT", "COMMA", "EOF"
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});

test("Octave/Matlab Tokenizer, testing literals", function() {
  const text = "abcde_10 adbdc 1000 1e-3";

  const symbols: TokenType[] = [
    "IDENTIFIER", "IDENTIFIER", "NUMBER", "NUMBER", "EOF"
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});

test("Octave/Matlab Tokenizer, complete test", function() {
  const text = `
    function [a,b] = my_Function(c,d, e)
      a = c + d + " test string ";
      b = e * 1e-3;
    end
  `;

  const symbols: TokenType[] = [
    "KEYWORD", "LBRACKET", "IDENTIFIER", "COMMA", "IDENTIFIER", "RBRACKET", "EQUALS",
    "IDENTIFIER", "LPARENT", "IDENTIFIER", "COMMA", "IDENTIFIER", "COMMA", "IDENTIFIER", "RPARENT",
    "IDENTIFIER", "EQUALS", "IDENTIFIER", "ADDITION", "IDENTIFIER", "ADDITION", "STRING",
    "SEMICOLON", "IDENTIFIER", "EQUALS", "IDENTIFIER",
    "MULTIPLICATION", "NUMBER", "SEMICOLON", "KEYWORD",
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});

test("Octave/Matlab Tokenizer, detect line comments", function() {
  const text = `
    # this is a comment
    % an this one is another comment
    a = "a text";
  `;

  const symbols: TokenType[] = [
    "COMMENT", "COMMENT", "IDENTIFIER", "EQUALS", "STRING", "SEMICOLON"
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});
