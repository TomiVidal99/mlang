import { expect, test } from "bun:test";
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
    function [va1, va2] = MO_FUNC(arg1, arg2)
    end
  `;
  // TODO: add other types of function definitions

  const references: string[] = ["a", "b", "c", "a", "b", "test", "myVar", "m", "d", "w", "a", "w", "a", "b", "b", "a", "va1", "va2", "MO_FUNC", "arg1", "arg2" ];

  const tokenizer = new Tokenizer(text);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const statements = parser.getStatements();
  const program = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(program);
  const calculatedReferences = visitor.references;

  const calculatedReferenceNames = calculatedReferences.map((ref) => ref.name);

  expect(calculatedReferenceNames).toStrictEqual(references);
});
