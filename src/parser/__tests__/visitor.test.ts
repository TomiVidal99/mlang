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
      position: undefined,
    },
    {
      name: "b",
      position: undefined,
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
      position: undefined,
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
      position: undefined,
    },
    {
      name: "a",
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

  expect(calculatedReferences).toStrictEqual(references);
});
