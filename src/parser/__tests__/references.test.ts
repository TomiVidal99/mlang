import { expect, test } from "bun:test";
import { Parser, Tokenizer, Visitor } from "..";

test("Octave/Matlab Parser, should parse a simple assignment statement", function() {
  const inputCode = `
    stringReference = "STRING";
    numberReference1 = 1000 + 1e3;
    vectorReference = [100:1000];
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  const expectedReferences: string[] = ["stringReference", "numberReference1", "vectorReference"];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(expectedReferences);

});
