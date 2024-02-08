import { test, expect } from 'bun:test';
import { Visitor } from '../visitor';
import { Parser } from '../parser';
import { Tokenizer } from '../tokenizer';

test('End 2 end test, should get references and definitions of whole file', function () {
  const fileContent = `
a = func1([[a,b,c], [a,c]]);

[a,b,c] = func([a,b,c], "lkajdsldkasjdl", anotherVariable);

a = "lskdjalkdj";
a = 1;
b = 2 + a;
a = 1;

function func1()
  disp("hello");
end

% klajsdlaskdjalkdj
function a = funcTest(b, c)
    % test
    a = 20;

    abcd = "lkdjasldkasjdlk";

    abcd = "ldkasjdlaskdjA;";

end

function [a, b, c] = func2(def = 20, a = "str value", setting = "lkjasldkjald")

end

func2(def2 = 20, "value 1", setting2 = "str 2");

func1();

vectorVariable = ["alskdjasldkj", 'm', 'd'];
`;

  const tokenizer = new Tokenizer(fileContent);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const { references } = visitor;
  const errors = parser.getErrors();

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  const expectedReferences: string[] = [
    'a',
    'func1',
    'a',
    'b',
    'c',
    'a',
    'c',
    'a',
    'b',
    'c',
    'func',
    'a',
    'b',
    'c',
    'anotherVariable',
    'a',
    'a',
    'b',
    'a',
    'a',
    'func1',
    'disp',
    'a',
    'funcTest',
    'b',
    'c',
    'a',
    'abcd',
    'abcd',
    'a',
    'b',
    'c',
    'func2',
    'def',
    'a',
    'setting',
    'func2',
    'def2',
    'setting2',
    'func1',
    'vectorVariable',
  ];
  // const expectedDefinitions: string[] = [];

  // console.log('REFERENCES: ' + JSON.stringify(references));

  expect(errors.map((e) => e?.range !== undefined).some((e) => !e)).toBe(false);
  expect(errors.length === 0).toBe(true);
  expect(references.map((r) => r.name)).toEqual(expectedReferences);
  // expect([]).toEqual(expectedDefinitions);
});
