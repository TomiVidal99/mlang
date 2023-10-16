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
    if (this.currentTokenIndex >= this.tokens.length - 1) {
      return undefined;
    } else {
      this.currentTokenIndex++;
      return this.getCurrentToken();
    }
  }

  /*
  * Helper function to advance to the next token
  */
  private getPrevToken(): Token | undefined {
    if (this.currentTokenIndex <= 0) {
      return undefined;
    } else {
      this.currentTokenIndex--;
      return this.getCurrentToken();
    }
  }


  /**
   * Parses an statement
   */
  public parseStatement(): Statement {
    // ignore comments
    while (this.getCurrentToken().type === "COMMENT") {
      this.getNextToken();
    }

    const currToken = this.getCurrentToken();
    const nextToken = this.getNextToken();

    if (currToken.type === "EOF" || !nextToken) {
      return;
    }

    if (currToken.type === "IDENTIFIER" && nextToken.type === "EQUALS") {
      // SINGLE OUTPUT ASSIGNMENT STATEMENT
      this.getNextToken();
      const RHE = this.parseExpression();
      const supressOutput = this.isOutputSupressed();
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
    } else if (currToken.type === "LBRACKET" && nextToken.type === "IDENTIFIER") {
      // MULTIPLE OUTPUT ASSIGNMENT STATEMENT
      const outputs = this.getVariableVector().map(t => t.content);
      if (this.getCurrentToken().type !== "EQUALS") {
        throw new Error(`Expected ASSIGNMENT STATEMENT SYMBOL '='. ${JSON.stringify(this.getCurrentToken())}`);
      }
      const functionIdentifier = this.getNextToken().content;
      this.getNextToken();
      const args = this.getFunctionArguments();
      this.getNextToken();
      const supressOutput = this.isOutputSupressed();
      if (supressOutput) {
        this.getNextToken();
      }
      return {
        type: "MO_ASSIGNMENT",
        operator: "=",
        supressOutput,
        LHE: {
          type: "VARIABLE_VECTOR",
          value: outputs,
        },
        RHE: {
          type: "FUNCTION_CALL",
          value: functionIdentifier,
          functionData: {
            args,
          }
        }
      };
    } else if (currToken.type === "KEYWORD" && currToken.content === "function") {
      // FUNCTION DEFINITION STATEMENT
      // TODO: consider output with a single variable and a variable vector
      let description = this.getFunctionDefinitionDescription(true);
      const functionName = this.getNextToken();
      if (functionName.type !== "IDENTIFIER") {
        // TODO send linting message
        throw new Error(`Expected IDENTIFIER. Got: ${functionName}`);
      }
      this.getPrevToken();
      const args = this.getFunctionArguments();
      this.getNextToken();
      if (description === "") {
        description = this.getFunctionDefinitionDescription(false);
      }
      const statements: Statement[] = [];
      do {
        statements.push(this.parseStatement());
      } while (this.getCurrentToken().content !== "end" && this.getCurrentToken().content !== "endfunction");
      this.getNextToken();
      return {
        type: "FUNCTION_DEFINITION",
        supressOutput: true,
        LHE: {
          type: "KEYWORD",
          value: "function",
          functionData: {
            args,
            description,
          }
        },
        RHE: statements,
      };
    } else {
      console.log("prev token: ", this.tokens[this.currentTokenIndex - 1]);
      console.log("currToken: ", this.getCurrentToken());
      console.log("currToken: ", currToken);
      throw new Error("Expected a valid token for a statement");
    }

  }

  /**
   * Helper that extracts the comments before and after a function definition
   * @param beforeFunction - If should search for a description before the definition.
   */
  private getFunctionDefinitionDescription(beforeFunction: boolean): string {
    const comments: Token[] = [];
    const currentIndex = this.currentTokenIndex;
    this.getPrevToken();
    if (beforeFunction) {
      do {
        if (this.currentTokenIndex === 0) {
          break;
        }
        const prevToken = this.getPrevToken();
        if (prevToken.type === "COMMENT") {
          comments.push(prevToken);
        }
      } while (this.getCurrentToken().type === "COMMENT");
      comments.reverse();
    } else {
      do {
        const nextToken = this.getNextToken();
        if (nextToken.type === "COMMENT") {
          comments.push(nextToken);
        }
      } while (this.getCurrentToken().type === "COMMENT");
    }
    this.currentTokenIndex = currentIndex;
    return comments.map(t => t.content).join("\n");
  }

  /**
   * Helper that checks if the last token of the current statement it's a SEMICOLON
   */
  private isOutputSupressed(): boolean {
    return this.getCurrentToken().type === "SEMICOLON";
  }

  /**
   * Helper that returns a list of identifiers of a list of variables 
   * i.e [a,b,c,d,...,N] = FUNCTION_CALL(), it returns a through N
   */
  private getVariableVector(): Token[] {
    const tokens: Token[] = [];
    do {
      if (this.getCurrentToken().type !== "IDENTIFIER") {
        throw new Error(`Expected IDENTIFIER. Got: ${this.getCurrentToken()}`);
      }
      tokens.push(this.getCurrentToken());
      const nextTokenType = this.getNextToken().type;
      if (nextTokenType !== "COMMA" && nextTokenType !== "RBRACKET") {
        throw new Error(`Expected COMMA. Got: ${this.getCurrentToken()}`);
      }
      this.getNextToken();
      if (nextTokenType === "RBRACKET") {
        break;
      }
    } while (tokens[tokens.length - 1].type !== "RBRACKET");
    return tokens;
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
        lho = this.parseFunctionCall();
        this.getPrevToken();
        break;
      case "AT":
        {
          this.getNextToken();
          const args = this.getFunctionArguments();
          this.getNextToken();
          const expr = this.parseExpression();
          return {
            type: "ANONYMOUS_FUNCTION_DEFINITION",
            value: "@",
            functionData: {
              args,
            },
            RHO: expr,
          };
        }
      case "LPARENT":
        this.getNextToken();
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
      const args = this.getFunctionArguments();
      this.getNextToken();
      return {
        type: "FUNCTION_CALL",
        value: currToken.content,
        functionData: {
          args,
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
    if (this.getCurrentToken().type !== "LPARENT") {
      throw new Error(`Expected '(' for function call. Got: ${JSON.stringify(this.getCurrentToken())}`);
    }
    do {
      const identifier = this.getNextToken();
      if (identifier.type === "IDENTIFIER") {
        if (this.getNextToken().type === "LPARENT") {
          // TODO handle function composition
          this.getFunctionArguments(); // just for now so it gets rid of the function call (advances the tokens)
        }
      } else if (identifier.type === "RPARENT") {
        // When it's a call withot any arguments
        return [];
      } else {
        throw new Error(`Expected IDENTIFIER. Got ${identifier}`);
      }
      tokens.push(identifier);
      const commaOrRParen = this.getCurrentToken();
      if (commaOrRParen.type !== "COMMA" && commaOrRParen.type !== "RPARENT") {
        throw new Error(`Expected COMMA or RPARENT. Got ${commaOrRParen}`);
      }
    } while (this.getCurrentToken().type !== "RPARENT" && this.getCurrentToken().type !== "EOF");
    if (this.getCurrentToken().type === "EOF") {
      throw new Error("Expected closing parenthesis ')' for function call");
      // TODO here should send diagnostics
    }
    return tokens;
  }

  /**
  * Helper that returns weather a token type is a BinaryOperator
  */
  private isBinaryOperator(type: TokenType): boolean {
    return type === "SUBTRACTION" || type === "DIVISION" || type === "ADDITION" || type === "MULTIPLICATION";
  }

  /**
  * Makes the Abstract Syntax Tree with the given tokens.
  * @returns Program - AST.
  */
  public makeAST(): Program {
    do {
      const statement = this.parseStatement();
      if (statement) {
        this.statements.push(statement);
      }
    } while (this.getCurrentToken().type !== "EOF");

    return {
      type: "Program",
      body: this.statements,
    };
  }

}
