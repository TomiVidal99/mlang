import { expect, test } from "bun:test";
import { Parser } from "../parser";
import { Tokenizer } from "../tokenizer";
import { randomInt } from "crypto";

test("Octave/Matlab Parser, should parse a simple assignment statement", function() {
  const number1 = randomInt(1000);
  const number2 = randomInt(1000);
  const inputCode = `x = ${number1} + ${number2};`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.parseStatement();

  // Define your expected AST structure here based on the input
  const expectedAST =
    {
      type: "ASSIGNMENT",
      operator: "=",
      LHE: {
        type: "IDENTIFIER",
        value: "x"
      },
      RHE: {
        type: "BINARY_OPERATION",
        value: "+",
        LHO: {
          type: "NUMBER",
          value: `${number1}`,
        },
        RHO: {
          type: "NUMBER",
          value: `${number2}`,
        },
      }
    };

  expect(parsedResult).toStrictEqual(expectedAST);
});
