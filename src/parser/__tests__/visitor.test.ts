import { expect, test } from "bun:test";
import { Reference } from "../../types";
import { Tokenizer } from "../tokenizer";
import { Parser } from "../parser";
import { Visitor } from "../visitor";

test("Octave/Matlab Visitor, test references extraction", () => {
  const text = `
    a = "string";
    b =     1
    c = a - b + 10000;
    function test = myVar(m,d)
      w = a + 1;
    end
    w = @(a,b) b + 1 + a;
  `;
  // TODO: add other types of function definitions

  const references: Reference[] = [
    {
      name: "a",
      position: undefined,
    },
    {
      name: "b",
      position: undefined,
    },
    {
      name: "c",
      position: undefined,
    },
    {
      name: "a",
      position: {
        start: {
          line: 4,
          character: 9,
        },
        end: {
          line: 4,
          character: 10,
        }
      },
    },
    {
      name: "b",
      position: {
        start: {
          line: 4,
          character: 13,
        },
        end: {
          line: 4,
          character: 14,
        }
      },
    },
    {
      name: "test",
      position: undefined,
    },
    {
      name: "myVar",
      position: undefined,
    },
    {
      name: "m",
      position: undefined,
    },
    {
      name: "d",
      position: undefined,
    },
    {
      name: "w",
      position: undefined,
    },
    {
      name: "a",
      position: {
        start: {
          line: 6,
          character: 11,
        },
        end: {
          line: 6,
          character: 12,
        }
      },
    },
    {
      name: "w",
      position: undefined,
    },
    {
      name: "a",
      position: undefined,
    },
    {
      name: "b",
      position: undefined,
    },
    {
      name: "b",
      position: {
        start: {
          line: 8,
          character: 16,
        },
        end: {
          line: 8,
          character: 17,
        }
      },
    },
    {
      name: "a",
      position: {
        start: {
          line: 8,
          character: 24,
        },
        end: {
          line: 8,
          character: 25,
        }
      },
    },
  ];

  const tokenizer = new Tokenizer(text);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);
  const calculatedReferences = visitor.references;

  // Extract only the names from the calculated references
  const calculatedReferenceNames = calculatedReferences.map((ref) => ref.name);

  // Extract only the names from the expected references
  const expectedReferenceNames = references.map((ref) => ref.name);

  // Check if the names match
  expect(calculatedReferenceNames).toStrictEqual(expectedReferenceNames);
});
