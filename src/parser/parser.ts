import { Expression, LintingError, LintingWarning, Program, Statement, Token, TokenType } from "../types";

/**
 * Takes in a list of Tokens and makes an AST
 */
export class Parser {
  private currentTokenIndex = 0;
  private statements: Statement[] = [];
  private errors: LintingError[] = [];
  private warnings: LintingWarning[] = [];

  constructor(private tokens: Token[]) {
  }

  public clearLintingMessages(): void {
    this.errors = [];
    this.warnings = [];
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
  public parseStatement(): Statement | undefined {
    // ignore comments
    while (this.getCurrentToken().type === "COMMENT") {
      this.getNextToken();
    }

    const currToken = this.getCurrentToken();
    const nextToken = this.getNextToken();

    if (currToken.type === "KEYWORD" && currToken.content === "end" || currToken.content === "endfunction") {
      return;
    }

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
          position: currToken.position,
        },
        RHE,
      };
    } else if (currToken.type === "LBRACKET" && nextToken.type === "IDENTIFIER") {
      // MULTIPLE OUTPUT ASSIGNMENT STATEMENT
      const outputs = this.getVariableVector().map(t => t.content);
      if (this.getCurrentToken().type !== "EQUALS") {
        this.errors.push({
          message: `Expected ASSIGNMENT STATEMENT SYMBOL '='. ${this.getCurrentToken().content}`,
          range: this.getCurrentToken().position,
        });
        return;
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
      const nextToken = this.getCurrentToken();
      const next2Token = this.getNextToken();
      this.getPrevToken();
      this.getPrevToken();
      if (nextToken.type === "IDENTIFIER" && next2Token.type === "EQUALS") {
        return this.getFunctionDefintionWithOutput(true);
      } else if (nextToken.type === "LBRACKET") {
        return this.getFunctionDefintionWithOutput(false);
      } else {
        return this.getFunctionDefintionWithoutOutput();
      }
    } else if (currToken.type === "IDENTIFIER" && (nextToken.type === "EOF" || nextToken.type === "IDENTIFIER" || nextToken.type === "NUMBER")) {
      // Printing outputs or single operations
      this.warnings.push({
        message: "Recommended to use a disp function to display the information",
        range: currToken.position,
      });
    } else {
      // console.log("prev token: ", this.tokens[this.currentTokenIndex - 1]);
      // console.log("currToken: ", this.getCurrentToken());
      // console.log("currToken: ", currToken);
      this.errors.push({
        message: "Expected a valid token for a statement",
        range: this.getCurrentToken().position,
      });
    }
  }

  /**
   * Helper that extracts the statement of a function definition with output/outputs
   * @args isSingleOutput - Weather the statement returns one or more outputs.
   */
  private getFunctionDefintionWithOutput(isSingleOutput: boolean): Statement {
    let description = this.getFunctionDefinitionDescription(true);
    let output: Token;
    let outputs: Token[];
    if (isSingleOutput) {
      output = this.getNextToken();
      this.getNextToken();
    } else {
      this.getNextToken();
      this.getNextToken();
      outputs = this.getVariableVector();
    }
    const functionName = this.getNextToken();
    if (functionName.type !== "IDENTIFIER") {
      this.errors.push({
        message: `Expected IDENTIFIER. Got: ${functionName.content}`,
        range: this.getCurrentToken().position,
      });
      return;
    }
    this.getNextToken();
    const args = this.getFunctionArguments();
    if (description === "") {
      description = this.getFunctionDefinitionDescription(false);
    }
    this.getNextToken();
    const statements: Statement[] = [];
    while (this.getCurrentToken().content !== "end" && this.getCurrentToken().content !== "endfunction") {
      const statement = this.parseStatement();
      if (!statement) {
        break;
      }
      statements.push(statement);
    }
    this.getNextToken();
    return {
      type: "ASSIGNMENT",
      supressOutput: true,
      LHE: {
        type: isSingleOutput ? "IDENTIFIER" : "VARIABLE_VECTOR",
        value: isSingleOutput ? output.content : outputs,
        position: isSingleOutput ? output.position : null,
      },
      RHE: {
        type: "FUNCTION_DEFINITION",
        value: "function",
        LHO: {
          type: "IDENTIFIER",
          value: functionName.content,
          position: functionName.position,
          functionData: {
            args,
            description,
          }
        },
        RHO: statements,
      },
    };
  }

  /**
   * Helper that extracts the statement of a function definition without output
   */
  private getFunctionDefintionWithoutOutput(): Statement {
    let description = this.getFunctionDefinitionDescription(true);
    const functionName = this.getNextToken();
    if (functionName.type !== "IDENTIFIER") {
      this.errors.push({
        message: `Expected IDENTIFIER. Got: ${functionName.content}`,
        range: this.getCurrentToken().position,
      });
      return;
    }
    this.getNextToken();
    const args = this.getFunctionArguments();
    this.getNextToken();
    if (description === "") {
      this.getPrevToken();
      description = this.getFunctionDefinitionDescription(false);
      this.getNextToken();
    }
    const statements: Statement[] = [];
    while (this.getCurrentToken().content !== "end" && this.getCurrentToken().content !== "endfunction") {
      const statement = this.parseStatement();
      if (!statement) {
        break;
      }
      statements.push(statement);
    }
    this.getNextToken();
    return {
      type: "FUNCTION_DEFINITION",
      supressOutput: true,
      LHE: {
        type: "IDENTIFIER",
        value: functionName.content,
        position: functionName.position,
        functionData: {
          args,
          description,
        }
      },
      RHE: statements,
    };
  }

  /**
   * Helper that returns weather the current token it's or not a certain type
   */
  private isToken(type: TokenType[]): boolean {
    const result = type.includes(this.getCurrentToken().type);
    this.getPrevToken();
    return result;
  }

  /**
   * Helper that extracts the comments before and after a function definition
   * @param beforeFunction - If should search for a description before the definition.
   */
  private getFunctionDefinitionDescription(beforeFunction: boolean): string {
    const comments: Token[] = [];
    const currentIndex = this.currentTokenIndex;
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
    const ret = comments.map(t => t.content).join("\n");
    return ret;
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
        this.errors.push({
          message: `Expected IDENTIFIER. Got: ${this.getCurrentToken().content}`,
          range: this.getCurrentToken().position,
        });
        return;
      }
      tokens.push(this.getCurrentToken());
      const nextTokenType = this.getNextToken().type;
      if (nextTokenType !== "COMMA" && nextTokenType !== "RBRACKET") {
        this.errors.push({
          message: `Expected COMMA. Got: '${this.getCurrentToken().content}'`,
          range: this.getCurrentToken().position,
        });
        return;
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
          this.errors.push({
            message: "Expected closing parenthesis ')'",
            range: this.getCurrentToken().position,
          });
          return;
        }
        break;
      case "LBRACKET":
        // VECTOR
        return {
          type: "VARIABLE_VECTOR",
          value: this.getVariableVectorValue(),
        };
      default:
        this.errors.push({
          message: `Unexpected token. ${currToken.content}`,
          range: this.getCurrentToken().position,
        });
        return;
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

  /**
   * Helper that retrieves the list of values that defines a vector
   * When executed should leave in the next token after the last ]
   */
  private getVariableVectorValue(): Token[] {
    const currentToken = this.getCurrentToken();
    const nextToken = this.getNextToken();
    const values: Token[] = [];

    // ERRORS
    if (!this.isTokenValidBasicDataType(nextToken)) {
      this.errors.push({
        message: "Wrong vector definition. Expected a 'number' or a 'variable'",
        range: currentToken.position,
      });
      this.getNextToken();
      return values;
    }

    values.push(nextToken);
    const secondToken = this.getNextToken();

    // We've got a vector like: [1]
    if (secondToken.type === "RBRACKET") {
      this.getNextToken();
      return values;
    }

    if (!this.isTokenValidBasicDataType(secondToken)) {
      this.errors.push({
        message: `Expected a valid vector definition. Got ${secondToken.content}`,
        range: secondToken.position,
      });
      this.getNextToken();
      return;
    }

    // We've got a vector like: [1, 2, a, b, etc]
    if (secondToken.type === "COMMA") {
      values.push(...this.getVariableVector());
      this.getNextToken();
      return values;
    }

    if (secondToken.type === "COLON") {
      const thirdToken = this.getNextToken();
      if (thirdToken.type !== "IDENTIFIER" && thirdToken.type !== "NUMBER") {
        this.errors.push({
          message: "Wrong vector definition. Expected a 'number' or a 'variable'",
          range: thirdToken.position,
        });
        this.getNextToken();
        return values;
      }
      values.push(thirdToken);
    }

    // We've got a vector like: [1:b]
    const fourthToken = this.getNextToken();
    if (fourthToken.type === "RBRACKET") {
      this.getNextToken();
      return values;
    }

    // We've got a vector like: [1:b:c]
    if (fourthToken.type === "COLON") {
      const fifthToken = this.getNextToken();
      if (fifthToken.type !== "IDENTIFIER" && fifthToken.type !== "NUMBER") {
        this.errors.push({
          message: "Wrong vector definition. Expected a 'number' or a 'variable'",
          range: fifthToken.position,
        });
        this.getNextToken();
        return values;
      }
      values.push(fifthToken);
    }

    const sixthToken = this.getNextToken();
    if (sixthToken.type !== "RBRACKET") {
      this.errors.push({
        message: "Wrong vector definition. Expected a closing bracket ']'",
        range: sixthToken.position,
      });
      this.getNextToken();
      return values;
    }

    this.getNextToken();

    return values;
  }

  /**
   * Helper that returns weather a Token it's of type NUMBER, STRING or IDENTIFIER
   * which are commonly used
   * @args token
   * @returns boolean
   */
  private isTokenValidBasicDataType(token: Token): boolean {
    return token.type !== "IDENTIFIER" && token.type !== "NUMBER" && token.type !== "STRING";
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
        },
        position: currToken.position,
      };
    } else {
      return {
        type: currToken.type,
        value: currToken.content,
        position: currToken.position,
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
      this.errors.push({
        message: `Expected '(' for function call. Got: ${this.getCurrentToken().content}`,
        range: this.getCurrentToken().position,
      });
      return;
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
        this.errors.push({
          message: `Expected IDENTIFIER. Got ${identifier}`,
          range: this.getCurrentToken().position,
        });
        return;
      }
      tokens.push(identifier);
      const commaOrRParen = this.getCurrentToken();
      if (commaOrRParen.type !== "COMMA" && commaOrRParen.type !== "RPARENT") {
        this.errors.push({
          message: `Expected COMMA or RPARENT. Got '${commaOrRParen.content}'`,
          range: this.getCurrentToken().position,
        });
        return;
      }
    } while (this.getCurrentToken().type !== "RPARENT" && this.getCurrentToken().type !== "EOF");
    if (this.getCurrentToken().type === "EOF") {
      this.errors.push({
        message: "Expected closing parenthesis ')' for function call",
        range: this.getCurrentToken().position,
      });
      return;
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

  /**
   * Returns the list of errors found during parsing.
   */
  public getErrors(): LintingError[] {
    return this.errors;
  }

  /**
   * Returns the list of warnings found during parsing.
   */
  public getWarnings(): LintingWarning[] {
    return this.warnings;
  }

}
