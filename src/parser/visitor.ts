import { isArray } from "util";
import { log } from "../server";
import { Expression, Program, Statement, Reference, Token, ReferenceType } from "../types";

export class Visitor {
  public references: Reference[] = [];

  /**
  * Entry point: it extracts all the references and definitions from a Program
  */
  public visitProgram(node: Program): void {
    for (const statement of node.body) {
      this.visitStatement(statement);
    }
  }

  private visitStatement(node: Statement): void {
    switch (node.type) {
      case "ASSIGNMENT":
        if (node.LHE.type === "FUNCTION_DEFINITION") {
          this.visitExpression(node.LHE);
        } else {
          this.visitExpression(node.LHE);
          this.visitExpression(node.RHE as Expression);
        }
        break;
      case "FUNCTION_DEFINITION":
        this.visitExpression(node.LHE);
        (node?.RHE as Statement[]).forEach(statement => this.visitStatement(statement));
      break;
      case "MO_ASSIGNMENT":
        this.visitExpression(node.LHE);
        this.visitExpression(node.RHE as Expression);
      break;
    }
  }

  private visitExpression(node: Expression): void {
    switch (node.type) {
      case "IDENTIFIER":
        this.references.push({
          name: node.value as string,
          position: node.position,
          type: this.getReferenceTypeFromNode(node),
          documentation: node?.functionData?.description ? node?.functionData?.description : "",
        });
        if (node?.functionData?.args) {
          this.references.push(...node.functionData.args.map(
            (arg) => {
              return {
                name: arg.content,
                position: arg.position,
                type: this.getReferenceTypeFromNode(node),
                documentation: node?.functionData?.description ? node?.functionData?.description : "",
              };
            }
          ));
        }
        break;
      case "BINARY_OPERATION":
        this.visitExpression(node.LHO);
        this.visitExpression(node.RHO as Expression);
        break;
      case "FUNCTION_DEFINITION":
        this.visitExpression(node.LHO);
        if (Array.isArray(node.RHO)) {
          node.RHO.forEach(s => {
            this.visitStatement(s);
          });
        }
        break;
      case "KEYWORD": 
        this.visitExpression(node.LHO);
        this.visitExpression(node.RHO as Expression);
        break;
      case "ANONYMOUS_FUNCTION_DEFINITION":
        // TODO: add a user setting to configure if should consider
        // the arguments of the ANONYMOUS_FUNCTION_DEFINITION as references
        this.references.push(...node.functionData.args.map((arg) => {
          return {
            name: arg.content,
            position: node.position,
            type: this.getReferenceTypeFromNode(node),
            documentation: node?.functionData?.description ? node?.functionData?.description : "",
          };
        }));
        this.visitExpression(node.RHO as Expression);
        break;
      case "VARIABLE_VECTOR":
        if (!Array.isArray(node.value) || !(node?.value?.length > 1)) return;
        (node.value as Token[]).forEach((token) => {
          if (token.type === "IDENTIFIER") {
            this.references.push({
              name: token.content,
              position: token.position,
              type: this.getReferenceTypeFromNode(node),
              documentation: node?.functionData?.description ? node?.functionData?.description : "",
            });
          }
        });
        break;
    }
  }

  /**
  * Helper that returns the type of a reference "CONSTANT" or "FUNCTION"
  */
  private getReferenceTypeFromNode(node: Expression): ReferenceType {
    if (node.type === "FUNCTION_CALL" || node.type === "FUNCTION_DEFINITION" || node.type === "ANONYMOUS_FUNCTION_DEFINITION") {
      return "FUNCTION";
    }
    return "VARIABLE";
  }
}
