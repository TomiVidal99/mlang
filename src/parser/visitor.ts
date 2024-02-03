import type { Range } from 'vscode-languageserver';
import { CERO_POSITION, ERROR_CODES } from '../constants';
import {
  type Expression,
  type Program,
  type Statement,
  type Reference,
  type Token,
  type ReferenceType,
  type Definition,
  type StatementType,
  type LintingError,
} from '../types';
import { getNataiveFunctionsList } from '../utils';
import { connection } from '../server';

export class Visitor {
  public readonly references: Reference[] = [];
  public readonly definitions: Definition[] = [];
  private readonly errors: LintingError[] = [];

  /**
   * Entry point: it extracts all the references and definitions from a Program
   */
  public visitProgram(node: Program): void {
    for (const statement of node.body) {
      this.visitStatement(statement);
    }
    this.finishHook();
  }

  /**
   * Get the errors found during visiting
   */
  public getErrors(): LintingError[] {
    return this.errors;
  }

  private visitStatement(node: Statement): void {
    if (node === undefined || node === null) return;
    switch (node.type) {
      case 'ASSIGNMENT':
        if (node.LHE === undefined) return;
        if (node.LHE.type === 'FUNCTION_DEFINITION') {
          this.visitExpression(node.LHE, 'ASSIGNMENT', node.context);
        } else {
          this.visitExpression(node.LHE, 'ASSIGNMENT', node.context);
          this.visitExpression(
            node.RHE as Expression,
            'ASSIGNMENT',
            node.context,
            false,
          );
        }
        break;
      case 'FUNCTION_DEFINITION':
        if (node.LHE === undefined) return;
        this.visitExpression(node.LHE, 'FUNCTION_DEFINITION', node.context);
        (node?.RHE as Statement[]).forEach((statement) => {
          this.visitStatement(statement);
        });
        break;
      case 'MO_ASSIGNMENT':
        if (node.LHE === undefined) return;
        this.visitExpression(node.LHE, 'MO_ASSIGNMENT', node.context);
        this.visitExpression(
          node.RHE as Expression,
          'MO_ASSIGNMENT',
          node.context,
          false,
        );
        break;
      case 'FUNCTION_CALL':
        if (node?.LHE === undefined) return;
        this.visitExpression(node.LHE, 'FUNCTION_CALL', node.context);
        break;
      case 'REFERENCE_CALL_VAR_FUNC':
        if (node?.LHE === undefined) return;
        this.visitExpression(node.LHE, 'REFERENCE_CALL_VAR_FUNC', node.context);
        break;
      case 'IF_STMNT':
      case 'DO_STMNT':
      case 'SWITCH_STMNT':
      case 'FOR_STMNT':
      case 'WHILE_STMNT':
        (node?.RHE as Statement[]).forEach((statement) => {
          this.visitStatement(statement);
        });
        break;
    }
  }

