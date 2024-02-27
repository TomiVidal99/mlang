import type { Range } from 'vscode-languageserver';
import { CERO_POSITION, ERROR_CODES } from '../constants';
import {
  END_STATEMENTS,
  type BasicStatementsType,
  type Expression,
  type LintingError,
  type LintingWarning,
  type Program,
  type Statement,
  type Token,
  type TokenType,
  STATEMENTS_KEYWORDS,
} from '../types';
import { getRandomStringID } from '../utils';

const MAX_STATEMENTS_CALLS = 5000 as const; // TODO: this should be an user setting

/**
 * Takes in a list of Tokens and makes an AST
 */
export class Parser {
  private currentTokenIndex = 0;
  private readonly statements: Statement[] = [];
  private errors: LintingError[] = [];
  private warnings: LintingWarning[] = [];
  private readonly contextDepth: string[] = ['0'];
  private parsingStatement = false;
  private parsingStatementType: string | null = null; // TODO: this will fuck up things when cascating statements

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

    // TODO: consider elseif as if it were to be like an if
    if (
      this.parsingStatement &&
      this.parsingStatementType === 'if' &&
      (currToken.content === 'elseif' || currToken.content === 'else')
    ) {
      // TODO: consider a different scope when using elseif, it should be consider as
      // an entirely different statement pretty much no?
      if (currToken.content === 'elseif') {
        this.consumeStatementCondition(
          currToken.position,
          nextToken.type === 'LPARENT',
        );
        this.consumeStatementsInsideBasicStatement(currToken, 'endif');
      }
      return null;
    } else if (
      this.parsingStatement &&
      this.parsingStatementType === 'do' &&
      currToken.content === 'until'
    ) {
      this.getPrevToken();
      return null;
    }

    if (
      (typeof currToken.content === 'string' &&
        END_STATEMENTS.includes(currToken.content as any)) ||
      currToken.type === 'EOF'
    ) {
      if (!this.parsingStatement) {
        this.errors.push({
          message: `Unexpected ending of statement '${currToken.content}'`,
          code: ERROR_CODES.UNEXPECTED_END_OF_STMNT,
          range: {
            start: this.getCurrentPosition(currToken).start,
            end: this.getCurrentPosition(nextToken).start,
          },
        });
        return null;
      }
      this.getPrevToken();
      return null;
    }

