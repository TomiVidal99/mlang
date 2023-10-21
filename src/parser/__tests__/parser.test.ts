import { expect, test } from "bun:test";
import { Parser } from "../parser";
import { Tokenizer } from "../tokenizer";
import { randomInt } from "crypto";
import { Program } from "../../types";
import { getRowsAndColsInCursor } from "../../utils";

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
        position: {
          start: {
            line: 2,
            character: 9,
          },
          end: {
            line: 2,
            character: 19,
          }
        },
        functionData: {
          args: [
            {
              type: "IDENTIFIER",
              content: "a",
              position: {
                start: {
                  line: 2,
                  character: 20,
                },
                end: {
                  line: 2,
                  character: 21,
                }
              }
            },
            {
              type: "IDENTIFIER",
              content: "b",
              position: {
                start: {
                  line: 2,
                  character: 23,
                },
                end: {
                  line: 2,
                  character: 24,
                }
              }
            },
            {
              type: "IDENTIFIER",
              content: "c",
              position: {
                start: {
                  line: 2,
                  character: 26,
                },
                end: {
                  line: 2,
                  character: 27,
                }
              }
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
              position: {
                start: {
                  line: 1,
                  character: 20,
                },
                end: {
                  line: 1,
                  character: 21,
                }
              }
            },
            {
              type: "IDENTIFIER",
              content: "d",
              position: {
                start: {
                  line: 1,
                  character: 22
                },
                end: {
                  line: 1,
                  character: 23,
                }
              }
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
                position: {
                  start: {
                    line: 2,
                    character: 24,
                  },
                  end: {
                    line: 2,
                    character: 25,
                  }
                }
              },
              {
                type: "IDENTIFIER",
                content: "d",
                position: {
                  start: {
                    line: 2,
                    character: 26,
                  },
                  end: {
                    line: 2,
                    character: 27,
                  }
                }
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
            position: {
              start: {
                line: 4,
                character: 15,
              },
              end: {
                line: 4,
                character: 16,
              }
            }
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
    function myFunction(c,d)
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
          type: "IDENTIFIER",
          value: "myFunction",
          functionData: {
            description: "",
            args: [
              {
                type: "IDENTIFIER",
                content: "c",
                position: {
                  start: {
                    line: 2,
                    character: 25,
                  },
                  end: {
                    line: 2,
                    character: 26,
                  }
                }
              },
              {
                type: "IDENTIFIER",
                content: "d",
                position: {
                  start: {
                    line: 2,
                    character: 27,
                  },
                  end: {
                    line: 2,
                    character: 28,
                  }
                }
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

test("Octave/Matlab Parser, should parse a function definition with multiple statements nside and comment before", function() {
  const inputCode = `
    % this is a comment 1
    % this is a comment 2
    function myFunction(c,d)
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
          type: "IDENTIFIER",
          value: "myFunction",
          functionData: {
            description: "% this is a comment 1\n% this is a comment 2",
            args: [
              {
                type: "IDENTIFIER",
                content: "c",
                position: {
                  start: {
                    line: 4,
                    character: 25,
                  },
                  end: {
                    line: 4,
                    character: 26,
                  }
                }
              },
              {
                type: "IDENTIFIER",
                content: "d",
                position: {
                  start: {
                    line: 4,
                    character: 27,
                  },
                  end: {
                    line: 4,
                    character: 28,
                  }
                }
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
test("Octave/Matlab Parser, should parse a function definition with multiple statements inside and comment after", function() {
  const inputCode = `
    function myFunction(c,d)
      % this is a comment 1
      % this is a comment 2
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
          type: "IDENTIFIER",
          value: "myFunction",
          functionData: {
            description: "% this is a comment 1\n% this is a comment 2",
            args: [
              {
                type: "IDENTIFIER",
                content: "c",
                position: {
                  start: {
                    line: 2,
                    character: 25,
                  },
                  end: {
                    line: 2,
                    character: 26,
                  }
                },
              },
              {
                type: "IDENTIFIER",
                content: "d",
                position: {
                  start: {
                    line: 2,
                    character: 27,
                  },
                  end: {
                    line: 2,
                    character: 28,
                  }
                }
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

test("Octave/Matlab Parser, should parse a function definition with a single output", function() {
  const inputCode = `
    function result = myFunction(c,d)
      % this is a comment 1
      % this is a comment 2
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
        type: "ASSIGNMENT",
        supressOutput: true,
        LHE: {
          type: "IDENTIFIER",
          value: "result",
        },
        RHE: {
          type: "FUNCTION_DEFINITION",
          value: "function",
          LHO: {
            type: "IDENTIFIER",
            value: "myFunction",
            functionData: {
              args: [
                {
                  type: "IDENTIFIER",
                  content: "c",
                  position: {
                    start: {
                      line: 2,
                      character: 34,
                    },
                    end: {
                      line: 2,
                      character: 35,
                    },
                  }
                },
                {
                  type: "IDENTIFIER",
                  content: "d",
                  position: {
                    start: {
                      line: 2,
                      character: 36,
                    },
                    end: {
                      line: 2,
                      character: 37,
                    },
                  }

                }
              ],
              description: "% this is a comment 1\n% this is a comment 2"
            }
          },
          RHO: [
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
      },
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse a function definition with multiple outputs", function() {
  const inputCode = `
    function [a,b,c] = myFunction(c,d)
      % this is a comment 1
      % this is a comment 2
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
        type: "ASSIGNMENT",
        supressOutput: true,
        LHE: {
          type: "VARIABLE_VECTOR",
          value: ["a", "b", "c"],
        },
        RHE: {
          type: "FUNCTION_DEFINITION",
          value: "function",
          LHO: {
            type: "IDENTIFIER",
            value: "myFunction",
            functionData: {
              args: [
                {
                  type: "IDENTIFIER",
                  content: "c",
                  position: {
                    start: {
                      line: 2,
                      character: 35,
                    },
                    end: {
                      line: 2,
                      character: 36,
                    }
                  }
                },
                {
                  type: "IDENTIFIER",
                  content: "d",
                  position: {
                    start: {
                      line: 2,
                      character: 37,
                    },
                    end: {
                      line: 2,
                      character: 38,
                    }
                  }
                }
              ],
              description: "% this is a comment 1\n% this is a comment 2"
            }
          },
          RHO: [
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
      },
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse an anonymous function definition", function() {

  const inputCode = "a = @(b,c) b + c + 100;";

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
                position: {
                  start: {
                    line: 1,
                    character: 7,
                  },
                  end: {
                    line: 1,
                    character: 8,
                  }
                }
              },
              {
                type: "IDENTIFIER",
                content: "c",
                position: {
                  start: {
                    line: 1,
                    character: 9,
                  },
                  end: {
                    line: 1,
                    character: 10,
                  }
                }
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
                value: "100",
              },
              LHO: {
                type: "IDENTIFIER",
                value: "c",
                position: {
                  start: {
                    line: 1,
                    character: 16,
                  },
                  end: {
                    line: 1,
                    character: 17,
                  }
                }
              }
            },
            LHO: {
              type: "IDENTIFIER",
              value: `b`,
              position: {
                start: {
                  line: 1,
                  character: 12,
                },
                end: {
                  line: 1,
                  character: 13,
                }
              }
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
                position: {
                  start: {
                    line: 3,
                    character: 11,
                  },
                  end: {
                    line: 3,
                    character: 12,
                  }
                }
              },
              {
                type: "IDENTIFIER",
                content: "c",
                position: {
                  start: {
                    line: 3,
                    character: 13,
                  },
                  end: {
                    line: 3,
                    character: 14,
                  }
                }
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
                value: "c",
                position: {
                  start: {
                    line: 3,
                    character: 20,
                  },
                  end: {
                    line: 3,
                    character: 21,
                  },
                }
              }
            },
            LHO: {
              type: "IDENTIFIER",
              value: `b`,
              position: {
                start: {
                  line: 3,
                  character: 16,
                },
                end: {
                  line: 3,
                  character: 17,
                },
              }
            },
          },
        }
      },
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse a simple function definition", function() {
  const inputCode = `
    function test()
      % test
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
          type: "IDENTIFIER",
          value: "test",
          functionData: {
            args: [],
            description: "% test",
          },
        },
        RHE: [],
      }
    ]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});

test("Octave/Matlab Parser, should parse a simple function definition with output", function() {
  const inputCode = `
    function a = test()
      % test
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
        type: "ASSIGNMENT",
        supressOutput: true,
        LHE: {
          type: "IDENTIFIER",
          value: "a",
        },
        RHE: {
          type: "FUNCTION_DEFINITION",
          value: "function",
          LHO: {
            type: "IDENTIFIER",
            value: "test",
            functionData: {
              args: [],
              description: "% test",
            }
          },
          RHO: [],
        },
      }]
  };

  expect(parsedResult).toStrictEqual(expectedAST);
});