  private visitExpression(
    node: Expression,
    parentType: StatementType | null,
    context: string,
    isLHE = true,
  ): void {
    if (node === undefined || node === null) return;
    switch (node.type) {
      case 'IDENTIFIER':
        if (
          (parentType === 'ASSIGNMENT' ||
            parentType === 'FUNCTION_DEFINITION') &&
          isLHE
        ) {
          const args: Definition[] =
            parentType === 'FUNCTION_DEFINITION'
              ? (this.getNodeFunctionArgs(node)
                  .map((a) => {
                    if (
                      a.type !== 'IDENTIFIER' &&
                      a.type !== 'DEFAULT_VALUE_ARGUMENT'
                    ) {
                      return null;
                    }
                    const type =
                      a.type === 'DEFAULT_VALUE_ARGUMENT'
                        ? 'DEFAULT_ARGUMENT'
                        : 'ARGUMENT';
                    const content =
                      a.type === 'DEFAULT_VALUE_ARGUMENT'
                        ? this.getDefaultValueContent(a)
                        : '';
                    const position = this.getTokenPosition(a);
                    const def: Definition = {
                      name: a.content as string,
                      type,
                      content,
                      position,
                      documentation: '', // TODO think if i should get the documentation
                      context,
                    };
                    this.definitions.push(def);
                    return def;
                  })
                  .filter((d) => d !== null) as Definition[])
              : [];
          this.definitions.push({
            name: node.value as string,
            position: node.position ?? CERO_POSITION,
            type: parentType === 'ASSIGNMENT' ? 'VARIABLE' : 'FUNCTION',
            documentation: this.getDocumentationOrLineDefinition(node),
            arguments: args,
            context,
          });
          this.references.push({
            name: node.value as string,
            position: this.getExpressionPosition(node),
            type: parentType === 'ASSIGNMENT' ? 'VARIABLE' : 'FUNCTION',
            documentation: node?.functionData?.description ?? '',
          });
        } else if (parentType === 'FUNCTION_CALL') {
          this.references.push({
            name: node.value as string,
            position: this.getExpressionPosition(node),
            type: 'FUNCTION',
            documentation: node?.functionData?.description ?? '',
            args: this.getArgumentIdentifiersList(node)
              .map((t) => (typeof t.content === 'string' ? t.content : null))
              .filter((a) => a !== null) as string[], // TODO fix this
          });
        } else {
          this.references.push({
            name: node.value as string,
            position: this.getExpressionPosition(node),
            type: 'VARIABLE',
            documentation: node?.functionData?.description ?? '',
          });
        }
        if (node?.functionData?.args !== undefined) {
          const tokenList = this.getArgumentIdentifiersList(node);
          const ref: Reference[] = tokenList.map((arg) => {
            return {
              name: arg.content as string,
              position: this.getTokenPosition(arg),
              // type: this.getReferenceTypeFromNode(node),
              type: 'VARIABLE',
              documentation: this.getDocumentationOrLineDefinition(node),
            };
          });
          this.references.push(...ref);
        }
        if (node?.RHO !== null && Array.isArray(node.RHO)) {
          node.RHO.forEach((stmnt) => {
            this.visitStatement(stmnt);
          });
        }
        break;
      case 'BINARY_OPERATION':
        if (node?.LHO === undefined) return;
        this.visitExpression(node.LHO, null, context);
        this.visitExpression(node.RHO as Expression, null, context, false);
        break;
      case 'FUNCTION_DEFINITION':
        if (node?.LHO === undefined) return;
        this.visitExpression(
          node.LHO,
          'FUNCTION_DEFINITION',
          node.LHO.functionData?.contextCreated ?? '',
        );
        if (Array.isArray(node.RHO)) {
          node.RHO.forEach((s) => {
            this.visitStatement(s);
          });
        }
        break;
      case 'KEYWORD':
        if (node?.LHO === undefined) return;
        this.visitExpression(node.LHO, null, context);
        this.visitExpression(node.RHO as Expression, null, context, false);
        break;
      case 'ANONYMOUS_FUNCTION_DEFINITION':
        // TODO: add a user setting to configure if should consider
        // the arguments of the ANONYMOUS_FUNCTION_DEFINITION as references
        if (
          node?.LHO?.value !== undefined &&
          node?.LHO?.position !== undefined
        ) {
          this.definitions.push({
            name: node.LHO.value as string,
            position: node.LHO.position,
            type: 'ANONYMOUS_FUNCTION',
            documentation: this.getDocumentationOrLineDefinition(node),
            context,
            arguments:
              node?.functionData?.args?.map((a) => {
                return {
                  context: node?.functionData?.contextCreated ?? '',
                  name: a.content as string,
                  type: 'ARGUMENT',
                  position: this.getTokenPosition(a),
                  documentation: '', // TODO think if i should get the documentation
                };
              }) ?? [],
          });
        }
        this.references.push(
          ...(node?.functionData?.args?.map((arg) => {
            return {
              name: arg.content as string,
              position: this.getExpressionPosition(node),
              type: this.getReferenceTypeFromNode(node),
              documentation: node?.functionData?.description ?? '',
            };
          }) ?? []),
        );
        this.visitExpression(node.RHO as Expression, null, context, false);
        break;
      case 'VARIABLE_VECTOR':
        if (!Array.isArray(node.value) || !(node?.value?.length > 1)) return;
        if (node?.value !== undefined && Array.isArray(node.value)) {
          (node.value as Token[]).forEach((val) => {
            if (val.type === 'VECTOR') {
              this.getTokenIdentifiers(val).forEach((t) => {
                this.references.push({
                  name: t.content as string,
                  type: 'VARIABLE',
                  position: this.getTokenPosition(t),
                  documentation: '', // TODO: check how to add documentation here?
                });
              });
              return;
            }
            if (val.type !== 'IDENTIFIER') return;
            this.definitions.push({
              name: val.content as string,
              type: 'VARIABLE',
              position: this.getTokenPosition(val),
              documentation: this.getDocumentationOrLineDefinition(node),
              context,
            });
          });
        }
        (node.value as Token[]).forEach((token) => {
          if (token.type === 'IDENTIFIER') {
            this.references.push({
              name: token.content as string,
              position: this.getTokenPosition(token),
              type: 'VARIABLE',
              documentation: node?.functionData?.description ?? '',
            });
          }
        });
        break;
      case 'FUNCTION_CALL':
        this.references.push({
          name: node.value as string,
          position: this.getExpressionPosition(node),
          documentation: this.getDocumentationOrLineDefinition(node),
          type: 'FUNCTION',
        });
        if (node?.functionData?.args === undefined) break;
        this.references.push(
          ...this.getArgumentIdentifiersList(node).map((arg) => {
            return {
              name: arg.content as string,
              position: this.getTokenPosition(arg),
              type: 'VARIABLE' as ReferenceType,
              documentation: this.getDocumentationOrLineDefinition(node),
            };
          }),
        );
        break;
      case 'REFERENCE_CALL_VAR_FUNC':
        this.references.push({
          name: node.value as string,
          position: this.getExpressionPosition(node),
          documentation: this.getDocumentationOrLineDefinition(node),
          type: 'VARIABLE', // TODO: actually here it's impossible to know weather it's a variable or a function
        });
        break;
    }
  }

