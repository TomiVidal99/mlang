import { expect, test } from "bun:test";
import { Reference } from "../../types";
import { Tokenizer } from "../tokenizer";
import { Parser } from "../parser";
import { Visitor } from "../visitor";
import { json } from "stream/consumers";

test("Octave/Matlab Visitor, test references extraction", () => {
  const text = `
    a = "string";
    b =     1
    c = a - b + 10000;
    function test = myVar(m,d)
      w = a + 1;
    end
    w = @(a,b) b + 1 + a;
    function [va1, va2] = MO_FUNC(arg1, arg2)
    end
  `;
  // TODO: add other types of function definitions

  const references: Reference[] = [
    {
      name: "a",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "b",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "c",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "a",
      type: "VARIABLE",
      documentation: "",
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
      type: "VARIABLE",
      documentation: "",
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
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "myVar",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "m",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "d",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "w",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "a",
      type: "VARIABLE",
      documentation: "",
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
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "a",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "b",
      position: undefined,
      type: "VARIABLE",
      documentation: "",
    },
    {
      name: "b",
      type: "VARIABLE",
      documentation: "",
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
      type: "VARIABLE",
      documentation: "",
      position: undefined,
    },
    {
      name: "va1",
      type: "VARIABLE",
      documentation: "",
      position: undefined,
    },
    {
      name: "va2",
      type: "VARIABLE",
      documentation: "",
      position: undefined,
    },
    {
      name: "MO_FUNC",
      type: "VARIABLE",
      documentation: "",
      position: undefined,
    },
    {
      name: "arg1",
      type: "VARIABLE",
      documentation: "",
      position: undefined,
    },
    {
      name: "arg2",
      type: "VARIABLE",
      documentation: "",
      position: undefined,
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

  console.log("calculated: " + JSON.stringify(calculatedReferenceNames));

  // Check if the names match
  expect(calculatedReferenceNames).toStrictEqual(expectedReferenceNames);
});
