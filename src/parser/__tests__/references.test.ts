import { expect, test } from 'bun:test';
import { Parser, Tokenizer, Visitor } from '..';

test('Handle references: string, number and vector references', function () {
  const inputCode = `
    stringReference = "STRING";
    numberReference1 = 1000 + 1e3;
    vectorReference = [100:1000];
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  const expectedReferences: string[] = [
    'stringReference',
    'numberReference1',
    'vectorReference',
  ];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(
    expectedReferences,
  );
});

test('Handle references: function definitions refereces', function () {
  const inputCode = `
    % TODO: FIX THIS
    %function noParenFunction
    %end
    function parenFunction()
    end
    function singleOutput = functionSingleOutput()
    end
    function [output1, output2] = functionMO()
    end
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  // console.log("AST: " + JSON.stringify(ast));
  // console.log("REFERENCES: " + JSON.stringify(documentReferences.map(ref => ref.name)));

  // const expectedReferences: string[] = ["noParenFunction"];
  const expectedReferences: string[] = [
    'parenFunction',
    'singleOutput',
    'functionSingleOutput',
    'output1',
    'output2',
    'functionMO',
  ];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(
    expectedReferences,
  );
});

test('Handle references: function call refereces', function () {
  const inputCode = `
    a = functionCall()
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  // const expectedReferences: string[] = ["noParenFunction"];
  const expectedReferences: string[] = ['a', 'functionCall'];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(
    expectedReferences,
  );
});

test('Handle references: just a function call', function () {
  const inputCode = `
    functionCall()
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  // const expectedReferences: string[] = ["noParenFunction"];
  const expectedReferences: string[] = ['functionCall'];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(
    expectedReferences,
  );
});

test('Handle references: just a function call with vector argument', function () {
  const inputCode = `
    functionCall([a,b,c,d])
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  // const expectedReferences: string[] = ["noParenFunction"];
  const expectedReferences: string[] = ['functionCall', 'a', 'b', 'c', 'd'];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(
    expectedReferences,
  );
});

test('Handle references: just a function call with multiple vector arguments', function () {
  const inputCode = `
    functionCall([a,b,c,d], [e, f])
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  // const expectedReferences: string[] = ["noParenFunction"];
  const expectedReferences: string[] = [
    'functionCall',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  ];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(
    expectedReferences,
  );
});

test('Handle references: function call with output and multiple vector arguments', function () {
  const inputCode = `
    returnValue = functionCall([a,b,c,d], [e, f])
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  // const expectedReferences: string[] = ["noParenFunction"];
  const expectedReferences: string[] = [
    'returnValue',
    'functionCall',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  ];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(
    expectedReferences,
  );
});

test('Multiple output function call', function () {
  const inputCode = `

  varDef = varRef;

  [r1,r2, r3] = func([a,b,c], "some text", anotherVar);

  function func1()
    disp("hello");
  end
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const references = visitor.references;

  const expectedReferences: string[] = [
    'varDef',
    'varRef',
    'r1',
    'r2',
    'r3',
    'func',
    'a',
    'b',
    'c',
    'anotherVar',
    'func1',
    'disp',
  ];

  const expectedFunctionReferencesNames: string[] = ['func', 'func1', 'disp'];

  const referencesNamesFound = references.map((ref) => ref.name);

  const functionReferencesNamesFound = references
    .filter((ref) => ref.type === 'FUNCTION')
    .map((ref) => ref.name);

  // console.log('ALL REFS: ' + JSON.stringify(referencesNamesFound));
  // console.log('FUNC REFS: ' + JSON.stringify(functionReferencesNamesFound));

  expect(referencesNamesFound).toEqual(expectedReferences);
  expect(functionReferencesNamesFound).toEqual(expectedFunctionReferencesNames);
});

test('Test particular case', function () {
  const inputCode = `


a = "lkjasldkajs";

a = func1([[a,b,c], [a,c]]);

myVector = [[a30, 20], [20, otherREf]];

b = a30;

[a,b,c] = func([a,b,c], "lkajdsldkasjdl", laksjdlaskdjlas);

a = "lskdjalkdj";
a = 1;
b = 2 + a;
a = 1;

function func1()
  disp("hello");
end
% my foc lkasjdlaskjd
function a = funcTest(b, c)
    % test
    a = 20;

    abcd = "lkdjasldkasjdlk";

    abcd = "ldkasjdlaskdjA;";

end

function [a, b, c] = func2(def = 20, a = "lakdjsalkdja", setting = "lkjasldkjald")
     % DOCUMENTATION

end

a = func2();

b = ["a", "b", "c"];

[a,b,c,d,e] = func2();


func2(def = 20, "lakdjsalkdja", setting = "lkjasldkjald");

function aksjdlaskdja()

end

func1();

func1();

func2(laskdjalsdkja, "lakdjsalkdja", setting = "lkjasldkjald");

func2(laksjdlaskdjal, "lakdjsalkdja", setting = "lkjasldkjald");

funcTest(lkasjdlaskdj, dlkwjlaksjdlaskj);

  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const references = visitor.references;

  const expectedFunctionReferencesNames: string[] = [
    'func1',
    'func',
    'func1',
    'disp',
    'funcTest',
    'func2',
    'func2',
    'func2',
    'func2',
    'aksjdlaskdja',
    'func1',
    'func1',
    'func2',
    'func2',
    'funcTest',
  ];

  const functionReferencesNamesFound = references
    .filter((ref) => ref.type === 'FUNCTION')
    .map((ref) => ref.name);

  // console.log('REF: ' + JSON.stringify(functionReferencesNamesFound));

  expect(functionReferencesNamesFound).toEqual(expectedFunctionReferencesNames);
});
