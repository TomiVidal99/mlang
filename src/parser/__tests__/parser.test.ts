import { expect, test } from "bun:test";
import { Parser } from "../parser";
import { Tokenizer } from "../tokenizer";

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
