import { expect, test } from 'bun:test';
import { Parser } from '../parser';
import { Tokenizer } from '../tokenizer';
import { Visitor } from '../visitor';
import { type StatementType, type Expression, type Token } from '../../types';

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

  console.log('STATEMENT: ' + JSON.stringify(parsedStatement));

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
  expect(parsedStatement?.type).toStrictEqual('FUNCTION_DEFINITION');
  expect(parsedStatement?.supressOutput).toStrictEqual(true);
  expect(parsedStatement?.LHE?.type).toStrictEqual('IDENTIFIER');
  expect(parsedStatement?.LHE?.value).toStrictEqual('myCoolFunction');
  expect(parsedStatement?.LHE?.functionData?.closingToken?.type).toStrictEqual(
    'KEYWORD',
  );
  expect(
    parsedStatement?.LHE?.functionData?.closingToken?.content,
  ).toStrictEqual('end');
  expect(
    parsedStatement?.LHE?.functionData?.contextCreated?.length > 0,
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

test('Octave/Matlab Parser, should parse cell arrays in ASSIGNMENTs', function () {
  const inputCode = `
    myCellArray = {"test", 1}
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

test('Octave/Matlab Parser, should parse cell arrays in arguments', function () {
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

test('Octave/Matlab Parser, should parse basic statements', function () {
  const inputCode = `
    if (myCondition)
      a = 1;
    end
    if ()
    endif
    for i=1:20
      b = 1;
    end
    for ()
    endfor
    while (1)
      disp("hello");
    end
    while ()
    endwhile
    switch ()
    end
    switch ()
    endswitch
    do ()
    until
    do ()
    until
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();
  const STATEMENTS: StatementType[] = [
    'IF_STMNT',
    'IF_STMNT',
    'FOR_STMNT',
    'FOR_STMNT',
    'WHILE_STMNT',
    'WHILE_STMNT',
    'SWITCH_STMNT',
    'SWITCH_STMNT',
    'DO_STMNT',
    'DO_STMNT',
  ];

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log(
  //   'STATEMENTS: ' + JSON.stringify(program.body.map((stmn) => stmn.type)),
  // );

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(program.body.map((stmn) => stmn.type)).toEqual(STATEMENTS);
  expect(errors.length).toStrictEqual(0);
});

test('Octave/Matlab Parser, test function call w/o parenthesis', function () {
  const inputCode = `
    myFunc a 1.2 "myString" ["vectorVal", a, b, 20]
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();
  const STATEMENTS: StatementType[] = ['FUNCTION_CALL'];

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log('STATEMENTS: ' + JSON.stringify(program.body));

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(program.body.map((stmn) => stmn.type)).toEqual(STATEMENTS);
  expect(errors.length).toStrictEqual(0);
});

test('Octave/Matlab Parser, if else elseif statement', function () {
  const inputCode = `
  if ()
    myVar = 1;
  elseif ()
    myVar = 20;
  else 
    myVar = 100;
  end
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();
  const STATEMENTS: StatementType[] = ['IF_STMNT'];

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log('STATEMENTS: ' + JSON.stringify(program.body));

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(program.body.map((stmn) => stmn.type)).toEqual(STATEMENTS);
  expect(errors.length).toStrictEqual(0);
});

test('Octave/Matlab Parser, function calls with cell array', function () {
  const inputCode = `
  mySuperCoolFunc({});
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();
  const STATEMENTS: StatementType[] = ['FUNCTION_CALL'];

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log('STATEMENTS: ' + JSON.stringify(program.body));

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(program.body.map((stmn) => stmn.type)).toEqual(STATEMENTS);
  expect(errors.length).toStrictEqual(0);
});

test('Octave/Matlab Parser, structs access', function () {
  const inputCode = `
    a.c = 20;
    a.c = func(a.b);
    a.b.c(a.c);
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();
  const STATEMENTS: StatementType[] = [
    'ASSIGNMENT',
    'ASSIGNMENT',
    'FUNCTION_CALL',
  ];

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log('STATEMENTS: ' + JSON.stringify(program.body));

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(program.body.map((stmn) => stmn.type)).toEqual(STATEMENTS);
  expect(errors.length).toStrictEqual(0);
});

test('Octave/Matlab Parser, FUNCTION_CALL with STRUCT_ACCESS and IDENTIFIER_REFERENCE', function () {
  const inputCode = `
    a.b.c("test", @myFunc);
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();
  const STATEMENTS: StatementType[] = ['FUNCTION_CALL'];

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log('STATEMENTS: ' + JSON.stringify(program.body));

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(program.body.map((stmn) => stmn.type)).toEqual(STATEMENTS);
  expect(errors.length).toStrictEqual(0);
});

test('Octave/Matlab Parser, cell array access in assignment', function () {
  const inputCode = `
    a = b{1};
    c = b{"a"};
    c = b{:};
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);

  const errors = parser.getErrors();
  const STATEMENTS: StatementType[] = [
    'ASSIGNMENT',
    'ASSIGNMENT',
    'ASSIGNMENT',
  ];

  // console.log('TOKENS: ' + JSON.stringify(tokens));
  // console.log('STATEMENTS: ' + JSON.stringify(program.body));

  if (errors.length > 0) {
    console.log('ERRORS: ' + JSON.stringify(errors));
  }

  expect(program.body.map((stmn) => stmn.type)).toEqual(STATEMENTS);
  expect(errors.length).toStrictEqual(0);
});