    if (
      (currToken.type === 'IDENTIFIER' ||
        currToken.type === 'STRUCT_ACCESS' ||
        currToken.type === 'CELL_ARRAY_ACCESS' ||
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
    } else if (
      (currToken.type === 'IDENTIFIER' || currToken.type === 'STRUCT_ACCESS') &&
      nextToken.type === 'EQUALS'
    ) {
      // SINGLE OUTPUT ASSIGNMENT STATEMENT
      const lineContent = this.getLineContent();
      this.getNextToken();
      const RHE = this.parseExpression();
      const supressOutput = this.isOutputSupressed();
      return {
        type: 'ASSIGNMENT',
        operator: nextToken.content as string,
        supressOutput,
        context: this.getCurrentContext(),
        LHE: {
          type: currToken.type,
          value: currToken.content,
          position: this.getCurrentPosition(currToken),
          lineContent,
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
      currToken.type === 'KEYWORD' &&
      typeof currToken.content === 'string' &&
      STATEMENTS_KEYWORDS.includes(currToken.content as any)
    ) {
      switch (currToken.content) {
        case 'if':
        case 'while':
          return this.parseBasicIfStatements(currToken.content);
        case 'for':
          return this.parseForStatement(currToken);
        case 'do':
          return this.parseDoUntilStatement(currToken);
        default:
          return this.parseBasicIfStatements(currToken.content);
      }
    } else if (
      (currToken.type === 'IDENTIFIER' ||
        currToken.type === 'CELL_ARRAY_ACCESS' ||
        currToken.type === 'STRUCT_ACCESS') &&
      (nextToken.type === 'NL' || nextToken.type === 'EOF')
    ) {
      // function call or variable output
      // because this language it's so good it's impossible to know which (awsome (not really))
      // TODO: maybe get documentation?
      return {
        type: 'REFERENCE_CALL_VAR_FUNC',
        LHE: {
          type: 'REFERENCE_CALL_VAR_FUNC',
          position: this.getCurrentPosition(currToken),
          value: currToken.content,
        },
        supressOutput: false,
        context: this.getCurrentContext(),
      };
    } else if (
      currToken.type === 'IDENTIFIER' &&
      (nextToken.type === 'EOF' || this.isTokenValidBasicDataType(nextToken))
    ) {
      // FUNCTION CALL (NOT recommended way)
      // Printing outputs, single operations or function calls with arguments
      // TODO: detect comments?
      let counter = 0;
      const args: Token[] = [];
      while (
        this.getCurrentToken().type !== 'NL' &&
        this.getCurrentToken().type !== 'EOF' &&
        this.isTokenValidBasicDataType(this.getCurrentToken(), false) &&
        counter < MAX_STATEMENTS_CALLS
      ) {
        const tok = this.getNextToken();
        counter++;
        if (tok === undefined) {
          throw new Error(
            `Unexpected undefined token. Error code ${ERROR_CODES.UNEXPECTED_UNDEFINED_TOKEN}`,
          );
        }
        if (this.isTokenValidBasicDataType(tok, false)) {
          args.push(tok);
        } else if (tok.type === 'LBRACKET') {
          const vector = this.getVector();
          args.push(vector);
        }
      }
      this.logErrorMaxCallsReached(
        counter,
        'Could not parse function call',
        ERROR_CODES.FN_CALL_EXCEEDED_CALLS,
      );
      const supressOutput = this.isOutputSupressed();
      return {
        type: 'FUNCTION_CALL',
        context: this.getCurrentContext(),
        supressOutput,
        LHE: {
          type: 'FUNCTION_CALL',
          position: this.getCurrentPosition(currToken),
          value: currToken.content,
          functionData: {
            args,
          },
        },
      };
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
  }

  /**
   * Parses the do until loop statement
   * WARN: expects that the current token it's the one after the 'do' Token
   * WARN: leaves at the token after the last token of this statement
   */
  private parseDoUntilStatement(currToken: Token): Statement | null {
    this.parsingStatement = true;
    this.parsingStatementType = 'do';

    // get all statements inside do
    const [_, stmnts] = this.consumeStatementsInsideBasicStatement(
      this.getCurrentToken(),
      'until',
    );

    const startingPosition = this.getCurrentPosition();
    let hasLParent = this.getNextToken()?.type === 'LPARENT';
    if (hasLParent) this.skipNL(true);
    const cond = this.consumeStatementCondition(startingPosition, hasLParent);
    if (!cond) return null;

    return {
      type: 'DO_STMNT',
      context: this.getCurrentContext(),
      supressOutput: true,
      LHE: {
        type: 'DO_STMNT',
        value: currToken.content, // TODO: here i should get all conditions no?
        position: this.getCurrentPosition(currToken),
      },
      RHE: stmnts,
    };
  }

  /**
   * Parses the 'for' statement when this keyword it's found
   * WARN: expects that the current token it's the next after the for
   * WARN: leaves at the token after the end or 'endfor' tokens
   */
  private parseForStatement(currToken: Token): Statement | null {
    this.parsingStatement = true;
    this.parsingStatementType = 'for';
    let hasLParent = false;
    if (this.getCurrentToken().type === 'LPARENT') {
      // TODO: when it has LPARENT it could be multiple lines no?
      // maybe account for NL?
      hasLParent = true;
      this.getNextToken();
    }
    const forVarIdentifier = this.getCurrentToken();
    if (!this.isTokenValidBasicDataType(this.getCurrentToken(), true))
      return null;
    this.getNextToken();
    if (this.getCurrentToken().type !== 'EQUALS') {
      this.errors.push({
        message: 'Missing = in for loop',
        code: ERROR_CODES.MISSING_EQUALS_FOR_LOOP,
        range: {
          start: currToken.position?.start ?? CERO_POSITION.start,
          end: this.getCurrentPosition().end,
        },
      });
      this.parsingStatement = false;
      this.parsingStatementType = null;
      return null;
    }
    this.getNextToken();
    // check if it's a number range
    if (this.isValidForDataType()) {
      this.getNextToken();
      if (this.getCurrentToken().type === 'COLON') {
        this.getNextToken();
        if (!this.isValidForDataType()) {
          this.errors.push({
            message: `Unexpected '${JSON.stringify(
              this.getCurrentToken().content,
            )}' in for loop`,
            range: {
              start: currToken.position?.start ?? CERO_POSITION.start,
              end: this.getCurrentPosition()?.end ?? CERO_POSITION.end,
            },
            code: ERROR_CODES.WRONG_DATA_TYPE_FOR_LOOP,
          });
          this.parsingStatement = false;
          this.parsingStatementType = null;
          return null;
        }
        this.getNextToken();
      }
    } else {
      /// TODO: make tests for looping cell arrays, vectors and other data types
      this.parseExpression();
      this.getNextToken();
    }

    if (hasLParent) {
      if (this.getCurrentToken().type !== 'RPARENT') {
        this.errors.push({
          message: `Was expecting closing ')' in for loop`,
          code: ERROR_CODES.MISSING_END_RPAREN_FOR_LOOP,
          range: {
            start: currToken.position?.start ?? CERO_POSITION.start,
            end: this.getCurrentPosition()?.end ?? CERO_POSITION.end,
          },
        });
        this.parsingStatement = false;
        this.parsingStatementType = null;
        return null;
      }
      this.getNextToken();
    }

    // get statements inside for loop
    const stmnts = this.consumeStatementsInsideBasicStatement(
      this.getCurrentToken(),
      'endfor',
    )[1];

    this.getNextToken();

    const context = this.getIntoNewContext()[1];
    this.getBackOfContext();

    return {
      type: 'FOR_STMNT',
      supressOutput: true,
      context,
      LHE: {
        type: 'IDENTIFIER',
        value: forVarIdentifier.content,
        position: forVarIdentifier.position ?? CERO_POSITION,
      },
      RHE: stmnts,
    };
  }

  /**
   * Returns if the given Token it's of type VECTOR,
   * IDENTIFIER, NUMBER, STRUCT_ACCESS or CELL_ARRAY_ACCESS
   */
  private isValidForDataType(tok?: Token | undefined) {
    if (tok === undefined) {
      return (
        this.getCurrentToken().type === 'CELL_ARRAY_ACCESS' ||
        this.getCurrentToken().type === 'STRUCT_ACCESS' ||
        this.getCurrentToken().type === 'NUMBER' ||
        this.getCurrentToken().type === 'IDENTIFIER'
      );
    }
    return (
      tok.type === 'CELL_ARRAY_ACCESS' ||
      tok.type === 'STRUCT_ACCESS' ||
      tok.type === 'NUMBER' ||
      tok.type === 'IDENTIFIER'
    );
  }

  /**
   * Retuns the line content of the current token
   */
  private getLineContent(): string {
    const initIndex = this.currentTokenIndex;
    const prevToken = this.getPrevToken();
    const tokens: Token[] = [...(prevToken ? [prevToken] : [])];
    let counter = 0;
    let tok = this.getNextToken();
    while (tok?.type !== 'NL' && tok?.type !== 'EOF' && counter < 1000) {
      if (tok !== undefined) tokens.push(tok);
      tok = this.getNextToken();
    }
    const content = tokens
      .map((t) => this.getLiteralContentFromToken(t.content))
      .join(' ');
    this.currentTokenIndex = initIndex;
    return content;
  }

  /**
   * Helper that returns the content of the token as if
   * you were to see the literal character.
   * @returns string
   */
  private getLiteralContentFromToken(
    token: string | Token[],
    count = 0,
  ): string {
    if (count > MAX_STATEMENTS_CALLS) {
      throw new Error('Exceeded calls from getLiteralContentFromToken.');
    }
    if (typeof token === 'string') return token;
    if (token.length === 0) return '';
    return token
      .map((tok) => this.getLiteralContentFromToken(tok.content, count + 1))
      .join(' ');
  }

  /**
   * Parses an if, for, while, do, switch Statements
   * TODO: is this.parsingStatement a valid thing?
   */
  private parseBasicIfStatements(content: string): Statement | null {
    const startingToken = this.getPrevToken() as Token;
    const startingPosition = startingToken.position;
    const hasLParent = this.skipNL(true).type === 'LPARENT';
    const specialEndKeyword = content === 'do' ? 'until' : `end${content}`;
    const context = this.getIntoNewContext()[1];
    this.parsingStatement = true;
    this.parsingStatementType = content;

    let statements: Statement[] = [];
    if (content === 'do') {
      // TODO
      const [success, stmnts] = this.consumeStatementsInsideBasicStatement(
        startingToken,
        specialEndKeyword,
      );
      if (!success) return null;
      statements = stmnts;
    } else {
      // OTHER STATEMENTS (if, for, while, etc)
      if (hasLParent) this.skipNL(true);
      const cond = this.consumeStatementCondition(startingPosition, hasLParent);
      if (!cond) return null;

      // check statements inside if statement
      const [success, stmnts] = this.consumeStatementsInsideBasicStatement(
        startingToken,
        specialEndKeyword,
      );
      if (!success) return null;
      statements = stmnts;
    }

    this.getBackOfContext();
    const position: Range = {
      ...(startingPosition as Range),
      end: this.getCurrentPosition().start,
    };

    this.skipNL(true);

    let type: BasicStatementsType | undefined;
    switch (content) {
      case 'if':
        type = 'IF_STMNT';
        break;
      case 'for':
        type = 'FOR_STMNT';
        break;
      case 'while':
        type = 'WHILE_STMNT';
        break;
      case 'switch':
        type = 'SWITCH_STMNT';
        break;
      case 'do':
        type = 'DO_STMNT';
        break;
      default:
        throw new Error('Could not parse statement');
    }

    this.parsingStatement = false;
    this.parsingStatementType = null;

    return {
      type,
      supressOutput: true,
      context,
      LHE: {
        type,
        value: content, // TODO: here should maybe be all the conditions???
        position,
      },
      RHE: statements,
    };
  }

  /**
   * Consumes the tokens of the statements inside a basic statement (if, for, etc)
   * WARN: expects that the current token it's the first of the statements to be consumed
   * WARN: leaves at the token after the last of the statements being consumed
   * @returns [boolean, statements[]] - indicates if there was an error (false if error), list of the statements consumed
   */
  private consumeStatementsInsideBasicStatement(
    startingToken: Token,
    specialEndKeyword: string,
  ): [boolean, Statement[]] {
    // TODO
    const statements: Statement[] = [];
    let maxCalls = 0;
    while (
      !this.isEndStatementToken(specialEndKeyword) &&
      !this.isEOF() &&
      maxCalls < MAX_STATEMENTS_CALLS
    ) {
      const statement = this.parseStatement();
      if (statement !== null) statements.push(statement);
      maxCalls++;
    }
    if (
      this.logErrorMaxCallsReached(
        this.getCurrentToken().type === 'EOF' ? MAX_STATEMENTS_CALLS : maxCalls,
        `Could not find closing keyword 'end' or '${specialEndKeyword}'`,
        ERROR_CODES.MISSING_END_STMNT,
        startingToken,
      )
    ) {
      this.parsingStatement = false;
      this.parsingStatementType = null;
      return [false, statements];
    }
    return [true, statements];
  }

  /**
   * Consumes all the tokens of a conditions of an if, while, for, etc
   * WARN: expects that the current token it's the first of the condition
   * WARN: leaves at the token after the last one of the condition
   * @returns boolean if an error ocurred returns false
   */
  private consumeStatementCondition(
    startingPosition: Range | null,
    hasLParent: boolean,
  ): boolean {
    // gets rid of all the tokens of the condition
    let mCalls = 0;
    do {
      mCalls++;
      // TODO: think what happens when you've got a ==, IDENTIFIER EQUALS
      const expr = this.parseExpression();
      if (expr?.type === 'BINARY_OPERATION') {
        // if it's a binary operation i have to consume the other EQUALS token
        this.getNextToken();
        this.getPrevToken();
      }
      if (
        expr?.type !== 'BINARY_OPERATION' &&
        expr?.type !== 'FUNCTION_CALL' &&
        expr?.type !== 'NUMBER' &&
        expr?.type !== 'IDENTIFIER' &&
        expr?.type !== 'STRING' &&
        expr?.type !== 'STRUCT' &&
        expr?.type !== 'VECTOR' &&
        expr?.type !== 'IDENTIFIER_REFERENCE' &&
        expr?.type !== 'STRUCT_ACCESS' &&
        expr?.type !== 'CELL_ARRAY_ACCESS'
      ) {
        this.errors.push({
          message: 'Unexpected token while parsin condition',
          code: ERROR_CODES.PARSE_ERR_STMNT,
          range: {
            start: startingPosition?.start ?? CERO_POSITION.start,
            end: this.getCurrentPosition().end ?? CERO_POSITION,
          },
        });
        this.parsingStatement = false;
        this.parsingStatementType = null;
        return false;
      }
      const hasSymbols = this.checkConditionHasSymbols();
      let hasErrors = false;
      if (hasSymbols) {
        hasErrors = this.consumeEquationSymbols();
        this.skipNL(true);
        // TODO: this isTokenValidBasicDataType should be an expression parsing no?
        hasErrors = !this.isTokenValidBasicDataType(this.getCurrentToken());
      }
      if (hasLParent && hasSymbols) {
        this.skipNL(true);
      } else if (!hasLParent && hasSymbols) {
        this.getNextToken();
      }
      const [hasErrorsConcat, hasEnded] = this.consumeConditionConcatenator(
        hasLParent ? 'RPARENT' : 'NL',
      );
      this.skipNL(true);
      hasErrors = hasErrorsConcat;
      if (hasEnded) {
        break;
      }
      if (hasErrors) {
        this.parsingStatement = false;
        this.parsingStatementType = null;
        return false;
      }
    } while (
      mCalls < MAX_STATEMENTS_CALLS &&
      this.getCurrentToken().type !== 'EOF'
    );
    if (
      this.logErrorMaxCallsReached(
        mCalls,
        'Error parsing conditions',
        ERROR_CODES.PARSE_ERR_STMNT,
      )
    ) {
      this.parsingStatement = false;
      this.parsingStatementType = null;
      return false;
    }

    return true;
  }

  /**
   * Returns weather the current condition being checked has
   * comparing symbols or not, because it could be 2 casess:
   * if (myVar) or if (myVar == 1) <- with and without the symbols
   * WARN: this does not change the current token
   * @returns boolean - weather it has comparing symbols or not
   */
  private checkConditionHasSymbols(): boolean {
    switch (this.getCurrentToken().type) {
      case 'GRATER_THAN':
      case 'LESS_THAN':
      case 'EQUALS':
        return true;
      default:
        return false;
    }
  }

  /**
   * Consumes the tokens of an equation or inequality symbols
   * like: == > < >= <=
   * WARN: expects that the current token it's the first symbol
   * WARN: leaves at the Token of the last symbol
   * @returns boolean - returns true when there was an error
   */
  private consumeEquationSymbols() {
    switch (this.getCurrentToken().type) {
      case 'EQUALS':
        if (this.getNextToken()?.type !== 'EQUALS') {
          this.errors.push({
            message: `Missing '='. Got '${JSON.stringify(
              this.getCurrentToken().content,
            )}'`,
            code: ERROR_CODES.MISSING_EQUALS_STMNT,
            range: this.getCurrentPosition(),
          });
          return true;
        }
        break;
      case 'GRATER_THAN':
      case 'LESS_THAN':
        if (this.getNextToken()?.type !== 'EQUALS') {
          this.getPrevToken();
        }
        break;
      default:
        return true;
    }
    return false;
  }

  /**
   * Consumes the tokens of the condition concatenator
   * && || or )
   * WARN: expectes that the first token be the first symbol to check (& or |)
   * WARN: leaves at the Token of the last symbol
   * @returns [hasErrors, hasEnded] - [weather there was an error or not, if the condition has ended]
   */
  private consumeConditionConcatenator(
    endingTokenType: TokenType,
  ): [boolean, boolean] {
    switch (this.getCurrentToken().type) {
      case 'AND':
        if (this.getNextToken()?.type !== 'AND') return [true, false];
        break;
      case 'OR':
        if (this.getNextToken()?.type !== 'OR') return [true, false];
        break;
      case endingTokenType:
        return [false, true];
      default:
        return [true, false];
    }
    return [false, false];
  }

  /**
   * Returns true if the current token or the given token
   * it's 'end' or 'endif' or 'endfor' or 'endwhile' etc depending the case
   */
  private isEndStatementToken(
    specialendKeyword: string,
    token?: Token,
  ): boolean {
    // console.log(
    //   `checking: '${this.getCurrentContent()}, against: '${specialendKeyword}'`,
    // );
    if (token !== undefined) {
      return token.content === 'end' || token.content === specialendKeyword;
    }
    return (
      this.getCurrentToken().content === 'end' ||
      this.getCurrentToken().content === specialendKeyword
    );
  }

  /**
   * Helper that returns a 'CELL_ARRAY' Token if the grammar it's correct
   * else it returns null
   * WARN: assumes that the first token it's 'LSQUIRLY'
   * WARN: Leaves the current token to the next after the '}'
   */
  private parseCellArray(): Token | null {
    const args: Token[] = [];
    const initPos =
      this.getCurrentToken().position?.start ?? CERO_POSITION.start;
    let counter = 0;
    const firstArg = this.skipNL(true);
    if (firstArg.type === 'COLON') {
      // returns all elements of the cell array
      const rightSquirlyToken = this.skipNL(true);
      if (rightSquirlyToken.type !== 'RSQUIRLY') {
        this.errors.push({
          message: `Missing closing '}'. Got ${JSON.stringify(
            rightSquirlyToken.content,
          )}`,
          code: ERROR_CODES.CELL_ARR_BAD_MISSING_END,
          range: {
            start: initPos,
            end: rightSquirlyToken?.position?.end ?? CERO_POSITION.end,
          },
        });
        this.getNextToken();
        return null;
      }
      this.getNextToken();
      return {
        type: 'CELL_ARRAY',
        content: [firstArg],
        position: {
          start: initPos,
          end: rightSquirlyToken?.position?.end ?? CERO_POSITION.end,
        },
      };
    }
    this.getPrevTokenSkipNL();
    do {
      const arg = this.skipNL(true);
      if (arg.type === 'RSQUIRLY') break;
      if (arg !== undefined && this.isValidStructType(arg)) {
        args.push(arg);
      } else {
        return null;
      }
      const comma = this.skipNL(true);
      if (
        comma === undefined ||
        (comma.type !== 'COMMA' &&
          comma.type !== 'SEMICOLON' &&
          comma.type !== 'RSQUIRLY')
      ) {
        this.errors.push({
          message: `Unexpected struct value. Got "${
            comma?.type ?? 'UNDEFINED'
          }". Code ${ERROR_CODES.CELL_ARR_BAD_COMMA.toString()}`,
          code: ERROR_CODES.CELL_ARR_BAD_COMMA,
          range: this.getCurrentPosition(),
        });
      }
      counter++;
    } while (
      this.getCurrentToken().type !== 'RSQUIRLY' &&
      this.getCurrentToken().type !== 'EOF' &&
      this.currentTokenIndex < this.tokens.length &&
      counter < MAX_STATEMENTS_CALLS // TODO: this should be some other CONST
    );

    this.getNextToken();

    return {
      type: 'CELL_ARRAY',
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
      token.type !== 'CELL_ARRAY' &&
      token.type !== 'STRUCT'
    ) {
      this.errors.push({
        message: `Unexpected struct value. Got "${
          token.type
        }". Code ${ERROR_CODES.CELL_ARR_BAD_ARGS.toString()}`,
        code: ERROR_CODES.CELL_ARR_BAD_ARGS,
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
    this.parsingStatement = true;
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
      maxCalls < MAX_STATEMENTS_CALLS
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
    this.parsingStatement = true;
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
      maxCalls < MAX_STATEMENTS_CALLS
    ) {
      const statement = this.parseStatement();
      if (statement !== null) statements.push(statement);
      maxCalls++;
    }
    if (maxCalls >= MAX_STATEMENTS_CALLS) {
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
        maxIterations <= MAX_STATEMENTS_CALLS
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
        maxIterations <= MAX_STATEMENTS_CALLS
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
    } while (token?.type === 'NL' && counter < MAX_STATEMENTS_CALLS);

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
      case 'NATIVE_FUNCTION':
      case 'IDENTIFIER':
      case 'STRUCT_ACCESS':
        this.getNextToken();
        if (this.getCurrentToken().type === 'LPARENT') {
          lho = this.parseFunctionCall(currToken);
        } else if (this.getCurrentToken().type === 'LSQUIRLY') {
          // CELL_ARRAY access
          lho = this.parseCellArrayAccess(currToken);
        } else {
          lho = {
            type: currToken.type,
            value: currToken.content,
            position: this.getCurrentPosition(currToken),
          };
        }
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
        // CELL_ARRAY
        const struct = this.parseCellArray();
        if (struct === null) return;
        return {
          type: 'CELL_ARRAY',
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
          message: `Unexpected token. ${this.stringifyTokenContent(
            currToken,
          )}. Case ${currToken.type}`,
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
   * Returns the CELL_ARRAY_ACCESS expression
   */
  private parseCellArrayAccess(identifierToken: Token): Expression | undefined {
    const firstArg = this.skipNL(true);
    if (firstArg === undefined) return;
    if (firstArg.type === 'COLON') {
      // returns all the elements of the cell array
      const closingSquirly = this.skipNL(true);
      if (closingSquirly === undefined) {
        return;
      }
      if (closingSquirly.type !== 'RSQUIRLY') {
        this.errors.push({
          message: `Missing closing token '}'`,
          code: ERROR_CODES.CELL_ARR_ACCESS_MISSING_END,
          range: {
            start:
              this.tokens[this.currentTokenIndex - 3].position?.start ??
              CERO_POSITION.start,
            end: closingSquirly.position?.end ?? CERO_POSITION.end,
          },
        });

        this.getPrevToken();
        return;
      }
      this.getNextToken();
      return {
        type: 'CELL_ARRAY_ACCESS',
        value: [firstArg],
        position:
          this.tokens[this.currentTokenIndex - 3].position ?? CERO_POSITION,
      };
    } else {
      // parse comma separated valued
      let maxCalls = 0;
      let args: Token[] = [firstArg];
      this.getPrevTokenSkipNL();
      do {
        maxCalls++;
        this.skipNL(true);
        // TODO: here i could also have an array i should consume those tokens as well
        if (!this.isTokenValidBasicDataType(this.getCurrentToken(), false))
          break;
        args.push(this.getCurrentToken());
        this.skipNL(true);
        if (
          this.getCurrentToken().type !== 'COMMA' &&
          this.getCurrentToken().type !== 'RSQUIRLY'
        ) {
          this.errors.push({
            message: `Unexpected token '${JSON.stringify(
              this.getCurrentToken().content,
            )}'`,
            code: ERROR_CODES.CELL_ARR_ACCESS_BAD_ARGS,
            range: {
              start: identifierToken.position?.start ?? CERO_POSITION.start,
              end: this.getCurrentPosition().end,
            },
          });
        }
      } while (
        maxCalls < MAX_STATEMENTS_CALLS &&
        args[args.length - 1].type !== 'RSQUIRLY'
      );
      if (
        this.logErrorMaxCallsReached(
          maxCalls,
          "Missing '}'. Could not parse cell array access",
          ERROR_CODES.CELL_ARR_ACCESS_MISSING_END,
        )
      )
        return;
      this.getNextToken();
      return {
        type: 'CELL_ARRAY_ACCESS',
        value: args,
        position:
          this.tokens[this.currentTokenIndex - 3].position ?? CERO_POSITION,
      };
    }
  }

  /**
   * Helper that returns weather a Token it's of type NUMBER, STRING or IDENTIFIER
   * which are commonly used
   * @args token
   * @returns boolean
   */
  private isTokenValidBasicDataType(
    token: Token,
    throwError?: boolean,
  ): boolean {
    const isValid =
      token.type === 'CELL_ARRAY_ACCESS' ||
      token.type === 'STRUCT_ACCESS' ||
      token.type === 'IDENTIFIER_REFERENCE' ||
      token.type === 'IDENTIFIER' ||
      token.type === 'NUMBER' ||
      token.type === 'STRING';

    if (!isValid && (throwError === undefined || throwError === true)) {
      this.errors.push({
        message: `Expected a valid data type. Got '${this.stringifyTokenContent()}'`,
        range: this.getCurrentPosition(),
        code: 11,
      });
    }

    return isValid;
  }

  /**
   * Parses a function call
   * WARN: Its expected that the current token it's the LPARENT
   */
  private parseFunctionCall(functionNameToken: Token): Expression {
    const args = this.getFunctionArguments();
    this.validateFnCallArgs(args);
    this.getNextToken();
    return {
      type: 'FUNCTION_CALL',
      value: functionNameToken.content,
      position: this.getCurrentPosition(functionNameToken),
      functionData: {
        args,
      },
    };
  }

  /**
   * Returns the list of arguments of a function call.
   * WARN: Its expected that the current token it's the LPARENT
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
        const nextTok = this.skipNL(true);
        if (nextTok.type === 'LPARENT') {
          // TODO handle function composition
          const fnCallArgs = this.getFunctionArguments(); // just for now so it gets rid of the function call (advances the tokens)
          this.getNextToken();
          this.validateFnCallArgs(fnCallArgs);
        } else if (nextTok.type === 'LSQUIRLY') {
          // cell array access
          this.parseCellArrayAccess(arg);
        }
      } else if (arg.type === 'RPARENT') {
        // When it's a call without any arguments
        return tokens;
      } else if (arg.type === 'LBRACKET') {
        // VECTOR
        tokens.push(this.getVector(arg));
        arg = null;
      } else if (arg.type === 'LSQUIRLY') {
        // CELL_ARRAY
        const cellArr = this.parseCellArray();
        arg = null;
        if (cellArr === null) return tokens;
        tokens.push(cellArr);
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
    while (
      this.getCurrentToken().type === 'NL' &&
      counter <= MAX_STATEMENTS_CALLS
    ) {
      tok = this.getNextToken();
      counter++;
    }
    this.logErrorMaxCallsReached(
      counter,
      'Found too many new lines',
      ERROR_CODES.TOO_MANY_NL,
    );
    if (tok === undefined) {
      return this.getPrevToken() as Token;
    }
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
   * TODO: this is actually a particular scenario of this.isEndStatementToken() method
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
        token.type === 'IDENTIFIER_REFERENCE' ||
        token.type === 'CELL_ARRAY' ||
        token.type === 'STRUCT_ACCESS' ||
        token.type === 'STRUCT'
      );
    }
    return (
      this.getCurrentToken().type === 'IDENTIFIER' ||
      this.getCurrentToken().type === 'VECTOR' ||
      this.getCurrentToken().type === 'STRING' ||
      this.getCurrentToken().type === 'CELL_ARRAY' ||
      this.getCurrentToken().type === 'STRUCT_ACCESS' ||
      this.getCurrentToken().type === 'STRUCT' ||
      this.getCurrentToken().type === 'NUMBER'
    );
  }

  /**
   * Helper that adds the error of max statements reached
   * It returns weather the counter exceeded the MAX_STATEMENTS_CALLS
   * true -> code failed
   * false -> code passes
   */
  private logErrorMaxCallsReached(
    counter: number,
    message: string,
    errorCode: number,
    posToken?: Token,
  ): boolean {
    if (counter >= MAX_STATEMENTS_CALLS) {
      this.errors.push({
        message,
        range: this.getCurrentPosition(posToken),
        code: errorCode,
      });
      return true;
    }
    return false;
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
      statementsCounter < MAX_STATEMENTS_CALLS
    );

    if (statementsCounter >= MAX_STATEMENTS_CALLS) {
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
