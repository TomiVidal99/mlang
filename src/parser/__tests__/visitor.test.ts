import { expect, test } from 'bun:test';
import { Tokenizer } from '../tokenizer';
import { Parser } from '../parser';
import { Visitor } from '../visitor';

test('Octave/Matlab Visitor, test references extraction', () => {
  const text = `
    a = "string";
    b =     1
    c = a - b + 10000;
    function test = myVar(m,d)
      w = a + 1;
    end
    w = @(a,b) b + 1 + a;
    function [va1, va2] = MO_FUNC(arg1, arg2)
    end
  `;
  // TODO: add other types of function definitions

  const references: string[] = [
    'a',
    'b',
    'c',
    'a',
    'b',
    'test',
    'myVar',
    'm',
    'd',
    'w',
    'a',
    'w',
    'a',
    'b',
    'b',
    'a',
    'va1',
    'va2',
    'MO_FUNC',
    'arg1',
    'arg2',
  ];

  const tokenizer = new Tokenizer(text);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);
  const calculatedReferences = visitor.references;

  const calculatedReferenceNames = calculatedReferences.map((ref) => ref.name);

  expect(calculatedReferenceNames).toStrictEqual(references);
});

test('Octave/Matlab Visitor, test references extraction', () => {
  const text = `
    myNestedVector = [[a,b,c], ["str1", "str2", otherReference]];
  `;

  const references: string[] = [
    'myNestedVector',
    'a',
    'b',
    'c',
    'otherReference',
  ];

  const tokenizer = new Tokenizer(text);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);
  const calculatedReferences = visitor.references;

  const calculatedReferenceNames = calculatedReferences.map((ref) => ref.name);

  expect(calculatedReferenceNames).toStrictEqual(references);
});

test('Octave/Matlab Visitor, should get documentation of function definitions', () => {
  const text = `
    a = "aklsjdlakdj"
    % doc before func def
    function myFunctionDefBefore()
      b = 10 + c;
    end

    variable2 = 1e3

    function myFunctionDefAfter()

          % doc after func def

    end
  `;

  const tokenizer = new Tokenizer(text);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);
  const { definitions } = visitor;

  // console.log('GOT: ' + JSON.stringify(definitions));
  // console.log('TOKENS: ' + JSON.stringify(tokens.map((t) => t.type)));

  for (const def of definitions) {
    switch (def.name) {
      case 'myFunctionDefBefore':
        expect(def.documentation !== '').toBe(true);
        break;
      case 'myFunctionDefAfter':
        expect(def.documentation !== '').toBe(true);
        break;
    }
  }
});

test('Octave/Matlab Visitor, should get var definitions from for statements', () => {
  const text = `
    for (a = 10:20)
      doSomethingWith(a);
    end
    for b = 10:20
      doSomethingWith(b);
    end
  `;

  const tokenizer = new Tokenizer(text);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);
  const { definitions } = visitor;

  // console.log('STATEMENTS: ' + JSON.stringify(program.body));
  // console.log('GOT: ' + JSON.stringify(definitions));
  // console.log('TOKENS: ' + JSON.stringify(tokens.map((t) => t.type)));

  expect(definitions[0].name).toBe('a');
  expect(definitions[1].name).toBe('b');
});