  /**
   * Helper that returns a list of Tokens from the arguments of a function call or definition
   */
  private getArgumentIdentifiersList(node: Expression): Token[] {
    if (node?.functionData?.args === undefined) return [];
    return node.functionData.args.flatMap((arg) => {
      return this.getTokenIdentifiers(arg);
    });
  }

  /**
   * Helper that returns the IDENTIFIERs from a Token.
   */
  private getTokenIdentifiers(token: Token): Token[] {
    if (token.type === 'VECTOR') {
      return (token.content as Token[]).flatMap((t) =>
        this.getTokenIdentifiers(t),
      );
    }
    if (token.type === 'IDENTIFIER' || token.type === 'DEFAULT_VALUE_ARGUMENT')
      return [token];
    return [];
  }

  /**
   * Helper that returns the positon property of a node expression
   */
  private getExpressionPosition(node: Expression): Range {
    if (node.position === undefined) {
      return CERO_POSITION;
    }
    return node.position;
  }

  /**
   * Helper that returns the position of a Token
   */
  private getTokenPosition(token: Token): Range {
    if (token.position === null) return CERO_POSITION;
    return token.position;
  }

  /**
   * Helper that returns the content of a default value in a Token
   */
  private getDefaultValueContent(token: Token): string {
    if (token?.defaultValue?.content === undefined) return '';
    if (Array.isArray(token?.defaultValue?.content)) return '';
    return token.defaultValue.content;
  }

  /**
   * Helper that returns the arguments of the function data of a node
   */
  private getNodeFunctionArgs(node: Expression): Token[] {
    if (node?.functionData?.args === undefined) return [];
    return node.functionData.args;
  }

  /**
   * Helper that returns the documentation of the function
   * or the hole line content of the variable
   */
  private getDocumentationOrLineDefinition(node: Expression): string {
    if (node?.functionData?.description !== undefined) {
      return node?.functionData?.description;
    }

    if (node?.RHO === undefined || Array.isArray(node.RHO)) return '';

    // TODO: complete this
    return '';
    // const expr = node?.RHO as Expression;
    // switch (expr.type) {
    //   case 'STRING':
    //   case 'NUMBER':
    //   case 'IDENTIFIER':
    //   case 'FUNCTION_CALL':
    //   case 'ANONYMOUS_FUNCTION_DEFINITION':
    //     return expr.value as string;
    //   case 'BINARY_OPERATION':
    //     return (
    //       (node.LHO.value as string) +
    //       this.getDocumentationOrLineDefinition(node.RHO as Expression)
    //     );
    //   default:
    //     return '';
    // }
  }

  /**
   * Helper that returns the type of a reference "CONSTANT" or "FUNCTION"
   */
  private getReferenceTypeFromNode(node: Expression): ReferenceType {
    if (
      node.type === 'FUNCTION_CALL' ||
      node.type === 'FUNCTION_DEFINITION' ||
      node.type === 'ANONYMOUS_FUNCTION_DEFINITION'
    ) {
      return 'FUNCTION';
    }
    return 'VARIABLE';
  }

  /**
   * Executed after all statements have been visited
   * TODO: consider the different scopes, right now it ignore the scopes
   */
  private finishHook(): void {
    const defsNames = this.definitions.map((d) => d.name);
    const nativeFuncList = getNataiveFunctionsList();
    const refsNames = this.references.map((r) => r.name);

    // add files to path
    this.references.forEach((ref) => {
      if (ref.name === 'addpath') {
        connection.window.showInformationMessage(JSON.stringify(ref.args));
      }
    });

    // check weather the access methods and variables are defined
    refsNames.forEach((ref, i) => {
      if (nativeFuncList.includes(ref)) {
        return;
      }
      if (!defsNames.includes(ref)) {
        this.errors.push({
          message: `Could not find reference '${ref}'`,
          code: ERROR_CODES.VISITOR_COULDNT_FIND_REF,
          range: this.references[i].position,
        });
      }
    });
  }
}
