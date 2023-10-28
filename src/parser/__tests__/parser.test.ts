import { expect, test } from "bun:test";
import { Parser } from "../parser";
import { Tokenizer } from "../tokenizer";
import { Expression, Token } from "../../types";

test("Octave/Matlab Parser, should parse a function call", function() {
  const inputCode = "myFunction(\"string value\");";

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedStatement = parser.parseStatement();

  expect(parsedStatement.type).toStrictEqual("FUNCTION_CALL");
  expect(parsedStatement.supressOutput).toStrictEqual(true);
  expect(parsedStatement.LHE.type).toStrictEqual("IDENTIFIER");
  expect(parsedStatement.LHE.value).toStrictEqual("myFunction");
  expect(parsedStatement.LHE.functionData.args[0].content).toStrictEqual("\"string value\"");
});

test("Octave/Matlab Parser, should parse vectors as arguments", function() {
  const inputCode = "a = myFunction([[a,b], [c, d]]);";

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedStatement = parser.parseStatement();

  expect(parsedStatement.type).toStrictEqual("ASSIGNMENT");
  expect(parsedStatement.supressOutput).toStrictEqual(true);
  expect(parsedStatement.LHE.type).toStrictEqual("IDENTIFIER");
  expect(parsedStatement.LHE.value).toStrictEqual("a");
  expect((parsedStatement.RHE as Expression).type).toStrictEqual("FUNCTION_CALL");
  expect((parsedStatement.RHE as Expression).value).toStrictEqual("myFunction");
  expect((parsedStatement.RHE as Expression).functionData.args[0].type).toStrictEqual("VECTOR");
  expect(((parsedStatement.RHE as Expression).functionData.args[0].content as Token[]).map(a => a.type as string)).toStrictEqual(["VECTOR", "VECTOR"]);
});

test("Octave/Matlab Parser, should parse default arguments", function() {
  const inputCode = "myFunction(a = 'lasdkjasldk');";

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedStatement = parser.parseStatement();

  expect(parsedStatement.type).toStrictEqual("FUNCTION_CALL");
  expect(parsedStatement.supressOutput).toStrictEqual(true);
  expect(parsedStatement.LHE.type).toStrictEqual("IDENTIFIER");
  expect(parsedStatement.LHE.value).toStrictEqual("myFunction");
  expect(parsedStatement.LHE.functionData.args[0].type).toStrictEqual("DEFAULT_VALUE_ARGUMENT");
  expect(parsedStatement.LHE.functionData.args[0].content).toStrictEqual("a");
  expect(parsedStatement.LHE.functionData.args[0].defaultValue.content).toStrictEqual("'lasdkjasldk'");
});

test("Octave/Matlab Parser, should parse empty function definition with comments", function() {
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
  expect(parsedStatement.type).toStrictEqual("FUNCTION_DEFINITION");
  expect(parsedStatement.supressOutput).toStrictEqual(true);
  expect(parsedStatement.LHE.type).toStrictEqual("IDENTIFIER");
  expect(parsedStatement.LHE.value).toStrictEqual("myCoolFunction");
  expect(parsedStatement.LHE.functionData.closingToken.type).toStrictEqual("KEYWORD");
  expect(parsedStatement.LHE.functionData.closingToken.content).toStrictEqual("end");
  expect(parsedStatement.LHE.functionData.contextCreated.length > 0).toStrictEqual(true);
});
