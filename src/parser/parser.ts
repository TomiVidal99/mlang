import type { Range } from 'vscode-languageserver';
import { CERO_POSITION, ERROR_CODES } from '../constants';
import type {
  Expression,
  LintingError,
  LintingWarning,
  Program,
  Statement,
  Token,
  TokenType,
} from '../types';
import { getRandomStringID } from '../utils';

const MAX_STATEMENTS = 5000 as const; // TODO: this should be an user setting

/**
 * Takes in a list of Tokens and makes an AST
 */
export class Parser {
  private currentTokenIndex = 0;
  private readonly statements: Statement[] = [];
  private errors: LintingError[] = [];
  private warnings: LintingWarning[] = [];
  private readonly contextDepth: string[] = ['0'];

  constructor(private readonly tokens: Token[]) {}

  public clearLintingMessages(): void {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Returns the last element of the context array
   */
  private getCurrentContext(): string {
    return this.contextDepth[this.contextDepth.length - 1];
  }

  /**
   * Helper function to go deeper into a context
   * @returns [previousContext, newContext]
   */
  private getIntoNewContext(): [string, string] {
    const prevContext = this.getCurrentContext();
    const newContext = getRandomStringID();
    this.contextDepth.push(newContext);
    return [prevContext, newContext];
  }

  /**
   * Helper that goes back into the previous depth context and it returns it
   * @returns [previousContext, newContext]
   */
  private getBackOfContext(): [string, string] {
    const prevContext = this.getCurrentContext();
    const newContext = this.contextDepth.pop();
    if (newContext === undefined)
      throw new Error('Expected newContext to be defined');
    return [prevContext, newContext];
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
   * Helper function to advance to the prev token
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
  public parseStatement(): Statement | null {
    // ignore comments and jump lines
    while (
      this.getCurrentToken().type === 'COMMENT' ||
      this.getCurrentToken().type === 'NL'
    ) {
      this.getNextToken();
    }

    const currToken = this.getCurrentToken();
    const nextToken = this.getNextToken();

    if (nextToken === undefined) return null;

    if (
      currToken.content === 'end' ||
      currToken.content === 'endfunction' ||
      currToken.content === 'endif' ||
      currToken.type === 'EOF'
    ) {
      this.getPrevToken();
      return null;
    }

    if (
      (currToken.type === 'IDENTIFIER' ||
        currToken.type === 'NATIVE_FUNCTION') &&
      nextToken.type === 'LPARENT'
    ) {
      // JUST A FUNCTION CALL
      // TODO: or it could be a vector. Think how to improve this
      this.getPrevToken();
      const position = this.getCurrentPosition();
      this.getNextToken();
      const args = this.getFunctionArguments();
      this.getNextToken();
      const supressOutput = this.isOutputSupressed();
      return {
        type: 'FUNCTION_CALL',
        supressOutput,
        context: this.getCurrentContext(),
        LHE: {
          type: 'IDENTIFIER',
          value: currToken.content,
          position,
          functionData: {
            args,
          },
        },
      };
    } else if (currToken.type === 'IDENTIFIER' && nextToken.type === 'EQUALS') {
      // SINGLE OUTPUT ASSIGNMENT STATEMENT
      this.getNextToken();
      const RHE = this.parseExpression();
      const supressOutput = this.isOutputSupressed();
      return {
        type: 'ASSIGNMENT',
        operator: nextToken.content as string,
        supressOutput,
        context: this.getCurrentContext(),
        LHE: {
          type: 'IDENTIFIER',
          value: currToken.content,
          position: this.getCurrentPosition(currToken),
        },
        RHE,
      };
    } else if (currToken.type === 'LBRACKET') {
      // MULTIPLE OUTPUT ASSIGNMENT STATEMENT
      // OR OUTPUTTING A VECTOR DATA TO THE CONSOLE (not recommended)
      const [vectorArgs, vectorType] = this.getVectorArgs();
      if (
        vectorType === 'COMMA' &&
        vectorArgs.every((a) => a.type === 'IDENTIFIER') &&
        this.getCurrentToken().type === 'EQUALS'
      ) {
        // IT'S AN OUTPUT
        if (this.getCurrentToken().type !== 'EQUALS') {
          // TODO: think how to do this better, because this it's not necessarly like this
          this.errors.push({
            message: `Unexpected token ${this.stringifyTokenContent()}`,
            range: this.getCurrentPosition(),
            code: ERROR_CODES.OUTPUT_VECTOR,
          });
          return null;
        }
        const functionIdentifier = this.getNextToken();
        if (functionIdentifier === undefined)
          throw new Error('Unexpected undefined token. Code 50'); // TODO: should throw here?
        if (
          functionIdentifier.type !== 'IDENTIFIER' &&
          functionIdentifier.type !== 'KEYWORD'
        ) {
          this.errors.push({
            message: `Expected a function call. Got ${this.stringifyTokenContent()}`,
            range: this.getCurrentPosition(),
            code: ERROR_CODES.EXPECTED_FN_IDENT,
          });
          return null;
        }
        this.getNextToken();
        const args = this.getFunctionArguments();
        this.validateFnCallArgs(args);
        this.getNextToken();
        const supressOutput = this.isOutputSupressed();
        return {
          type: 'MO_ASSIGNMENT',
          operator: '=',
          supressOutput,
          context: this.getCurrentContext(),
          LHE: {
            type: 'VARIABLE_VECTOR',
            value: vectorArgs,
          },
          RHE: {
            type: 'FUNCTION_CALL',
            position: this.getCurrentPosition(functionIdentifier),
            value: functionIdentifier.content,
            functionData: {
              args,
            },
          },
        };
      }
      // ELSE ITS A VALUE VECTOR
      // TODO: should do something here??
      return null;
    } else if (
      currToken.type === 'KEYWORD' &&
      currToken.content === 'function'
    ) {
      // FUNCTION DEFINITION STATEMENT
      const nextToken = this.getCurrentToken();
      const next2Token = this.getNextToken();
      this.getPrevToken();
      this.getPrevToken();
      if (next2Token === undefined)
        throw new Error('Unexpected undefined token. Code 60'); // TODO: better handle this
      if (nextToken.type === 'IDENTIFIER' && next2Token.type === 'EQUALS') {
        return this.getFunctionDefintionWithOutput(true);
      } else if (nextToken.type === 'LBRACKET') {
        return this.getFunctionDefintionWithOutput(false);
      } else {
        return this.getFunctionDefintionWithoutOutput();
      }
    } else if (
      currToken.type === 'IDENTIFIER' &&
      (nextToken.type === 'NL' ||
        nextToken.type === 'EOF' ||
        this.isTokenValidBasicDataType(nextToken))
    ) {
      // FUNCTION CALL (NOT recommended way)
      // Printing outputs, single operations or function calls with arguments
      // TODO: make this a function call
      let counter = 0;
      while (
        this.getCurrentToken().type !== 'NL' &&
        this.getCurrentToken().type !== 'EOF' &&
        this.isTokenValidBasicDataType(this.getCurrentToken()) &&
        counter < MAX_STATEMENTS
      ) {
        this.getNextToken();
        counter++;
      }
      this.logErrorMaxCallsReached(
        counter,
        'Could not parse function call',
        ERROR_CODES.FN_CALL_EXCEEDED_CALLS,
      );
      // TODO: this should be handle at visitor level, because we don't know if it's a variable or a function
      // this.warnings.push({
      //   message: 'Unadvised function call',
      //   range: this.getCurrentPosition(nextToken),
      //   code: 7,
      // });
    } else if (currToken.type === 'KEYWORD' && currToken.content === 'if') {
      return this.parseIfStatement();
    } else {
      // console.log("prev token: ", this.tokens[this.currentTokenIndex - 1]);
      // console.log("currToken: ", this.getCurrentToken());
      // console.log("currToken: ", currToken);
      if (currToken === undefined)
        throw new Error('Unexpected undefined token. Code 70'); // TODO: definitly better handle this!
      // this.errors.push({
      //   message: `Unexpected token. Got: "${this.stringifyTokenContent(
      //     currToken,
      //   )}" (${currToken.type}). TOKENS: ${JSON.stringify(
      //     this.tokens.map((t) => t.type).slice(0, 10),
      //   )}\n${JSON.stringify(getKeywordsFromCompletion())}`,
      //   range: currToken?.position ?? {
      //     start: { line: 0, character: 0 },
      //     end: { line: 0, character: 0 },
      //   },
      //   code: 24,
      // });
      this.errors.push({
        message: `Unexpected token. Got: "${this.stringifyTokenContent(
          currToken,
        )}"`,
        range: currToken?.position ?? {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        code: 24,
      });
      return null;
    }

    return null;
  }

  /**
   * Parses an If Statement
   * IMPORTANT: Expectes the current token to be '('
   */
  private parseIfStatement(): Statement {
    const startingPosition = this.getPrevToken()?.position;
    this.getNextToken();

    if (this.getCurrentToken().type !== 'LPARENT') {
      this.errors.push({
        message: `Expected a left parenthesis. Got ${this.stringifyTokenContent()}`,
        range: this.getCurrentPosition(),
        code: ERROR_CODES.EXPECTED_LPAREN_IF_STMNT,
      });
    }

    let endToken: Token | undefined;
    let counter = 0;
    // this do while should just parses what's inside the parenthesis
    do {
      this.skipNL(true);
      if (
        !this.isTokenValidBasicDataType(this.getCurrentToken()) &&
        this.getCurrentToken().type !== 'RPARENT'
      ) {
        this.errors.push({
          code: ERROR_CODES.EXPECTED_VALID_IF_STMNT,
          range: this.getCurrentPosition(),
          message: `Unexpected token: "${JSON.stringify(
            this.getCurrentToken().content,
          )}"`,
        });
        continue;
      }

      if (this.getCurrentToken().type === 'RPARENT') {
        endToken = this.getCurrentToken();
        break;
      }

      // next should be == > < <= >=
      this.getNextToken();
      if (
        this.getCurrentToken().type !== 'EQUALS' &&
        this.getCurrentToken().type !== 'GRATER_THAN' &&
        this.getCurrentToken().type !== 'LESS_THAN'
      ) {
        this.errors.push({
          code: ERROR_CODES.EXPECTED_VALID_IF_STMNT,
          range: this.getCurrentPosition(),
          message: `Unexpected token: "${JSON.stringify(
            this.getCurrentToken().content,
          )}"`,
        });
        continue;
      }
      // skip the next equals if exists
      if (this.getNextToken()?.type !== 'EQUALS') {
        this.getPrevToken();
      }

      this.getNextToken();
      if (!this.isTokenValidBasicDataType(this.getCurrentToken())) {
        this.errors.push({
          code: ERROR_CODES.EXPECTED_VALID_IF_STMNT,
          range: this.getCurrentPosition(),
          message: `Unexpected token: "${JSON.stringify(
            this.getCurrentToken().content,
          )}"`,
        });
        continue;
      }

      if (this.skipNL(true).type === 'AND') {
        if (this.skipNL(true).type !== 'AND') {
          this.errors.push({
            code: ERROR_CODES.EXPECTED_VALID_SYMBOL_IF_STMNT,
            range: this.getCurrentPosition(),
            message: `Unexpected token: "${JSON.stringify(
              this.getCurrentToken().content,
            )}"`,
          });
          continue;
        }
      } else if (this.skipNL().type === 'OR') {
        if (this.skipNL(true).type !== 'OR') {
          this.errors.push({
            code: ERROR_CODES.EXPECTED_VALID_SYMBOL_IF_STMNT,
            range: this.getCurrentPosition(),
            message: `Unexpected token: "${JSON.stringify(
              this.getCurrentToken().content,
            )}"`,
          });
          continue;
        }
      }

      endToken = this.skipNL(true);
      this.getPrevToken();

      counter++;
    } while (
      endToken !== undefined &&
      counter < MAX_STATEMENTS &&
      endToken.type !== 'RPARENT'
    );

    this.logErrorMaxCallsReached(
      counter,
      'Maximum tries reached when parsing if statement',
      ERROR_CODES.EXCEEDED_CALLS_RPAREN_IF_STMNT,
    );

    // check statements inside if statement
    // TODO
    const statements: Statement[] = [];
    let maxCalls = 0;
    while (!this.isEndIfToken() && !this.isEOF() && maxCalls < MAX_STATEMENTS) {
      const statement = this.parseStatement();
      if (statement !== null) statements.push(statement);
      maxCalls++;
    }
    this.logErrorMaxCallsReached(
      maxCalls,
      "Could not find closing keyword 'end' or 'endif'",
      ERROR_CODES.MISSING_END_IF_STMNT,
    );

    const context = this.getIntoNewContext()[1];
    const position: Range = {
      ...(startingPosition as Range),
      end: this.getCurrentPosition().start,
    };

    return {
      type: 'IF_STMNT',
      supressOutput: true,
      context,
      LHE: {
        type: 'IF_STMNT',
        value: 'if', // TODO: here should maybe be all the conditions???
        position,
      },
      RHE: statements,
    };
  }

  /**
   * Returns true if the current token or the given token
   * it's 'end' or 'endif'
   */
  private isEndIfToken(token?: Token): boolean {
    if (token !== undefined) {
      return token.content === 'end' || token.content === 'endif';
    }
    return (
      this.getCurrentToken().content === 'end' ||
      this.getCurrentToken().content === 'endif'
    );
  }

  /**
   * Helper that returns a 'struct' Token if the grammar it's correct
   * else it returns null
   * WARN: assumes that the first token it's 'LSQUIRLY'
   * WARN: Leaves the current token to the next after the '}'
   */
  private parseStruct(): Token | null {
    const args: Token[] = [];
    const initPos =
      this.getCurrentToken().position?.start ?? CERO_POSITION.start;
    let counter = 0;
    do {
      const arg = this.skipNL(true);
      if (arg !== undefined && this.isValidStructType(arg)) {
        args.push(arg);
      } else {
        return null;
      }
      const comma = this.skipNL(true);
      if (
        comma === undefined ||
        (comma.type !== 'COMMA' && comma.type !== 'RSQUIRLY')
      ) {
        this.errors.push({
          message: `Unexpected struct value. Got "${
            comma?.type ?? 'UNDEFINED'
          }". Code ${ERROR_CODES.STRUCT_BAD_COMMA.toString()}`,
          code: ERROR_CODES.STRUCT_BAD_ARGS,
          range: this.getCurrentPosition(),
        });
      }
      counter++;
    } while (
      this.getCurrentToken().type !== 'RSQUIRLY' &&
      this.getCurrentToken().type !== 'EOF' &&
      this.currentTokenIndex < this.tokens.length &&
      counter < MAX_STATEMENTS // TODO: this should be some other CONST
    );

    this.getNextToken();

    return {
      type: 'STRUCT',
      content: args,
      position: {
        start: initPos,
        end: this.getCurrentPosition().end,
      },
    };
  }

  /**
   * Helper that returns weather the current Token it's
   * a valid struct argument or not.
   * WARN: COMMAs don't count
   */
  private isValidStructType(token: Token): boolean {
    if (
      !this.isTokenValidBasicDataType(token) &&
      token.type !== 'VECTOR' &&
      token.type !== 'STRUCT'
    ) {
      this.errors.push({
        message: `Unexpected struct value. Got "${
          token.type
        }". Code ${ERROR_CODES.STRUCT_BAD_ARGS.toString()}`,
        code: ERROR_CODES.STRUCT_BAD_ARGS,
        range: this.getCurrentPosition(),
      });
      return false;
    }
    return true;
  }

  /**
   * Helper that sends an error if the arguments of a funcion call are wrong
   */
  private validateFnCallArgs(args: Token[]): void {
    for (const arg of args) {
      if (arg.type === 'DEFAULT_VALUE_ARGUMENT') {
        this.errors.push({
          message: 'Unexpected default value argument in function call',
          range: this.getCurrentPosition(arg),
          code: 23,
        });
      }
    }
  }

  /**
   * Returns the list of tokens that are contained in an vector
   * Also returns weather the vector it's declared with ': ' or just ', '
   */
  private getVectorArgs(): [Token[], 'COMMA' | 'COLON'] {
    const tokens: Token[] = [];

    if (this.getCurrentToken().type === 'LBRACKET') this.getNextToken();

    if (this.getCurrentToken().type === 'RBRACKET') {
      this.getNextToken();
      return [[], 'COMMA'];
    }
    if (this.getCurrentToken().type === 'LBRACKET') {
      tokens.push(this.getVector());
      this.getPrevToken();
    } else if (this.isTokenValidBasicDataType(this.getCurrentToken())) {
      tokens.push(this.getCurrentToken());
    }
    const itsCommaSeparated = this.getNextToken()?.type === 'COMMA';

    if (itsCommaSeparated) {
      tokens.push(...this.getVectorValuesCommaSeparated());
    } else {
      tokens.push(...this.getVectorValuesColonSeparated());
    }

    this.getNextToken();

    return [tokens, itsCommaSeparated ? 'COMMA' : 'COLON'];
  }

  /**
   * Helper that returns the value of a vector ':' separated
   */
  private getVectorValuesColonSeparated(): Token[] {
    const tokens: Token[] = [];

    while (this.getCurrentToken().type === 'COLON' && tokens.length < 2) {
      const nextValue = this.getNextToken();
      if (nextValue === undefined)
        throw new Error('Unexpected undefined token. Code 80');

      if (nextValue.type === 'LBRACKET') {
        tokens.push(this.getVector(nextValue));
        this.getPrevToken();
      } else if (this.isTokenValidBasicDataType(nextValue)) {
        tokens.push(nextValue);
      }

      this.getNextToken();
    }

    if (this.getCurrentToken().type !== 'RBRACKET') {
      this.errors.push({
        message: 'Unexpected vector value',
        range: this.getCurrentPosition(),
        code: 22,
      });
    }

    return tokens;
  }

  public counter = 0;

  /**
   * Helper that returns a vector once a bracket it's found
   */
  private getVector(token?: Token): Token {
    const [vectorArgs] = this.getVectorArgs();
    const referenceToken = token ?? this.getCurrentToken();
    if (referenceToken === undefined)
      throw new Error('Unexpected undefined token. Code 130');
    const referenceTokenPos = this.getCurrentPosition(referenceToken);
    return {
      type: 'VECTOR',
      content: vectorArgs,
      position: {
        start: referenceTokenPos.start,
        end:
          vectorArgs[vectorArgs.length - 1]?.position?.end ??
          referenceTokenPos.end,
      },
    };
  }

  /**
   * Helper that returns a list of tokens corresponding to
   * a comma separated vector declaration
   */
  private getVectorValuesCommaSeparated(): Token[] {
    const tokens: Token[] = [];

    while (this.getCurrentToken().type === 'COMMA') {
      const nextValue = this.getNextToken();
      if (nextValue === undefined)
        throw new Error('Unexpected undefined token. Code 120');
      if (nextValue.type === 'LBRACKET') {
        tokens.push(this.getVector(nextValue));
        this.getPrevToken();
      } else if (!this.isTokenValidBasicDataType(nextValue)) {
        break;
      } else {
        tokens.push(nextValue);
      }
      this.getNextToken();
    }

    if (this.getCurrentToken().type !== 'RBRACKET') {
      this.errors.push({
        message: 'Unexpected vector value',
        range: this.getCurrentPosition(),
        code: 21,
      });
    }

    return tokens;
  }

  /**
   * Helper that extracts the statement of a function definition with output / outputs
   * @args isSingleOutput - Weather the statement returns one or more outputs.
   */
  private getFunctionDefintionWithOutput(
    isSingleOutput: boolean,
  ): Statement | null {
    const [prevContext, newContext] = this.getIntoNewContext();
    let description = this.getFunctionDefinitionDescription(true);
    let output: Token | undefined;
    const outputs: Token[] = [];
    if (isSingleOutput) {
      output = this.getNextToken();
      this.getNextToken();
    } else {
      this.getNextToken();
      this.getNextToken();
      outputs.push(...this.getVariableVector());
    }
    const functionName = this.getNextToken();
    if (functionName === undefined)
      throw new Error('Unexpected undefined token. Code 110');
    if (functionName.type !== 'IDENTIFIER') {
      this.errors.push({
        message: `Expected IDENTIFIER. Got: ${this.stringifyTokenContent(
          functionName,
        )}`,
        range: this.getCurrentPosition(),
        code: 20,
      });
      return null;
    }
    this.getNextToken();
    const args = this.getFunctionArguments();
    this.checkValidFunctionDefinitionArguments(args);
    if (description === '') {
      description = this.getFunctionDefinitionDescription(false);
    }
    this.getNextToken();
    const statements: Statement[] = [];
    let maxCalls = 0;
    while (
      !this.isEndFunctionToken() &&
      !this.isEOF() &&
      maxCalls < MAX_STATEMENTS
    ) {
      const statement = this.parseStatement();
      if (statement !== null) statements.push(statement);
      maxCalls++;
    }
    this.logErrorMaxCallsReached(
      maxCalls,
      "Could not find closing keyword 'end'",
      ERROR_CODES.FN_DEF_MISSING_END,
    );
    const endToken = this.getCurrentToken();
    if (endToken.type === 'EOF') {
      this.errors.push({
        message: "Expected closing function 'end' or 'endfunction'",
        range: {
          start: this.getCurrentPosition(functionName).start,
          end: this.getCurrentPosition(functionName).end,
        },
        code: 19,
      });
      return null;
    }
    this.getNextToken();
    this.getBackOfContext();
    const RHE: Expression = {
      type: 'FUNCTION_DEFINITION',
      value: 'function',
      LHO: {
        type: 'IDENTIFIER',
        value: functionName.content,
        position: this.getCurrentPosition(functionName),
        functionData: {
          args,
          description,
          closingToken: endToken,
          contextCreated: newContext,
        },
      },
      RHO: statements,
    };
    return {
      type: 'ASSIGNMENT',
      supressOutput: true,
      context: prevContext,
      LHE: {
        type: isSingleOutput ? 'IDENTIFIER' : 'VARIABLE_VECTOR',
        value:
          isSingleOutput && output !== undefined ? output.content : outputs,
        position:
          isSingleOutput && output !== undefined
            ? this.getCurrentPosition(output)
            : undefined,
      },
      RHE,
    };
  }

  /**
   * Helper that sends error if the arguments of a function defintion are not correct
   * The arguments in a function definition should be IDENTIFIERs and default values(ASSIGNMENTs)
   */
  private checkValidFunctionDefinitionArguments(args: Token[]): boolean {
    let isValidFlag = true;

    args.forEach((a) => {
      if (a.type === 'IDENTIFIER' || a.type === 'DEFAULT_VALUE_ARGUMENT')
        return;
      isValidFlag = false;

      this.errors.push({
        message: 'Invalid function definition argument. ',
        range: this.getCurrentPosition(a),
        code: 200,
      });
    });

    return isValidFlag;
  }

  /**
   * Helper that extracts the statement of a function definition without output
   */
  private getFunctionDefintionWithoutOutput(): Statement | null {
    const [prevContext, newContext] = this.getIntoNewContext();
    let description = this.getFunctionDefinitionDescription(true);
    const functionName = this.getNextToken();
    if (functionName === undefined)
      throw new Error('Unexpected undefined token. Code 100');
    if (functionName.type !== 'IDENTIFIER') {
      this.errors.push({
        message: `Expected IDENTIFIER. Got: ${this.stringifyTokenContent(
          functionName,
        )}`,
        range: this.getCurrentPosition(),
        code: 18,
      });
      return null;
    }
    this.getNextToken();
    const args = this.getFunctionArguments();
    this.checkValidFunctionDefinitionArguments(args);
    this.getNextToken();
    if (description === '') {
      this.getPrevToken();
      description = this.getFunctionDefinitionDescription(false);
      this.getNextToken();
    }
    const statements: Statement[] = [];
    let maxCalls = 0;
    while (
      !this.isEndFunctionToken() &&
      !this.isEOF() &&
      maxCalls < MAX_STATEMENTS
    ) {
      const statement = this.parseStatement();
      if (statement !== null) statements.push(statement);
      maxCalls++;
    }
    if (maxCalls >= MAX_STATEMENTS) {
      this.errors.push({
        message: 'Max calls for statements in a function definition',
        range: this.getCurrentPosition(),
        code: 16,
      });
    }
    const endToken = this.getCurrentToken();
    if (endToken.type === 'EOF') {
      this.errors.push({
        message: "Expected closing function 'end' or 'endfunction'",
        range: {
          start: this.getCurrentPosition(functionName).start,
          end: this.getCurrentPosition(functionName).end,
        },
        code: 17,
      });
      return null;
    }
    this.getNextToken();
    this.getBackOfContext();
    return {
      type: 'FUNCTION_DEFINITION',
      supressOutput: true,
      context: prevContext,
      LHE: {
        type: 'IDENTIFIER',
        value: functionName.content,
        position: this.getCurrentPosition(functionName),
        functionData: {
          args,
          description,
          closingToken: endToken,
          contextCreated: newContext,
        },
      },
      RHE: statements,
    };
  }

  /**
   * Helper that extracts the comments before and after a function definition
   * @param beforeFunction - If should search for a description before the definition.
   */
  private getFunctionDefinitionDescription(beforeFunction: boolean): string {
    const comments: Token[] = [];
    const currentIndex = this.currentTokenIndex;
    if (beforeFunction) {
      let maxIterations = 0;
      do {
        maxIterations++;
        if (this.currentTokenIndex === 0) {
          break;
        }
        const prevToken = this.getPrevTokenSkipNL();
        if (prevToken?.type === 'COMMENT') {
          comments.push(prevToken);
        }
      } while (
        this.getCurrentToken().type === 'COMMENT' &&
        maxIterations <= MAX_STATEMENTS
      );
      this.logErrorMaxCallsReached(
        maxIterations,
        'Iterations exceeded trying to find function comments',
        ERROR_CODES.MAX_ITERATION_COMMENTS_BEFORE,
      );
      comments.reverse();
    } else {
      let maxIterations = 0;
      do {
        maxIterations++;
        const nextToken = this.skipNL(true);
        if (nextToken.type === 'COMMENT') {
          comments.push(nextToken);
        }
      } while (
        this.getCurrentToken().type === 'COMMENT' &&
        maxIterations <= MAX_STATEMENTS
      );
      this.logErrorMaxCallsReached(
        maxIterations,
        'Iterations exceeded trying to find function comments',
        ERROR_CODES.MAX_ITERATION_COMMENTS_AFTER,
      );
    }
    this.currentTokenIndex = currentIndex;
    const ret = comments.map((t) => t.content).join('\n');
    return ret;
  }

  /**
   * Helper that returns the previous Token skipping new lines tokens
   */
  private getPrevTokenSkipNL(): Token | undefined {
    let token: Token | undefined;
    let counter = 0;
    do {
      token = this.getPrevToken();
      counter++;
    } while (token?.type === 'NL' && counter < MAX_STATEMENTS);

    this.logErrorMaxCallsReached(
      counter,
      'Max statement parsing reached while parsing comment',
      ERROR_CODES.MAX_ITERATION_PARSING_COMMENT_BEFORE,
    );

    return token;
  }

  /**
   * Helper that checks if the last token of the current statement it's a SEMICOLON
   * TODO: maybe the warning messages should go in each statement//expression instead
   * so the range it's better calculated
   */
  private isOutputSupressed(): boolean {
    const isSupressed = this.getCurrentToken().type === 'SEMICOLON';
    if (!isSupressed) {
      this.warnings.push({
        message: 'Will output to the console',
        range: this.getCurrentPosition(this.getPrevToken()),
        code: 15,
      });
      this.getNextToken();
      return false;
    }
    this.getNextToken();
    return isSupressed;
  }

  /**
   * Helper that returns a list of identifiers of a list of variables
   * i.e[a, b, c, d,...,N] = FUNCTION_CALL(), it returns a through N
   */
  private getVariableVector(): Token[] {
    const tokens: Token[] = [];
    do {
      if (this.getCurrentToken().type !== 'IDENTIFIER') {
        // TODO: this should be taken care
        // this.errors.push({
        //   message: `Expected IDENTIFIER. Got: ${this.getCurrentToken().content}`,
        //   range: this.getCurrentToken().position,
        // });
        return [];
      }
      tokens.push(this.getCurrentToken());
      const nextTokenType = this.getNextToken()?.type;
      if (nextTokenType === undefined)
        throw new Error('Unexpected undefined token. Code 30'); // TODO: handle this better
      if (nextTokenType !== 'COMMA' && nextTokenType !== 'RBRACKET') {
        this.errors.push({
          message: `Expected COMMA. Got: '${this.stringifyTokenContent(
            this.getCurrentToken(),
          )}'`,
          range: this.getCurrentPosition(),
          code: 14,
        });
        return tokens;
      }
      this.getNextToken();
      if (nextTokenType === 'RBRACKET') {
        break;
      }
    } while (
      tokens[tokens.length - 1].type !== 'RBRACKET' &&
      this.currentTokenIndex < this.tokens.length
    );
    return tokens;
  }

  /**
   * Helper that parses an expression
   * @throws error
   */
  private parseExpression(): Expression | undefined {
    const currToken = this.getCurrentToken();
    let lho: Expression | undefined;
    let isValidBinary = true;

    switch (currToken.type) {
      case 'STRING':
      case 'VECTOR':
        isValidBinary = false;
        lho = {
          type: currToken.type,
          value: currToken.content,
        };
        break;
      case 'NUMBER':
        lho = {
          type: currToken.type,
          value: currToken.content,
        };
        break;
      case 'IDENTIFIER':
        lho = this.parseFunctionCall();
        this.getPrevToken();
        break;
      case 'AT': {
        this.getNextToken();
        const args = this.getFunctionArguments();
        this.validateFnCallArgs(args);
        this.getNextToken();
        const expr = this.parseExpression();
        return {
          type: 'ANONYMOUS_FUNCTION_DEFINITION',
          value: '@',
          position: this.getCurrentPosition(currToken),
          functionData: {
            args,
          },
          RHO: expr,
        };
      }
      case 'LPARENT':
        this.getNextToken();
        lho = this.parseExpression();
        if (this.getCurrentToken().type !== 'RPARENT') {
          this.errors.push({
            message: "Expected closing parenthesis ')'",
            range: this.getCurrentPosition(),
            code: 13,
          });
          return;
        }
        break;
      case 'LBRACKET':
        // VECTOR
        return {
          type: 'VARIABLE_VECTOR',
          value: this.getVectorArgs()[0],
        };
      case 'LSQUIRLY': {
        // STRUCT
        const struct = this.parseStruct();
        if (struct === null) return;
        return {
          type: 'STRUCT',
          value: struct?.content,
        };
      }
      case 'NL':
        this.errors.push({
          message: `Unexpected new line in expression.`,
          range: this.getCurrentPosition(),
          code: ERROR_CODES.UNEXPECTED_NL,
        });
        return;
      default:
        this.errors.push({
          message: `Unexpected token. ${this.stringifyTokenContent(currToken)}`,
          range: this.getCurrentPosition(),
          code: 12,
        });
        return;
    }

    const nextToken = this.getNextToken();
    if (nextToken === undefined)
      throw new Error('Unexpected undefined token. Code 40'); // TODO: handle this error better
    if (isValidBinary && this.isBinaryOperator(nextToken.type)) {
      this.getNextToken();
      return {
        type: 'BINARY_OPERATION',
        value: nextToken?.content ?? '',
        RHO: this.parseExpression(),
        LHO: lho,
      };
    }

    return lho;
  }

  /**
   * Helper that returns weather a Token it's of type NUMBER, STRING or IDENTIFIER
   * which are commonly used
   * @args token
   * @returns boolean
   */
  private isTokenValidBasicDataType(token: Token): boolean {
    const isValid =
      token.type === 'IDENTIFIER' ||
      token.type === 'NUMBER' ||
      token.type === 'STRING';

    if (!isValid) {
      this.errors.push({
        message: `Expected a valid data type. Got ${this.stringifyTokenContent()}`,
        range: this.getCurrentPosition(),
        code: 11,
      });
    }

    return isValid;
  }

  private parseFunctionCall(): Expression {
    const currToken = this.getCurrentToken();
    if (this.getNextToken()?.type === 'LPARENT') {
      const args = this.getFunctionArguments();
      this.validateFnCallArgs(args);
      this.getNextToken();
      return {
        type: 'FUNCTION_CALL',
        value: currToken.content,
        position: this.getCurrentPosition(currToken),
        functionData: {
          args,
        },
      };
    } else {
      return {
        type: currToken.type,
        value: currToken.content,
        position: this.getCurrentPosition(currToken),
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
    if (this.getCurrentToken().type !== 'LPARENT') {
      this.errors.push({
        message: `Expected '(' for function call. Got: ${
          this.getCurrentToken().type
        }`,
        range: this.getCurrentPosition(),
        code: 10,
      });
      return tokens;
    }
    do {
      let arg: Token | null = this.skipNL(true);
      const nextToken = this.skipNL(true);
      this.getPrevToken();

      if (arg.type === 'IDENTIFIER' && nextToken.type === 'EQUALS') {
        // DEFAULT ARGUMENT
        this.getNextToken();
        const defaultValue = this.skipNL(true);
        if (!this.isTokenDataType(defaultValue)) {
          this.errors.push({
            message: `Expected a valid default value. Got ${this.stringifyTokenContent(
              defaultValue,
            )}`,
            range: this.getCurrentPosition(defaultValue),
            code: 9,
          });
        }
        tokens.push({
          type: 'DEFAULT_VALUE_ARGUMENT',
          content: arg.content,
          position: arg.position,
          defaultValue,
        });
        this.getNextToken();
        arg = null;
      } else if (arg.type === 'IDENTIFIER') {
        if (this.skipNL(true).type === 'LPARENT') {
          // TODO handle function composition
          const fnCallArgs = this.getFunctionArguments(); // just for now so it gets rid of the function call (advances the tokens)
          this.validateFnCallArgs(fnCallArgs);
        }
      } else if (arg.type === 'RPARENT') {
        // When it's a call without any arguments
        return tokens;
      } else if (arg.type === 'LBRACKET') {
        // VECTOR
        tokens.push(this.getVector(arg));
        arg = null;
      } else if (arg.type === 'LSQUIRLY') {
        // STRUCT
        const struct = this.parseStruct();
        arg = null;
        if (struct === null) return tokens;
        tokens.push(struct);
      } else if (this.isTokenValidBasicDataType(arg)) {
        this.getNextToken();
      } else {
        this.errors.push({
          message: `Expected valid argument. Got ${this.stringifyTokenContent(
            arg,
          )}`,
          range: this.getCurrentPosition(),
          code: 8,
        });
        return tokens;
      }

      if (arg !== null) {
        tokens.push(arg);
      }

      const commaOrRParen = this.skipNL();
      if (commaOrRParen.type !== 'COMMA' && commaOrRParen.type !== 'RPARENT') {
        this.errors.push({
          message: `Expected ',' or ')'. Got '${commaOrRParen.type}'`,
          range: this.getCurrentPosition(),
          code: ERROR_CODES.EXPECTED_COMMA_PAREN,
        });
        return tokens;
      }
    } while (
      this.getCurrentToken().type !== 'RPARENT' &&
      this.getCurrentToken().type !== 'EOF'
    );
    if (this.getCurrentToken().type === 'EOF') {
      this.errors.push({
        message: "Expected closing parenthesis ')' for function call",
        range: this.getCurrentPosition(),
        code: ERROR_CODES.MISSING_PAREN,
      });
      return tokens;
    }
    return tokens;
  }

  /**
   * Helper that returns the content of a token as a string
   */
  private stringifyTokenContent(token?: Token): string {
    if (token === undefined) token = this.getCurrentToken();
    if (Array.isArray(token.content))
      return `[${token.content.map((t) => t.content).join(', ')}]`;
    return token.content;
  }

  /**
   * Helper that advances to the next token that's not a NL (new line)
   * @param next if true it starts by grabbing the next token
   * TODO: maybe have a separated constant for the max of the counter ??
   */
  private skipNL(next = false): Token {
    let counter = 0;
    let tok: Token | undefined = this.getCurrentToken();
    if (next) tok = this.getNextToken();
    while (this.getCurrentToken().type === 'NL' && counter <= MAX_STATEMENTS) {
      tok = this.getNextToken();
      counter++;
    }
    this.logErrorMaxCallsReached(
      counter,
      'Found too many new lines',
      ERROR_CODES.TOO_MANY_NL,
    );
    if (tok === undefined) throw new Error('EOF was never found'); // TODO: should throw here?????
    return tok;
  }

  /**
   * Helper that returns weather a token type is a BinaryOperator
   */
  private isBinaryOperator(type: TokenType): boolean {
    return (
      type === 'SUBTRACTION' ||
      type === 'DIVISION' ||
      type === 'ADDITION' ||
      type === 'MULTIPLICATION'
    );
  }

  /**
   * Helper that returns weather the current Token it's an EOF or not
   */
  private isEOF(token?: Token): boolean {
    if (token !== null && token !== undefined) {
      return token.type === 'EOF';
    }
    return this.getCurrentToken().type === 'EOF';
  }

  /**
   * Helper that returns weather the current Token it's an
   * end or endfunction keyword
   */
  private isEndFunctionToken(token?: Token): boolean {
    if (token !== null && token !== undefined) {
      return (
        token.type === 'KEYWORD' &&
        (token.content === 'end' || token.content === 'endfunction')
      );
    }
    return (
      this.getCurrentToken().type === 'KEYWORD' &&
      (this.getCurrentToken().content === 'end' ||
        this.getCurrentToken().content === 'endfunction')
    );
  }

  /**
   * Helper that returns weather the current token or
   * a provided one is a basic data type(IDENTIFIER, STRING, DATA_VECTOR or NUMBER)
   * TODO consider structs { }
   */
  private isTokenDataType(token?: Token): boolean {
    if (token !== null && token !== undefined) {
      return (
        token.type === 'IDENTIFIER' ||
        token.type === 'VECTOR' ||
        token.type === 'STRING' ||
        token.type === 'NUMBER' ||
        token.type === 'STRUCT'
      );
    }
    return (
      this.getCurrentToken().type === 'IDENTIFIER' ||
      this.getCurrentToken().type === 'VECTOR' ||
      this.getCurrentToken().type === 'STRING' ||
      this.getCurrentToken().type === 'STRUCT' ||
      this.getCurrentToken().type === 'NUMBER'
    );
  }

  /**
   * Helper that adds the error of max statements reached
   */
  private logErrorMaxCallsReached(
    counter: number,
    message: string,
    errorCode: number,
  ): void {
    if (counter >= MAX_STATEMENTS) {
      this.errors.push({
        message,
        range: this.getCurrentPosition(),
        code: errorCode,
      });
    }
  }

  /**
   * Returns the parsed statements in the provided text
   */
  public getStatements(): Statement[] {
    return this.statements;
  }

  /**
   * Makes the Abstract Syntax Tree with the given tokens.
   * @returns Program - AST.
   */
  public makeAST(): Program {
    if (this.tokens.length < 4)
      return {
        type: 'Program',
        body: this.statements,
      };
    let statementsCounter = 0;
    do {
      const statement = this.parseStatement();
      if (statement !== null) {
        this.statements.push(statement);
      }
      statementsCounter++;
    } while (
      this.getCurrentToken().type !== 'EOF' &&
      statementsCounter < MAX_STATEMENTS
    );

    if (statementsCounter >= MAX_STATEMENTS) {
      this.errors.push({
        message: 'Maximum amount of statements reached.',
        range: this.getCurrentPosition(),
        code: ERROR_CODES.AST_MAX_STMNT_REACHED,
      });
      // throw new Error("Maximum amount of statements reached."); // TODO: should i throw???
    }

    return {
      type: 'Program',
      body: this.statements,
    };
  }

  /**
   * Helper that returns the current token position if it exists
   */
  private getCurrentPosition(token?: Token): Range {
    if (token === undefined && this.getCurrentToken() !== undefined) {
      return this.getCurrentToken().position as Range;
    } else if (token === undefined && this.getCurrentToken() === undefined) {
      return CERO_POSITION;
    } else if (token?.position !== null && token?.position !== undefined) {
      return token.position;
    }
    return CERO_POSITION;
  }

  /**
   * Returns the list of errors found during parsing.
   */
  public getErrors(): LintingError[] {
    this.errors.forEach((e) => {
      if (e?.range === undefined)
        throw new Error('Unexpected undefined Range. ' + JSON.stringify(e));
    });
    return this.errors;
  }

  /**
   * Returns the list of warnings found during parsing.
   */
  public getWarnings(): LintingWarning[] {
    return this.warnings;
  }
}
