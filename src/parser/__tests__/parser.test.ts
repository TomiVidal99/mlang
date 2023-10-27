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

test("Octave/Matlab Parser, should parse empty vectors as arguments", function() {
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
