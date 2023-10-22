import { expect, test } from "bun:test";
import { Parser, Tokenizer, Visitor } from "..";

test("Handle references: string, number and vector references", function() {
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

test("Handle references: function definitions refereces", function() {
  const inputCode = `
    % TODO: FIX THIS
    %function noParenFunction
    %end
    function parenFunction()
    end
    function singleOutput = functionSingleOutput()
    end
    function [output1, output2] = functionMO()
    end
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  // console.log("AST: " + JSON.stringify(ast));
  // console.log("REFERENCES: " + JSON.stringify(documentReferences.map(ref => ref.name)));

  //const expectedReferences: string[] = ["noParenFunction"];
  const expectedReferences: string[] = ["parenFunction", "singleOutput", "functionSingleOutput", "output1", "output2", "functionMO"];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(expectedReferences);
});

test("Handle references: function call refereces", function() {
  const inputCode = `
    a = functionCall()
  `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  //const expectedReferences: string[] = ["noParenFunction"];
  const expectedReferences: string[] = ["a", "functionCall"];

  expect(documentReferences.map((ref) => ref.name)).toStrictEqual(expectedReferences);
});
