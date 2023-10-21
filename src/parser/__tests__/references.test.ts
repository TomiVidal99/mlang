import { expect, test } from "bun:test";
import { Parser, Tokenizer, Visitor } from "..";
import { Reference } from "../../types";

test("Octave/Matlab Parser, should parse a simple assignment statement", function() {
  const inputCode = "vectorReference = [100:a];";
  // const inputCode = `
  //   %stringReference = "STRING";
  //   %numberReference1 = 1000 + 1e3;
  //   vectorReference = [100:1000];
  // `;

  const tokenizer = new Tokenizer(inputCode);
  const tokens = tokenizer.getAllTokens();
  const parser = new Parser(tokens);
  const ast = parser.makeAST();
  const visitor = new Visitor();
  visitor.visitProgram(ast);
  const documentReferences = visitor.references;

  console.log("GOT: " + JSON.stringify(documentReferences));

  return;

  const expectedReferences: Reference[] = [
    {
      name: "stringReference",
      position: {
        start: {
          line: 2,
          character: 1,
        },
        end: {
          line: 2,
          character: 16,
        }
      }
    },
    {
      name: "numberReference1",
      position: {
        start: {
          line: 3,
          character: 1,
        },
        end: {
          line: 3,
          character: 24,
        }
      }
    },
    {
      name: "vectorReference",
      position: {
        start: {
          line: 4,
          character: 1,
        },
        end: {
          line: 4,
          character: 15,
        }
      }
    }
  ];

  expect(documentReferences).toStrictEqual(expectedReferences);
});
