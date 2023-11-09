import { expect, test } from 'bun:test';
import { type Token, type TokenType } from '../../types';
import { Tokenizer } from '../tokenizer';

test('Octave/Matlab Tokenizer, testing Symbols', () => {
  const text = `@:=\n-+*/1%^.;[]{}(),`;

  const symbols: TokenType[] = [
    'AT',
    'COLON',
    'EQUALS',
    'NL',
    'SUBTRACTION',
    'ADDITION',
    'MULTIPLICATION',
    'DIVISION',
    'NUMBER',
    'MODULUS',
    'EXPONENTIATION',
    'PERIOD',
    'SEMICOLON',
    'LBRACKET',
    'RBRACKET',
    'LSQUIRLY',
    'RSQUIRLY',
    'LPARENT',
    'RPARENT',
    'COMMA',
    'EOF',
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});

test('Octave/Matlab Tokenizer, testing literals', function () {
  const text = 'abcde_10 adbdc 1000 1e-3';

  const symbols: TokenType[] = [
    'IDENTIFIER',
    'IDENTIFIER',
    'NUMBER',
    'NUMBER',
    'EOF',
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});

test('Octave/Matlab Tokenizer, complete test', function () {
  const text = `
    function [a,b] = my_Function(c,d, e)
      a = c + d + " test string ";
      b = e * 1e-3;
    end
  `;

  const symbols: TokenType[] = [
    'NL',
    'KEYWORD',
    'LBRACKET',
    'IDENTIFIER',
    'COMMA',
    'IDENTIFIER',
    'RBRACKET',
    'EQUALS',
    'IDENTIFIER',
    'LPARENT',
    'IDENTIFIER',
    'COMMA',
    'IDENTIFIER',
    'COMMA',
    'IDENTIFIER',
    'RPARENT',
    'NL',
    'IDENTIFIER',
    'EQUALS',
    'IDENTIFIER',
    'ADDITION',
    'IDENTIFIER',
    'ADDITION',
    'STRING',
    'SEMICOLON',
    'NL',
    'IDENTIFIER',
    'EQUALS',
    'IDENTIFIER',
    'MULTIPLICATION',
    'NUMBER',
    'SEMICOLON',
    'NL',
    'KEYWORD',
    'NL',
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});

test('Octave/Matlab Tokenizer, detect line comments', function () {
  const text = `
    # this is a comment
    % an this one is another comment
    a = "a text";
  `;

  const symbols: TokenType[] = [
    'NL',
    'COMMENT',
    'NL',
    'COMMENT',
    'NL',
    'IDENTIFIER',
    'EQUALS',
    'STRING',
    'SEMICOLON',
    'NL',
  ];

  const tokenizer = new Tokenizer(text);

  for (const symbol of symbols) {
    const token = tokenizer.getNextToken();
    expect(token.type).toBe(symbol);
  }
});

test('Octave/Matlab Tokenizer, test position', function () {
  const text = `
    # this is a comment
  `;

  const tokens: Token[] = [
    {
      type: 'NL',
      content: '\n',
      position: {
        start: {
          line: 1,
          character: 1,
        },
        end: {
          line: 1,
          character: 2,
        },
      },
    },
    {
      type: 'COMMENT',
      content: '# this is a comment',
      position: {
        start: {
          line: 1,
          character: 4,
        },
        end: {
          line: 1,
          character: 22,
        },
      },
    },
    {
      type: 'NL',
      content: '\n',
      position: {
        start: {
          line: 1,
          character: 4,
        },
        end: {
          line: 1,
          character: 22,
        },
      },
    },
  ];

  const tokenizer = new Tokenizer(text);

  for (const tok of tokens) {
    const token = tokenizer.getNextToken();
    expect(token).toStrictEqual(tok);
  }
});
