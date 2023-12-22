import { expect, test } from 'bun:test';
import { Parser, Tokenizer, Visitor } from '..';

test('Handle definitions: variable and functions', function () {
  const inputCode = `
    variableDef = "str value";
    function myFunc()
    end
    function retVal = myFuncWithOutput()
    end
    function [mo1, mo2] = funcMO()
    end
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentDefinitions = visitor.definitions.map((def) => def.name);

  const expectedDefinitions: string[] = [
    'variableDef',
    'myFunc',
    'retVal',
    'myFuncWithOutput',
    'mo1',
    'mo2',
    'funcMO',
  ];

  expect(documentDefinitions).toStrictEqual(expectedDefinitions);
});
