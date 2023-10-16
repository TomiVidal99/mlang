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

test("Octave/Matlab Parser, should parse a single function call with output", function() {
  const inputCode = `
    a = myFunction(a, b, c);
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.makeAST();

  // Define your expected AST structure here based on the input
  const expectedAST: Program = {
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
        type: "FUNCTION_CALL",
        value: "myFunction",
        functionData: {
          args: [
            {
              type: "IDENTIFIER",
              content: "a",
            },
            {
              type: "IDENTIFIER",
              content: "b",
            },
            {
              type: "IDENTIFIER",
              content: "c",
            }
          ]
        }
      }
    },
    ]
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


test("Octave/Matlab Parser, should parse  MO_ASSIGNMENT and two ASSIGNMENTs", function() {
  const inputCode = `
    [a,b] = myFunction(c,d)
    myOtherVariable = "Test"
    testVar = a + 1e3;
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.makeAST();

  // Define your expected AST structure here based on the input
  const expectedAST: Program = {
    type: "Program",
    body: [
      {
        type: "MO_ASSIGNMENT",
        operator: "=",
        supressOutput: false,
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
      },
      {
        type: "ASSIGNMENT",
        operator: "=",
        supressOutput: false,
        LHE: {
          type: "IDENTIFIER",
          value: "myOtherVariable",
        },
        RHE: {
          type: "STRING",
          value: "\"Test\"",
        }
      },
      {
        type: "ASSIGNMENT",
        operator: "=",
        supressOutput: true,
        LHE: {
          type: "IDENTIFIER",
          value: "testVar",
        },
        RHE: {
          type: "BINARY_OPERATION",
          value: "+",
          LHO: {
            type: "IDENTIFIER",
            value: "a",
          },
          RHO: {
            type: "NUMBER",
            value: "1e3",
          },
        }
      },
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse a function definition", function() {
  const inputCode = `
    function(c,d)
      a = 1;
    end
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.makeAST();

  // Define your expected AST structure here based on the input
  const expectedAST: Program = {
    type: "Program",
    body: [
      {
        type: "FUNCTION_DEFINITION",
        supressOutput: true,
        LHE: {
          type: "KEYWORD",
          value: "function",
          functionData: {
            args: [
              {
                type: "IDENTIFIER",
                content: "c",
              },
              {
                type: "IDENTIFIER",
                content: "d",
              },
            ]
          }
        },
        RHE: [
          {
            type: "ASSIGNMENT",
            operator: "=",
            supressOutput: true,
            LHE: {
              type: "IDENTIFIER",
              value: "a",
            },
            RHE: {
              type: "NUMBER",
              value: "1",
            }
          },
        ]
      },
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse a function definition with multiple statements inside", function() {
  const inputCode = `
    function(c,d)
      a = 1;
      someothervariable = "Test"
      result = 10050.2 + 0.1 - 1e-3;
    end
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.makeAST();

  // Define your expected AST structure here based on the input
  const expectedAST: Program = {
    type: "Program",
    body: [
      {
        type: "FUNCTION_DEFINITION",
        supressOutput: true,
        LHE: {
          type: "KEYWORD",
          value: "function",
          functionData: {
            args: [
              {
                type: "IDENTIFIER",
                content: "c",
              },
              {
                type: "IDENTIFIER",
                content: "d",
              },
            ]
          }
        },
        RHE: [
          {
            type: "ASSIGNMENT",
            operator: "=",
            supressOutput: true,
            LHE: {
              type: "IDENTIFIER",
              value: "a",
            },
            RHE: {
              type: "NUMBER",
              value: "1",
            }
          },
          {
            type: "ASSIGNMENT",
            operator: "=",
            supressOutput: false,
            LHE: {
              type: "IDENTIFIER",
              value: "someothervariable",
            },
            RHE: {
              type: "STRING",
              value: "\"Test\"",
            }
          },
          {
            type: "ASSIGNMENT",
            operator: "=",
            supressOutput: true,
            LHE: {
              type: "IDENTIFIER",
              value: "result",
            },
            RHE: {
              type: "BINARY_OPERATION",
              value: "+",
              LHO: {
                type: "NUMBER",
                value: "10050.2",
              },
              RHO: {
                type: "BINARY_OPERATION",
                value: "-",
                LHO: {
                  type: "NUMBER",
                  value: "0.1",
                },
                RHO: {
                  type: "NUMBER",
                  value: "1e-3",
                }
              }
            }
          },
        ]
      },
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse an anonymous function definition", function() {
  const inputCode = `
    a = @(b,c) b + c + 100;
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.makeAST();

  // Define your expected AST structure here based on the input
  const expectedAST: Program = {
    type: "Program",
    body: [
      {
        type: "ASSIGNMENT",
        supressOutput: true,
        operator: "=",
        LHE: {
          type: "IDENTIFIER",
          value: "a",
        },
        RHE: {
          type: "ANONYMOUS_FUNCTION_DEFINITION",
          value: "@",
          functionData: {
            args: [
              {
                type: "IDENTIFIER",
                content: "b",
              },
              {
                type: "IDENTIFIER",
                content: "c",
              },
            ]
          },
          RHO: {
            type: "BINARY_OPERATION",
            value: "+",
            RHO: {
              type: "BINARY_OPERATION",
              value: "+",
              RHO: {
                type: "NUMBER",
                value: "100"
              },
              LHO: {
                type: "IDENTIFIER",
                value: "c"
              }
            },
            LHO: {
              type: "IDENTIFIER",
              value: `b`,
            },
          },
        }
      },
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse an anonymous function definition ignoring a comment", function() {
  const inputCode = `
    # this a comment before the function
    a = @(b,c) b + c + 100; # this a comment in the same line
`;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const parsedResult = parser.makeAST();

  // Define your expected AST structure here based on the input
  const expectedAST: Program = {
    type: "Program",
    body: [
      {
        type: "ASSIGNMENT",
        supressOutput: true,
        operator: "=",
        LHE: {
          type: "IDENTIFIER",
          value: "a",
        },
        RHE: {
          type: "ANONYMOUS_FUNCTION_DEFINITION",
          value: "@",
          functionData: {
            args: [
              {
                type: "IDENTIFIER",
                content: "b",
              },
              {
                type: "IDENTIFIER",
                content: "c",
              },
            ]
          },
          RHO: {
            type: "BINARY_OPERATION",
            value: "+",
            RHO: {
              type: "BINARY_OPERATION",
              value: "+",
              RHO: {
                type: "NUMBER",
                value: "100"
              },
              LHO: {
                type: "IDENTIFIER",
                value: "c"
              }
            },
            LHO: {
              type: "IDENTIFIER",
              value: `b`,
            },
          },
        }
      },
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});
