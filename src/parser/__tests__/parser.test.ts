import { expect, test } from "bun:test";
import { TokenType } from "../../types";
import { Parser } from "../parser";
import { Tokenizer } from "../tokenizer";

test("Octave/Matlab Parser, should parse a simple assignment statement", function() {
  const inputCode = 'x = 10 + 5;';

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
        RHO: {
          type: "NUMBER",
          value: "5"
        },
        LHO: {
          type: "NUMBER",
          value: "10"
        }
      }
    };

  expect(parsedResult).toStrictEqual(expectedAST);
});
