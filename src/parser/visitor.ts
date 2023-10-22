import { Expression, Program, Statement, Reference, Token, ReferenceType, Definition, StatementType } from "../types";

export class Visitor {
  public references: Reference[] = [];
  public definitions: Definition[] = [];

  /**
  * Entry point: it extracts all the references and definitions from a Program
  */
  public visitProgram(node: Program): void {
    for (const statement of node.body) {
      this.visitStatement(statement);
    }
  }

  private visitStatement(node: Statement): void {
    if (node === undefined || node === null) return;
    switch (node.type) {
      case "ASSIGNMENT":
        if (node.LHE.type === "FUNCTION_DEFINITION") {
          this.visitExpression(node.LHE, "ASSIGNMENT");
        } else {
          this.visitExpression(node.LHE, "ASSIGNMENT");
          this.visitExpression(node.RHE as Expression, "ASSIGNMENT", false);
        }
        break;
      case "FUNCTION_DEFINITION":
        this.visitExpression(node.LHE, "FUNCTION_DEFINITION");
        (node?.RHE as Statement[]).forEach(statement => this.visitStatement(statement));
        break;
      case "MO_ASSIGNMENT":
        this.visitExpression(node.LHE, "MO_ASSIGNMENT");
        this.visitExpression(node.RHE as Expression, "MO_ASSIGNMENT", false);
        break;
    }
  }

  private visitExpression(node: Expression, parentType: StatementType | null, isLHE = true): void {
    if (node === undefined || node === null) return;
    switch (node.type) {
      case "IDENTIFIER":
        if ((parentType === "ASSIGNMENT" || parentType === "FUNCTION_DEFINITION") && isLHE) {
          this.definitions.push({
            name: node.value as string,
            position: node.position,
            type: parentType === "ASSIGNMENT" ? "VARIABLE" : "FUNCTION",
            documentation: this.getDocumentationOrLineDefinition(node),
          });
        }
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
                documentation: this.getDocumentationOrLineDefinition(node),
              };
            }
          ));
        }
        if (node?.RHO && Array.isArray(node.RHO)) {
          node.RHO.forEach(stmnt => this.visitStatement(stmnt));
        }
        break;
      case "BINARY_OPERATION":
        this.visitExpression(node.LHO, null);
        this.visitExpression(node.RHO as Expression, null, false);
        break;
      case "FUNCTION_DEFINITION":
        this.visitExpression(node.LHO, "FUNCTION_DEFINITION");
        if (Array.isArray(node.RHO)) {
          node.RHO.forEach(s => {
            this.visitStatement(s);
          });
        }
        break;
      case "KEYWORD":
        this.visitExpression(node.LHO, null);
        this.visitExpression(node.RHO as Expression, null, false);
        break;
      case "ANONYMOUS_FUNCTION_DEFINITION":
        // TODO: add a user setting to configure if should consider
        // the arguments of the ANONYMOUS_FUNCTION_DEFINITION as references
        if (node?.LHO?.value && node?.LHO?.position) {
          this.definitions.push({
            name: node.LHO.value as string,
            position: node.LHO.position,
            type: "ANONYMOUS_FUNCTION",
            documentation: this.getDocumentationOrLineDefinition(node),
          });
        }
        this.references.push(...node.functionData.args.map((arg) => {
          return {
            name: arg.content,
            position: node.position,
            type: this.getReferenceTypeFromNode(node),
            documentation: node?.functionData?.description ? node?.functionData?.description : "",
          };
        }));
        this.visitExpression(node.RHO as Expression, null, false);
        break;
      case "VARIABLE_VECTOR":
        if (!Array.isArray(node.value) || !(node?.value?.length > 1)) return;
        if (node?.value && Array.isArray(node.value)) {
          (node.value as Token[]).forEach((val) => {
            this.definitions.push({
              name: val.content,
              type: "VARIABLE",
              position: val.position,
              documentation: this.getDocumentationOrLineDefinition(node),
            });
          });
        }
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
      case "FUNCTION_CALL":
        this.references.push({
          name: node.value as string,
          position: node.position,
          documentation: this.getDocumentationOrLineDefinition(node),
          type: "FUNCTION",
        });
      break;
    }
  }

  /**
   * Helper that returns weather a node it's of assignment or not
   */
  private isAssignment(node: Statement | null | undefined): boolean {
    return node && node.type === "ASSIGNMENT";
  }

  /**
   * Helper that returns the documentation of the function 
   * or the hole line content of the variable
   */
  private getDocumentationOrLineDefinition(node: Expression): string {
    if (node?.functionData?.description) {
      return node?.functionData?.description;
    }

    if (!(node?.RHO) || Array.isArray(node.RHO)) return "";

    // TODO: complete this
    return "";
    const expr = (node?.RHO as Expression);
    switch (expr.type) {
      case "STRING":
      case "NUMBER":
      case "IDENTIFIER":
      case "FUNCTION_CALL":
      case "ANONYMOUS_FUNCTION_DEFINITION":
        return expr.value as string;
      case "BINARY_OPERATION":
        return ((node.LHO.value as string) + this.getDocumentationOrLineDefinition(node.RHO as Expression));
      default:
        return "";
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
