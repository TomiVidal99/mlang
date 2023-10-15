import { expect, test } from "bun:test";
import { Parser } from "../parser";
import { Tokenizer } from "../tokenizer";
import { randomInt } from "crypto";
import { Program } from "../../types";

test("Octave/Matlab Parser, should parse a simple assignment statement", function() {
  const number1 = randomInt(1000);
  const number2 = randomInt(1000);
  const inputCode = `x = ((${number1})) + (${number2});`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.parseStatement();

  // Define your expected AST structure here based on the input
  const expectedAST =
  {
    type: "ASSIGNMENT",
    operator: "=",
    supressOutput: true,
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

test("Octave/Matlab Parser, should parse multiple assignment statements", function() {
  const inputCode = `
    a = (1 + 2);
    b = "test string"
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.makeAST();

  // Define your expected AST structure here based on the input
  const expectedAST = {
    type: "Program",
    body: [{
      type: "ASSIGNMENT",
      operator: "=",
      supressOutput: true,
      LHE: {
        type: "IDENTIFIER",
        value: "a"
      },
      RHE: {
        type: "BINARY_OPERATION",
        value: "+",
        LHO: {
          type: "NUMBER",
          value: "1",
        },
        RHO: {
          type: "NUMBER",
          value: "2",
        },
      }
    },
    {
      type: "ASSIGNMENT",
      operator: "=",
      supressOutput: false,
      LHE: {
        type: "IDENTIFIER",
        value: "b"
      },
      RHE: {
        type: "STRING",
        value: '"test string"'
      }
    }]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse a multiple output assignment statement", function() {
  const inputCode = "[a,b] = myFunction(c,d);";

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.makeAST();

  // Define your expected AST structure here based on the input
  const expectedAST: Program = {
    type: "Program",
    body: [{
      type: "MO_ASSIGNMENT",
      operator: "=",
      supressOutput: true,
      LHE: {
        type: "VARIABLE_VECTOR",
        value: ["a", "b"],
      },
      RHE: {
        type: "FUNCTION_CALL",
        value: "myFunction",
        functionData: {
          args: [
            {
              type: "IDENTIFIER",
              content: "c",
            },
            {
              type: "IDENTIFIER",
              content: "d",
            }
          ]
        }
      }
    },]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});
