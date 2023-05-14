import {
  Range,
  Position,
  Diagnostic,
  DiagnosticSeverity,
} from "vscode-languageserver";
import { BASIC_TYPES_REGEXS, BasicType, GRAMMAR, IToken } from "./grammar";
import {
  checkIfPathExists,
  getAllFunctionDefinitions,
  getNotFoundReferenceDiagnostic,
  getWrongArgumentsDiagnostic,
  parseMultipleMatchValues,
} from "../utils";
import { getAllFilepathsFromPath, log, logError } from "../server";
import { TextDocument } from "vscode-languageserver-textdocument";

const commentPattern = /^\s*(?!%(?:{|})|#(?:{|}))[#%%].*/;

// TODO: think better how should the end keyword and such close the opened definitions/statements

export type StatementType = "IF" | "WHILE" | "FOR" | "DO" | "FUNCTION";

export interface IReference {
  lineNumber: number;
  name: string;
}

// make a IArgumentReference
export interface IArgument {
  type: BasicType;
  start?: string;
  step?: string;
  end?: string;
  math_expr?: string;
  isOptional: boolean;
}

export interface IFunctionDefinition {
  uri?: string;
  start: Position;
  end?: Position;
  type: StatementType;
  name: string;
  arguments?: IArgument[];
  output?: string[];
  depth: number; // this indicates weather the function it's defined within another function
  description: string[];
}

export interface IFunctionReference {
  start: Position;
  end: Position;
  name: string;
  arguments?: IArgument[];
  output?: string[];
  depth: number;
}

export interface IVariableDefinition {
  depth: number;
  uri?: string;
  start: Position;
  end?: Position;
  name: string;
  content: string[];
  lineContent: string;
}

export interface ICommentBlock {
  start: Position;
  end?: Position;
}

// TODO: maybe just use an array of lines?
export interface IErrorLines {
  lineNumber: number;
}

export interface IStatements {
  depth: number;
  type: StatementType;
  start: Position;
  end?: Position;
}

export class Parser {
  private text: string;
  private functionsDefinitions: IFunctionDefinition[];
  private functionsReferences: IFunctionReference[];
  private potentialErrorLines: IErrorLines[];
  private statements: IStatements[];
  private references: IReference[];
  private variablesDefinitions: IVariableDefinition[];
  private addedPaths: string[];
  private commentBlocks: ICommentBlock[];
  private diagnostics: Diagnostic[];
  private lines: string[];
  private uri: string;

  public constructor(document: TextDocument) {
    this.uri = document.uri;
    this.text = document.getText();
    this.lines = this.text.split("\n");
    this.statements = [];
    this.functionsDefinitions = [];
    this.functionsReferences = [];
    this.commentBlocks = [];
    this.potentialErrorLines = [];
    this.references = [];
    this.addedPaths = [];
    this.variablesDefinitions = [];
    this.diagnostics = [];

    this.tokenizeText();
  }

  private visitCommentBlock({
    lineNumber,
    start,
  }: {
    match: RegExpMatchArray;
    lineNumber: number;
    start: boolean;
  }): void {
    // starts the creation of a block
    if (start) {
      const block: ICommentBlock = {
        start: Position.create(lineNumber, 0),
      };
      this.commentBlocks.push(block);
      return;
    }

    // error if closing never opened block
    if (this.commentBlocks.length === 0) {
      const diagnostic: Diagnostic = {
        range: {
          start: Position.create(lineNumber, 0),
          end: Position.create(lineNumber, 0),
        },
        message: "TypeError: need to open a comment block before closing it",
        severity: DiagnosticSeverity.Error,
      };
      this.diagnostics.push(diagnostic);
      return;
    }

    // close the block
    this.commentBlocks.forEach((block) => {
      if (!block.end) {
        block.end = Position.create(lineNumber, 0);
        return;
      }
    });
  }

  /**
   * If finds a repeated name function or variable it sends a diagnostic.
   */
  private checkRepetedDefinition(name: string, lineNumber: number): boolean {
    for (let i = 0; i < this.functionsDefinitions.length; i++) {
      const f = this.functionsDefinitions[i];
      if (f.name === name) {
        this.sendDiagnositcError(
          true,
          `the name '${name}' it's already being used to define the function at (${(
            f.start.line + 1
          ).toString()}, ${f.start.character.toString()}). at line ${lineNumber.toString()}`,
          Range.create(
            Position.create(lineNumber, 0),
            Position.create(lineNumber, 0)
          )
        );
        return true;
      }
    }
    return false;
  }

  /**
   * Converts a string into an IArgument object.
   * TODO: consider when it's a vector it should parse the data from it
   * and start, end, step should be of the type VARIABLE, NUMBER, ETC
   */
  private getArgumentFromString(arg: string): IArgument | null {
    let argument: IArgument;
    let argStr = arg;
    let isOptionalArgument = false;

    log("------------------------------");
    log("arg: " + arg);

    // check if the argument it's an optional argument
    const optionalArgumentMatch = /^\w+\s*=\s*(?<value>.+)$/.exec(arg);
    if (optionalArgumentMatch) {
      argStr = optionalArgumentMatch.groups.value;
      isOptionalArgument = true;
    }

    for (let i = 0; i < BASIC_TYPES_REGEXS.length; i++) {
      const regex = BASIC_TYPES_REGEXS[i];
      const match = regex.pattern.exec(argStr);
      if (match) {
        // log("regex: " + JSON.stringify(regex.name));
        // log("line: " + match[0]);
        argument = {
          type: regex.name,
          isOptional: isOptionalArgument,
        };
        if (regex.name === "VECTOR") {
          argument = {
            ...argument,
            start: match.groups.start,
            end: match.groups.end,
          };
          if (match.groups?.step) {
            argument.step = match.groups?.step;
          }
          if (match.groups?.math_expr) {
            argument.math_expr = match.groups?.math_expr;
          }
        }

        // log("argument: " + JSON.stringify(argument));
        return argument;
      }
    }

    return null;
  }

  private visitFunctionDefinition({
    match,
    lineNumber,
    line,
  }: {
    line: string;
    match: RegExpMatchArray;
    lineNumber: number;
  }) {
    if (
      !this.diagnoseKeywordNaming({ line, match, lineNumber }) ||
      this.checkRepetedDefinition(match.groups?.name, lineNumber)
    )
      return;

    const functionDefinition: IFunctionDefinition = {
      start: Position.create(
        lineNumber,
        match.index + match[0].indexOf(match.groups?.name)
      ),
      type: "FUNCTION",
      arguments: parseMultipleMatchValues(match.groups?.args).map((arg) =>
        this.getArgumentFromString(arg)
      ),
      output: parseMultipleMatchValues(match.groups?.retval),
      name: match.groups?.name,
      depth: this.helperGetFunctionDefinitionDepth(),
      description: this.helperGetFunctionDefinitionDescription({
        lineNumber: lineNumber,
      }),
    };

    this.functionsDefinitions.push(functionDefinition);
  }

  /**
   * Returns the commented lines after the function definition
   */
  helperGetFunctionDefinitionDescription({
    lineNumber,
  }: {
    lineNumber: number;
  }): string[] {
    const lines: string[] = [this.lines[lineNumber]];
    let currentLine = lineNumber + 1;
    while (
      this.lines.length > currentLine &&
      commentPattern.test(this.lines[currentLine])
    ) {
      lines.push(this.lines[currentLine]);
      currentLine++;
    }
    return lines;
  }

  /**
   * Handles the closing of the functions and statements defintions.
   * TODO: maybe optimize for the cases of endfunction, endfor, etc?
   * TODO: maybe when parsing the document just have one array with all the defintions
   * so i dont have to perform this ordering?
   */
  private closeDefinitions({
    lineNumber,
    match,
  }: {
    lineNumber: number;
    match: RegExpMatchArray;
  }): void {
    const orderedDefinitions = [
      ...this.functionsDefinitions,
      ...this.statements,
    ].sort((a, b) => a.start.line - b.start.line);
    for (let i = orderedDefinitions.length - 1; i >= 0; i--) {
      const currentDef = orderedDefinitions[i];
      if (
        !currentDef.end &&
        (/^\s*end\s*$/.test(match[0]) ||
          (currentDef.type === "FUNCTION" &&
            match[0].includes("endfunction")) ||
          (currentDef.type === "IF" && match[0].includes("endif")) ||
          (currentDef.type === "DO" && match[0].includes("until")) ||
          (currentDef.type === "FOR" && match[0].includes("endfor")) ||
          (currentDef.type === "WHILE" && match[0].includes("endwhile")))
      ) {
        currentDef.end = Position.create(lineNumber, 0);
        return;
      }
    }
    this.sendDiagnositcError(
      true,
      "closing never opened expression",
      Range.create(
        Position.create(lineNumber, 1),
        Position.create(lineNumber, 1)
      )
    );
  }

  private visitAnonymousFunctionDefinition({
    match,
    lineNumber,
    line,
  }: {
    line: string;
    match: RegExpMatchArray;
    lineNumber: number;
  }): void {
    // log("visitAnonymousFunctionDefinition: " + JSON.stringify(match));
    this.diagnoseKeywordNaming({ line, match, lineNumber });
    const functionDefinition: IFunctionDefinition = {
      start: Position.create(lineNumber, 0),
      end: Position.create(lineNumber, 0),
      name: match[1],
      type: "IF",
      arguments: this.checkValidFunctionArguments(
        parseMultipleMatchValues(match.groups?.retval)
      ).map((arg) => this.getArgumentFromString(arg)),
      depth: this.helperGetFunctionDefinitionDepth(),
      description: this.helperGetFunctionDefinitionDescription({
        lineNumber: lineNumber,
      }),
    };
    this.functionsDefinitions.push(functionDefinition);
  }

  /**
   * Sends a diagnostic if the provided arguments are not valid
   * TODO
   */
  private checkValidFunctionArguments(args: string[]): string[] {
    return args;
    // args.map((arg) => {
    //   if (arg)
    // });
  }

  /**
   * Returns the depth in a function definition of the current function definition.
   * If it's 0 then it means that the function it's defined at file level.
   */
  private helperGetFunctionDefinitionDepth(): number {
    if (this.functionsDefinitions.length === 0) {
      // case for a definition at file level
      return 0;
    }
    return this.functionsDefinitions.filter((d) => !d.end).length;
  }

  /**
   * Returns the depth in scope of a function reference
   * If it's 0 then it means that the function it's defined at file level.
   */
  private helperGetFunctionReferenceDepth({
    lineNumber,
  }: {
    lineNumber: number;
  }): number {
    if (this.functionsDefinitions.length === 0) {
      // case for a definition at file level
      return 0;
    }
    let foundDepthFlag = false;
    for (let i = this.functionsDefinitions.length; i > 0; i--) {
      const func = this.functionsDefinitions[i - 1];
      if (
        func.start.line < lineNumber &&
        func.end &&
        func.end.line > lineNumber
      ) {
        foundDepthFlag = true;
        return func.depth;
      }
    }
    if (!foundDepthFlag) {
      // this cases occurs when there are one or more definitions not closed with the 'end' keyword
      return -1;
    }
  }

  /**
   * Sends a diagnostics if there are any statement or loop, etc
   * that does not have it's corresponding closing keyword
   */
  checkClosingBlocks(): void {
    this.sendDiagnositcError(
      this.statements.some((def) => !def.end),
      "missing closing keyword"
    );
    this.sendDiagnositcError(
      this.functionsDefinitions.some((def) => !def.end),
      "missing closing keyword"
    );
    this.sendDiagnositcError(
      this.commentBlocks.some((block) => !block.end),
      "missing closing comment block '%} or #}'"
    );
  }

  private sendDiagnositcError(
    condition: boolean,
    message: string,
    range?: Range
  ): void {
    if (condition) {
      const endline = this.lines.length;
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: range
          ? range
          : {
            start: Position.create(endline, 0),
            end: Position.create(endline, 0),
          },
        message,
        source: "mlang",
      };
      this.diagnostics.push(diagnostic);
    }
  }

  private tokenizeText(): void {
    const lines = this.text.split("\n");
    for (let lineNumber = 1; lineNumber < lines.length + 1; lineNumber++) {
      const line = lines[lineNumber - 1];
      // ignore comments # or %
      if (commentPattern.test(line)) continue;
      for (
        let grammarIndex = 0;
        grammarIndex < GRAMMAR.length;
        grammarIndex++
      ) {
        const token = GRAMMAR[grammarIndex];
        const match = line.match(token.pattern);
        if (!match) {
          // this.potentialErrorLines.push({lineNumber: lineNumber-1});
          continue;
        }
        this.consoleOutputWarning({
          line,
          match,
          lineNumber: lineNumber - 1,
          token,
        });
        switch (token.name) {
          case "FUNCTION_DEFINITION_WITH_SINGLE_OUTPUT":
          case "FUNCTION_DEFINITION_WITH_MULTIPLE_OUTPUT":
          case "FUNCTION_DEFINITION_WITHOUT_OUTPUT":
            this.visitFunctionDefinition({
              match,
              lineNumber: lineNumber - 1,
              line,
            });
            break;
          case "ANONYMOUS_FUNCTION":
            this.visitAnonymousFunctionDefinition({
              match,
              lineNumber: lineNumber - 1,
              line,
            });
            break;
          case "FUNCTION_REFERENCE_WITHOUT_OUTPUT":
          case "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS":
          case "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT":
            this.visitFunctionReference({
              match,
              lineNumber: lineNumber - 1,
              line,
            });
            break;

          case "IF_STATEMENT_START":
            this.visitStatementStart({
              type: "IF",
              match,
              lineNumber: lineNumber - 1,
            });
            break;
          case "WHILE_STATEMENT_START":
            this.visitStatementStart({
              type: "WHILE",
              match,
              lineNumber: lineNumber - 1,
            });
            break;
          case "FOR_STATEMENT_START":
            this.visitStatementStart({
              type: "FOR",
              match,
              lineNumber: lineNumber - 1,
            });
            break;
          case "DO_STATEMENT":
            this.visitStatementStart({
              type: "DO",
              match,
              lineNumber: lineNumber - 1,
            });
            break;

          case "ELSE_STATEMENT":
          case "ELSE_IF_STATEMENT":
            // TODO: should check that elseif its after else
            this.sendDiagnositcError(
              this.statements.filter(
                (s) => !s.end && s.start.line < lineNumber - 1
              ).length === 0,
              `missing if before calling '${match[0]}' at line ${(
                lineNumber - 1
              ).toString()}`,
              Range.create(
                Position.create(lineNumber - 1, 0),
                Position.create(lineNumber - 1, 0)
              )
            );
            break;
          case "VARIABLE_DECLARATION":
            this.visitVariableDefinition({
              match,
              lineNumber: lineNumber - 1,
            });
            break;

          case "COMMON_KEYWORDS":
            break;

          case "END":
            this.closeDefinitions({ lineNumber: lineNumber - 1, match });
            break;

          case "COMMENT_BLOCK_START":
            this.visitCommentBlock({
              match,
              lineNumber: lineNumber - 1,
              start: true,
            });
            break;
          case "COMMENT_BLOCK_END":
            this.visitCommentBlock({
              match,
              lineNumber: lineNumber - 1,
              start: false,
            });
            break;

          case "REFERENCE":
            this.visitReference({ match, lineNumber: lineNumber - 1 });
            break;

          case "ANY":
            // this should be the last item in the list
            // if execute it should warn that the current line did not match any token
            // thus conclude that the line has an error
            // TODO: maybe i dont need this?
            this.potentialErrorLines.push({ lineNumber: lineNumber - 1 });
            break;
        }
        // log("matched: " + JSON.stringify(token.name));
        break;
      }
    }

    this.checkClosingBlocks();
    this.cleanUpPotentialErrorLines();
    // log(JSON.stringify(this.commentBlocks));
  }

  /**
   * Creates the variables definitions
   */
  private visitVariableDefinition({
    match,
    lineNumber,
  }: {
    match: RegExpMatchArray;
    lineNumber: number;
  }) {
    if (this.checkRepetedDefinition(match.groups?.name, lineNumber)) return;
    const def: IVariableDefinition = {
      depth: this.helperGetFunctionDefinitionDepth(),
      start: Position.create(lineNumber, 0),
      name: match.groups?.name,
      content: match.groups?.content.split(","),
      lineContent: match[0],
    };
    this.variablesDefinitions.push(def);
  }

  public getVariableDefinitions(): IVariableDefinition[] {
    return this.variablesDefinitions;
  }

  /**
   * Creates the references when an statement it's made, mainly to check if
   * the grammar it's correct.
   */
  visitStatementStart({
    type,
    lineNumber,
  }: {
    type: StatementType;
    match: RegExpMatchArray;
    lineNumber: number;
  }): void {
    const statement: IStatements = {
      depth: this.helperGetStatementDepth(),
      type,
      start: Position.create(lineNumber, 0),
    };
    this.statements.push(statement);
  }

  /**
   * Returns the depth of the current statement
   */
  private helperGetStatementDepth(): number {
    const allScopes = [...this.functionsDefinitions, ...this.statements].sort(
      (a, b) => a.start.line - b.start.line
    );

    let currentDef = 0;
    allScopes.forEach((def) => {
      if (def?.end) return;
      currentDef++;
    });

    return currentDef;
  }

  /**
   * It check that the references to function, variables and files are correct.
   */
  public validateReferences({
    uris,
    functionsDefinitions,
    variablesDefinitions,
    references,
  }: {
    uris: string[];
    functionsDefinitions: IFunctionDefinition[];
    variablesDefinitions: string[];
    references: string[];
  }): Diagnostic[] {
    // TODO: maybe add indication of possible references that matches the wrongly typed text
    // TODO: optimize this.
    const localDiagnostics: Diagnostic[] = [];
    // validate file references
    localDiagnostics.push(
      ...this.references
        .filter(
          (ref) =>
            !uris.includes(ref.name) && !variablesDefinitions.includes(ref.name)
        )
        .map((ref) => getNotFoundReferenceDiagnostic(ref.name, ref.lineNumber)),
      ...this.functionsReferences
        .filter((ref) => {
          let foundInReferencesFlag = false;
          if (references.length > 0 && references.includes(ref.name))
            foundInReferencesFlag = true;
          if (functionsDefinitions.length === 0) return !foundInReferencesFlag;
          for (let i = 0; i < functionsDefinitions.length; i++) {
            const def = functionsDefinitions[i];
            if (def.name === ref.name) {
              const defRequiredArgs = def?.arguments
                ? def.arguments.filter((arg) => !arg.isOptional).length
                : 0;
              const defOptArgs = def?.arguments
                ? def.arguments.filter((arg) => arg.isOptional).length
                : 0;
              const refArgs = ref?.arguments
                ? ref.arguments.length
                : 0;
              if (
                def?.arguments &&
                (defRequiredArgs > refArgs ||
                  defRequiredArgs + defOptArgs < refArgs)
              ) {
                localDiagnostics.push(
                  getWrongArgumentsDiagnostic({
                    defArgumentsLength: defRequiredArgs,
                    defOptionalArgsLength: defOptArgs,
                    refLineNumber: ref.start.line,
                    refArgumentsLength: refArgs,
                    name: ref.name,
                  })
                );
                log("def args: " + JSON.stringify(def.arguments));
                log("required: " + defRequiredArgs.toString() + ", opts: " + defOptArgs.toString());
              }
              return false;
            }
          }
          return !foundInReferencesFlag;
        })
        .map((ref) =>
          // log('functionsDefinitions: ' + JSON.stringify(functionsDefinitions));
          getNotFoundReferenceDiagnostic(ref.name, ref.start.line)
        )
    );

    return localDiagnostics;
  }

  private visitReference({
    match,
    lineNumber,
  }: {
    match: RegExpMatchArray;
    lineNumber: number;
  }): void {
    // log("visiting reference: " + JSON.stringify(match));
    this.references.push({
      name: match.groups?.name,
      lineNumber,
    });
  }

  // Removes the lines that are commented
  // TODO: consider comment blocks
  private cleanUpPotentialErrorLines(): void {
    this.potentialErrorLines.forEach((line) => {
      // this.commentBlocks.forEach((block) => {
      // if (
      //   block.end &&
      //   block.start.line < line.lineNumber &&
      //   block.end.line > line.lineNumber
      // ) {
      //   return;
      // }
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: Position.create(line.lineNumber, 1),
          end: Position.create(line.lineNumber, 1),
        },
        message: "syntax error?",
        source: "mlang",
      };
      this.diagnostics.push(diagnostic);
      // });
    });
  }

  /**
   * when a function reference it's met.
   */
  visitFunctionReference({
    line,
    match,
    lineNumber,
  }: {
    line: string;
    lineNumber: number;
    match: RegExpMatchArray;
  }): void {
    if (!this.diagnoseKeywordNaming({ line, match, lineNumber })) return;
    this.handleReferenceAddPath({ match, lineNumber });

    // log("visiting function reference: " + match[0]);

    const args = parseMultipleMatchValues(match.groups?.args);
    const outputs = parseMultipleMatchValues(match.groups?.retval);

    // log("args: " + JSON.stringify(args));

    const reference: IFunctionReference = {
      name: match.groups?.name,
      start: Position.create(lineNumber, match.index),
      end: Position.create(
        lineNumber,
        match.index + match[0].indexOf(match.groups?.name)
      ),
      depth: this.helperGetFunctionReferenceDepth({ lineNumber }),
    };
    if (args.length > 0) {
      reference.arguments = args.map((arg) => this.getArgumentFromString(arg));
    }
    if (outputs.length > 0) {
      reference.output = outputs;
    }

    this.functionsReferences.push(reference);
  }

  private handleReferenceAddPath({
    match,
    lineNumber,
  }: {
    match: RegExpMatchArray;
    lineNumber: number;
  }): void {
    if (match.groups?.name === "addpath") {
      // log("FOUND PATH: " + match.groups.args);
      const paths = parseMultipleMatchValues(match.groups?.args);
      paths.forEach((p) => {
        p.split(":").forEach((path) => {
          const pathExists = checkIfPathExists(path);
          // log(`does ${path} exits? ${JSON.stringify(pathExists)}`);
          if (pathExists) {
            this.addedPaths.push(path);
          }
          this.sendDiagnositcError(
            !pathExists,
            `path '${path}' could not be found`,
            Range.create(
              Position.create(lineNumber, 0),
              Position.create(lineNumber, 0)
            )
          );
        });
      });
    }
  }

  /**
   * Returns the paths referenced in the document.
   */
  public getAddedPaths(): string[] {
    return this.addedPaths.flatMap((p) => getAllFilepathsFromPath(p));
  }

  /**
   * Returns the functions references of the document
   * TODO: think on how to add arguments and return values checking and completion.
   */
  getFunctionsReferences(): IFunctionReference[] {
    return this.functionsReferences;
  }

  /**
   * TODO: this should send the diagnostics to an array to be handled later
   * Sets a diagnostic for when the line does not
   * have a ';' no output to console character
   */
  consoleOutputWarning({
    line,
    lineNumber,
    token,
  }: {
    line: string;
    lineNumber: number;
    match: RegExpMatchArray;
    token: IToken;
  }): void {
    const validTokens =
      token.name === "REFERENCE" ||
      token.name === "FUNCTION_REFERENCE_WITH_SINGLE_OUTPUT" ||
      token.name === "FUNCTION_REFERENCE_WITH_MULTIPLE_OUTPUTS" ||
      token.name === "FUNCTION_REFERENCE_WITHOUT_OUTPUT" ||
      token.name === "VARIABLE_DECLARATION" ||
      token.name === "ANONYMOUS_FUNCTION";
    if (!validTokens || line.trim() === "" || line.endsWith(";")) return;
    const range = Range.create(
      Position.create(lineNumber, line.length - 1),
      Position.create(lineNumber, line.length)
    );
    // log(`${JSON.stringify(token)}, ${JSON.stringify(match)}`);
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Information,
      range: range,
      message: "will output to console",
      source: "mlang",
      // relatedInformation: [
      // {
      //   location: {
      //     uri: formatURI(this.uri),
      //     range: range,
      //   },
      //   message: 'Spelling matters'
      // }]
    };

    this.diagnostics.push(diagnostic);
  }

  /**
   * Returns all the functions defintions for the current document
   */
  public getFunctionsDefinitions(): IFunctionDefinition[] {
    return this.functionsDefinitions.filter((def) => def.end);
  }

  public getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }

  /**
   * Checks that the keyword name it's correct.
   * @returns {boolean} - true if it's a valid name.
   */
  private diagnoseKeywordNaming({
    line,
    match,
    lineNumber,
  }: {
    line: string;
    match: RegExpMatchArray;
    lineNumber: number;
  }): boolean {
    const validNamingPattern = /^[a-zA-Z][^\s]*$/;
    const isNameValid = validNamingPattern.test(match.groups?.name);
    if (!isNameValid) {
      // sends error diagnostics
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: Position.create(lineNumber, line.indexOf(match.groups?.name)),
          end: Position.create(
            lineNumber,
            line.indexOf(match.groups?.name) + match.groups.name?.length - 1
          ),
        },
        message: "wrong naming",
        source: "mlang",
      };
      this.diagnostics.push(diagnostic);
    }
    return isNameValid;
  }

  /**
   * Returns the text splitted by '\n'
   */
  public getLines(): string[] {
    return this.lines;
  }

  /**
   * Returns variables and files referenced in the current file.
   */
  public getReferences(): IReference[] {
    return this.references;
  }

  public getCursorDepth(lineNumber: number): number {
    if (this.functionsDefinitions.length === 0) {
      // case for a definition at file level
      return 0;
    }
    if (lineNumber > this.lines.length) {
      logError(
        "ERROR: the lineNumber of the depth does not match the amount of lines"
      );
    }

    let depth = 0;
    this.functionsDefinitions.forEach((def) => {
      if (
        !def?.end ||
        (def.start.line < lineNumber && def.end.line > lineNumber)
      ) {
        depth++;
      }
    });

    return depth;
  }
}
