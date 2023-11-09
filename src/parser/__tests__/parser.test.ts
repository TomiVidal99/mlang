import { expect, test } from 'bun:test';
import { Parser } from '../parser';
import { Tokenizer } from '../tokenizer';
import { type Expression, type Token } from '../../types';
import { Visitor } from '../visitor';

test('Octave/Matlab Parser, should parse a function call', function () {
  const inputCode = 'myFunction("string value");';

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedStatement = parser.parseStatement();

  expect(parsedStatement?.type).toStrictEqual('FUNCTION_CALL');
  expect(parsedStatement?.supressOutput).toStrictEqual(true);
  expect(parsedStatement?.LHE?.type).toStrictEqual('IDENTIFIER');
  expect(parsedStatement?.LHE?.value).toStrictEqual('myFunction');
  expect(parsedStatement?.LHE?.functionData?.args[0]?.content).toStrictEqual(
    '"string value"',
  );
});

test('Octave/Matlab Parser, should parse vectors as arguments', function () {
  const inputCode = 'a = myFunction([[a,b], [c, d]]);';

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedStatement = parser.parseStatement();

  expect(parsedStatement.type).toStrictEqual('ASSIGNMENT');
  expect(parsedStatement.supressOutput).toStrictEqual(true);
  expect(parsedStatement.LHE.type).toStrictEqual('IDENTIFIER');
  expect(parsedStatement.LHE.value).toStrictEqual('a');
  expect((parsedStatement.RHE as Expression).type).toStrictEqual(
    'FUNCTION_CALL',
  );
  expect((parsedStatement.RHE as Expression).value).toStrictEqual('myFunction');
  expect(
    (parsedStatement.RHE as Expression).functionData.args[0].type,
  ).toStrictEqual('VECTOR');
  expect(
    (
      (parsedStatement.RHE as Expression).functionData.args[0]
        .content as Token[]
    ).map((a) => a.type as string),
  ).toStrictEqual(['VECTOR', 'VECTOR']);
});

test('Octave/Matlab Parser, should parse default arguments', function () {
  const inputCode = "myFunction(a = 'lasdkjasldk');";

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedStatement = parser.parseStatement();

  expect(parsedStatement.type).toStrictEqual('FUNCTION_CALL');
  expect(parsedStatement.supressOutput).toStrictEqual(true);
  expect(parsedStatement.LHE.type).toStrictEqual('IDENTIFIER');
  expect(parsedStatement.LHE.value).toStrictEqual('myFunction');
  expect(parsedStatement.LHE.functionData.args[0].type).toStrictEqual(
    'DEFAULT_VALUE_ARGUMENT',
  );
  expect(parsedStatement.LHE.functionData.args[0].content).toStrictEqual('a');
  expect(
    parsedStatement.LHE.functionData.args[0].defaultValue.content,
  ).toStrictEqual("'lasdkjasldk'");
});

test('Octave/Matlab Parser, should parse empty function definition with comments', function () {
  const inputCode = `
  function myCoolFunction()
    % this is the first comment
    % this is the second comment

  end
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedStatement = parser.parseStatement();

  const errors = parser.getErrors();

  expect(errors.length).toStrictEqual(0);
  expect(parsedStatement.type).toStrictEqual('FUNCTION_DEFINITION');
  expect(parsedStatement.supressOutput).toStrictEqual(true);
  expect(parsedStatement.LHE.type).toStrictEqual('IDENTIFIER');
  expect(parsedStatement.LHE.value).toStrictEqual('myCoolFunction');
  expect(parsedStatement.LHE.functionData.closingToken.type).toStrictEqual(
    'KEYWORD',
  );
  expect(parsedStatement.LHE.functionData.closingToken.content).toStrictEqual(
    'end',
  );
  expect(
    parsedStatement.LHE.functionData.contextCreated.length > 0,
  ).toStrictEqual(true);
});

test('Octave/Matlab Parser, should parse function definition', function () {
  const inputCode = `
  function myFunc(
    a = 
    20
  )
    b = 50 + a;
  end
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();

  expect(errors.length).toStrictEqual(0);
});

test('Octave/Matlab Parser, should parse structs in ASSIGNMENTs', function () {
  const inputCode = `
    myStruct = {"test", 1}
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log('STATEMENTS: ' + JSON.stringify(program.body));

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(errors.length).toStrictEqual(0);
});

test('Octave/Matlab Parser, should parse structs in arguments', function () {
  const inputCode = `
    myFunction({"test", 1})
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log('STATEMENTS: ' + JSON.stringify(program.body));

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(errors.length).toStrictEqual(0);
});
