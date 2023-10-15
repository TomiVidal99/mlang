import { Expression, Statement, Token, TokenType } from "../types";

/**
 * Takes in a list of Tokens and makes an AST
 */
export class Parser {
  private currentTokenIndex = 0;
  private statements: Statement[] = [];

  constructor(private tokens: Token[]) {
  }

  /*
  *Helper function to get the current token
  */
  private getCurrentToken(): Token {
    return this.tokens[this.currentTokenIndex];
  }

  /*
  * Helper function to advance to the next token
  */
  private getNextToken(): Token | undefined {
    if (this.currentTokenIndex >= this.tokens.length) {
      return undefined;
    } else {
      this.currentTokenIndex++;
      return this.getCurrentToken();
    }
  }

  /**
   * Parses an statement
   */
  public parseStatement(): Statement {
    const currToken = this.getCurrentToken();
    const nextToken = this.getNextToken();

    if (!nextToken) {
      console.warn("Required at least two tokens");
      return;
    }

    // ASSIGNMENT STATEMENT FOUND
    if (currToken.type === "IDENTIFIER" && nextToken.type === "EQUALS") {
      this.getNextToken();
      const RHE = this.parseExpression();
      return {
        type: "ASSIGNMENT",
        operator: nextToken.content,
        LHE: {
          type: "IDENTIFIER",
          value: currToken.content,
        },
        RHE,
        // position: , TODO
      };

    }

    throw new Error("Expected to parse an statement");
  }

  /**
  * Helper that parses an expression
  * @throws error
  */
  private parseExpression(): Expression {
    const currToken = this.getCurrentToken();
    let lho: Expression | undefined = undefined;

    switch (currToken.type) {
      case "EOF":
        throw new Error("Unexpected EOF");
      case "STRING":
        lho = {
          type: "STRING",
          value: currToken.content,
        };
        break;
      case "NUMBER":
        lho = {
          type: "NUMBER",
          value: currToken.content,
        };
        break;
      default:
        throw new Error(`Unexpected token. ${JSON.stringify(currToken)}`);
    }

    const nextToken = this.getNextToken();
    if (this.isBinaryOperator(nextToken.type)) {
      this.getNextToken();
      return {
        type: "BINARY_OPERATION",
        value: nextToken.content,
        RHO: this.parseExpression(),
        LHO: lho,
      };
    }

    return lho;
  }

  /**
  * Helper that returns weather a token type is a BinaryOperator
  */
  private isBinaryOperator(type: TokenType): boolean {
    return type === "SUBTRACTION" || type === "DIVISION" || type === "ADDITION" || type === "MULTIPLICATION";
  }

}
