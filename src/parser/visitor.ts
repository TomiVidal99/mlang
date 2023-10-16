import { Expression, Program, Statement, Reference } from "../types";

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
    }
  }

  private visitExpression(node: Expression): void {
    switch (node.type) {
      case "IDENTIFIER":
        this.references.push({
          name: node.value as string,
          position: node.position,
        });
        if (node?.functionData?.args) {
          this.references.push(...node.functionData.args.map(
            (arg) => {
              return {
                name: arg.content,
                position: node.position,
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
    }
  }
}
