import { Expression, Program, Statement, Token, TokenType } from "../types";

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
      const supressOutput = this.getCurrentToken().type === "SEMICOLON";
      if (supressOutput) {
        this.getNextToken();
      }
      return {
        type: "ASSIGNMENT",
        operator: nextToken.content,
        supressOutput,
        LHE: {
          type: "IDENTIFIER",
          value: currToken.content,
        },
        RHE,
        // position: , TODO
      };
    } else {
      throw new Error("Expected a valid token for a statement");
    }

  }

  /**
  * Helper that parses an expression
  * @throws error
  */
  private parseExpression(): Expression {
    const currToken = this.getCurrentToken();
    let lho: Expression | undefined = undefined;
    let isValidBinary = true;

    switch (currToken.type) {
      case "STRING":
      case "VECTOR":
        isValidBinary = false;
        lho = {
          type: currToken.type,
          value: currToken.content,
        };
        break;
      case "NUMBER":
        lho = {
          type: currToken.type,
          value: currToken.content,
        };
        break;
      case "IDENTIFIER":
        // TODO: make this better
        lho = this.parseFunctionCall();
        break;
      case "LPARENT":
        this.getNextToken();
        // console.log("curr token: ", this.getCurrentToken());
        lho = this.parseExpression();
        if (this.getCurrentToken().type !== "RPARENT") {
          throw new Error("Expected closing parenthesis ')'");
        }
        break;
      default:
        throw new Error(`Unexpected token. ${JSON.stringify(currToken)}`);
    }

    const nextToken = this.getNextToken();
    if (isValidBinary && this.isBinaryOperator(nextToken.type)) {
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

  private parseFunctionCall(): Expression {
    const currToken = this.getCurrentToken();
    if (this.getNextToken().type === "LPARENT") {
      return {
        type: "FUNCTION_CALL",
        value: currToken.content,
        functionData: {
          args: this.getFunctionArguments(),
        }
      };
    } else {
      return {
        type: currToken.type,
        value: currToken.content,
      };
    }
  }

  /**
   * Returns the list of arguments of a function call.
   * Its expected that the current token it's the LPARENT
   * TODO: implement check of correct grammar in arguments
   */
  private getFunctionArguments(): Token[] {
    const tokens: Token[] = [];
    do {
      tokens.push(this.getNextToken());
    } while (tokens[tokens.length - 1].type !== "RPARENT" || tokens[tokens.length - 1].type !== "EOF");
    if (tokens[tokens.length - 1].type !== "EOF") {
      throw new Error("Expected closing parenthesis ')' for function call");
      // TODO here should send diagnostics
    }
    tokens.pop();
    return tokens;
  }

  /**
  * Helper that returns weather a token type is a BinaryOperator
  */
  private isBinaryOperator(type: TokenType): boolean {
    return type === "SUBTRACTION" || type === "DIVISION" || type === "ADDITION" || type === "MULTIPLICATION";
  }

  public makeAST(): Program {
    do {
      this.statements.push(this.parseStatement());
    } while (this.getCurrentToken().type !== "EOF");

    return {
      type: "Program",
      body: this.statements,
    };
  }

}
