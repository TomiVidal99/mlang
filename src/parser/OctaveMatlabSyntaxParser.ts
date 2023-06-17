// Generated from ./src/parser/OctaveMatlabSyntax.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { OctaveMatlabSyntaxListener } from "./OctaveMatlabSyntaxListener";
import { OctaveMatlabSyntaxVisitor } from "./OctaveMatlabSyntaxVisitor";


export class OctaveMatlabSyntaxParser extends Parser {
	public static readonly T__0 = 1;
	public static readonly T__1 = 2;
	public static readonly WS = 3;
	public static readonly COMMENT = 4;
	public static readonly INT = 5;
	public static readonly FLOAT = 6;
	public static readonly STRING = 7;
	public static readonly ID = 8;
	public static readonly OP_ADD = 9;
	public static readonly OP_SUB = 10;
	public static readonly OP_MUL = 11;
	public static readonly OP_DIV = 12;
	public static readonly OP_POWER = 13;
	public static readonly OP_TRANSPOSE = 14;
	public static readonly OP_ELEMENTWISE_MUL = 15;
	public static readonly OP_ELEMENTWISE_DIV = 16;
	public static readonly OP_ELEMENTWISE_POWER = 17;
	public static readonly OP_ELEMENTWISE_LEFT_DIV = 18;
	public static readonly OP_ELEMENTWISE_RIGHT_DIV = 19;
	public static readonly OP_ASSIGN = 20;
	public static readonly OP_EQUAL = 21;
	public static readonly OP_NOT_EQUAL = 22;
	public static readonly OP_LESS_THAN = 23;
	public static readonly OP_LESS_THAN_OR_EQUAL = 24;
	public static readonly OP_GREATER_THAN = 25;
	public static readonly OP_GREATER_THAN_OR_EQUAL = 26;
	public static readonly OP_AND = 27;
	public static readonly OP_OR = 28;
	public static readonly OP_NOT = 29;
	public static readonly OP_TILDE = 30;
	public static readonly OP_DOT = 31;
	public static readonly OP_COLON = 32;
	public static readonly OP_COMMA = 33;
	public static readonly RULE_program = 0;
	public static readonly RULE_statement = 1;
	public static readonly RULE_assignment_statement = 2;
	public static readonly RULE_expression_statement = 3;
	public static readonly RULE_expression = 4;
	public static readonly RULE_relational_expression = 5;
	public static readonly RULE_additive_expression = 6;
	public static readonly RULE_multiplicative_expression = 7;
	public static readonly RULE_power_expression = 8;
	public static readonly RULE_elementwise_expression = 9;
	public static readonly RULE_transpose_expression = 10;
	public static readonly RULE_simple_expression = 11;
	public static readonly RULE_variable = 12;
	public static readonly RULE_argument_list = 13;
	public static readonly RULE_relational_operator = 14;
	public static readonly RULE_additive_operator = 15;
	public static readonly RULE_multiplicative_operator = 16;
	public static readonly RULE_elementwise_operator = 17;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"program", "statement", "assignment_statement", "expression_statement", 
		"expression", "relational_expression", "additive_expression", "multiplicative_expression", 
		"power_expression", "elementwise_expression", "transpose_expression", 
		"simple_expression", "variable", "argument_list", "relational_operator", 
		"additive_operator", "multiplicative_operator", "elementwise_operator",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'('", "')'", undefined, undefined, undefined, undefined, undefined, 
		undefined, "'+'", "'-'", "'*'", "'/'", "'^'", "'''", "'.*'", undefined, 
		"'.^'", "'.\\'", undefined, "'='", "'=='", "'~='", "'<'", "'<='", "'>'", 
		"'>='", "'&'", "'|'", undefined, undefined, "'.'", "':'", "','",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, undefined, "WS", "COMMENT", "INT", "FLOAT", "STRING", 
		"ID", "OP_ADD", "OP_SUB", "OP_MUL", "OP_DIV", "OP_POWER", "OP_TRANSPOSE", 
		"OP_ELEMENTWISE_MUL", "OP_ELEMENTWISE_DIV", "OP_ELEMENTWISE_POWER", "OP_ELEMENTWISE_LEFT_DIV", 
		"OP_ELEMENTWISE_RIGHT_DIV", "OP_ASSIGN", "OP_EQUAL", "OP_NOT_EQUAL", "OP_LESS_THAN", 
		"OP_LESS_THAN_OR_EQUAL", "OP_GREATER_THAN", "OP_GREATER_THAN_OR_EQUAL", 
		"OP_AND", "OP_OR", "OP_NOT", "OP_TILDE", "OP_DOT", "OP_COLON", "OP_COMMA",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(OctaveMatlabSyntaxParser._LITERAL_NAMES, OctaveMatlabSyntaxParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return OctaveMatlabSyntaxParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "OctaveMatlabSyntax.g4"; }

	// @Override
	public get ruleNames(): string[] { return OctaveMatlabSyntaxParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return OctaveMatlabSyntaxParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(OctaveMatlabSyntaxParser._ATN, this);
	}
	// @RuleVersion(0)
	public program(): ProgramContext {
		let _localctx: ProgramContext = new ProgramContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, OctaveMatlabSyntaxParser.RULE_program);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 37;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 36;
				this.statement();
				}
				}
				this.state = 39;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << OctaveMatlabSyntaxParser.T__0) | (1 << OctaveMatlabSyntaxParser.INT) | (1 << OctaveMatlabSyntaxParser.FLOAT) | (1 << OctaveMatlabSyntaxParser.STRING) | (1 << OctaveMatlabSyntaxParser.ID))) !== 0));
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public statement(): StatementContext {
		let _localctx: StatementContext = new StatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, OctaveMatlabSyntaxParser.RULE_statement);
		try {
			this.state = 43;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 1, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 41;
				this.assignment_statement();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 42;
				this.expression_statement();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public assignment_statement(): Assignment_statementContext {
		let _localctx: Assignment_statementContext = new Assignment_statementContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, OctaveMatlabSyntaxParser.RULE_assignment_statement);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 45;
			this.variable();
			this.state = 46;
			this.match(OctaveMatlabSyntaxParser.OP_ASSIGN);
			this.state = 47;
			this.expression();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public expression_statement(): Expression_statementContext {
		let _localctx: Expression_statementContext = new Expression_statementContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, OctaveMatlabSyntaxParser.RULE_expression_statement);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 49;
			this.expression();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public expression(): ExpressionContext {
		let _localctx: ExpressionContext = new ExpressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, OctaveMatlabSyntaxParser.RULE_expression);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 51;
			this.relational_expression();
			this.state = 56;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === OctaveMatlabSyntaxParser.OP_OR) {
				{
				{
				this.state = 52;
				this.match(OctaveMatlabSyntaxParser.OP_OR);
				this.state = 53;
				this.relational_expression();
				}
				}
				this.state = 58;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public relational_expression(): Relational_expressionContext {
		let _localctx: Relational_expressionContext = new Relational_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, OctaveMatlabSyntaxParser.RULE_relational_expression);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 59;
			this.additive_expression();
			this.state = 63;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << OctaveMatlabSyntaxParser.OP_EQUAL) | (1 << OctaveMatlabSyntaxParser.OP_NOT_EQUAL) | (1 << OctaveMatlabSyntaxParser.OP_LESS_THAN) | (1 << OctaveMatlabSyntaxParser.OP_LESS_THAN_OR_EQUAL) | (1 << OctaveMatlabSyntaxParser.OP_GREATER_THAN) | (1 << OctaveMatlabSyntaxParser.OP_GREATER_THAN_OR_EQUAL))) !== 0)) {
				{
				this.state = 60;
				this.relational_operator();
				this.state = 61;
				this.additive_expression();
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public additive_expression(): Additive_expressionContext {
		let _localctx: Additive_expressionContext = new Additive_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, OctaveMatlabSyntaxParser.RULE_additive_expression);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 65;
			this.multiplicative_expression();
			this.state = 69;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === OctaveMatlabSyntaxParser.OP_ADD || _la === OctaveMatlabSyntaxParser.OP_SUB) {
				{
				this.state = 66;
				this.additive_operator();
				this.state = 67;
				this.multiplicative_expression();
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public multiplicative_expression(): Multiplicative_expressionContext {
		let _localctx: Multiplicative_expressionContext = new Multiplicative_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, OctaveMatlabSyntaxParser.RULE_multiplicative_expression);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 71;
			this.power_expression();
			this.state = 75;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === OctaveMatlabSyntaxParser.OP_MUL || _la === OctaveMatlabSyntaxParser.OP_DIV) {
				{
				this.state = 72;
				this.multiplicative_operator();
				this.state = 73;
				this.power_expression();
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public power_expression(): Power_expressionContext {
		let _localctx: Power_expressionContext = new Power_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 16, OctaveMatlabSyntaxParser.RULE_power_expression);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 77;
			this.elementwise_expression();
			this.state = 80;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === OctaveMatlabSyntaxParser.OP_POWER) {
				{
				this.state = 78;
				this.match(OctaveMatlabSyntaxParser.OP_POWER);
				this.state = 79;
				this.elementwise_expression();
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public elementwise_expression(): Elementwise_expressionContext {
		let _localctx: Elementwise_expressionContext = new Elementwise_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 18, OctaveMatlabSyntaxParser.RULE_elementwise_expression);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 82;
			this.transpose_expression();
			this.state = 86;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_MUL) | (1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_DIV) | (1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_POWER) | (1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_LEFT_DIV) | (1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_RIGHT_DIV))) !== 0)) {
				{
				this.state = 83;
				this.elementwise_operator();
				this.state = 84;
				this.transpose_expression();
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public transpose_expression(): Transpose_expressionContext {
		let _localctx: Transpose_expressionContext = new Transpose_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 20, OctaveMatlabSyntaxParser.RULE_transpose_expression);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 88;
			this.simple_expression();
			this.state = 90;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === OctaveMatlabSyntaxParser.OP_TRANSPOSE) {
				{
				this.state = 89;
				this.match(OctaveMatlabSyntaxParser.OP_TRANSPOSE);
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public simple_expression(): Simple_expressionContext {
		let _localctx: Simple_expressionContext = new Simple_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 22, OctaveMatlabSyntaxParser.RULE_simple_expression);
		try {
			this.state = 100;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case OctaveMatlabSyntaxParser.INT:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 92;
				this.match(OctaveMatlabSyntaxParser.INT);
				}
				break;
			case OctaveMatlabSyntaxParser.FLOAT:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 93;
				this.match(OctaveMatlabSyntaxParser.FLOAT);
				}
				break;
			case OctaveMatlabSyntaxParser.STRING:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 94;
				this.match(OctaveMatlabSyntaxParser.STRING);
				}
				break;
			case OctaveMatlabSyntaxParser.ID:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 95;
				this.variable();
				}
				break;
			case OctaveMatlabSyntaxParser.T__0:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 96;
				this.match(OctaveMatlabSyntaxParser.T__0);
				this.state = 97;
				this.expression();
				this.state = 98;
				this.match(OctaveMatlabSyntaxParser.T__1);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public variable(): VariableContext {
		let _localctx: VariableContext = new VariableContext(this._ctx, this.state);
		this.enterRule(_localctx, 24, OctaveMatlabSyntaxParser.RULE_variable);
		let _la: number;
		try {
			this.state = 109;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 11, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 102;
				this.match(OctaveMatlabSyntaxParser.ID);
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 103;
				this.match(OctaveMatlabSyntaxParser.ID);
				this.state = 104;
				this.match(OctaveMatlabSyntaxParser.T__0);
				this.state = 106;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << OctaveMatlabSyntaxParser.T__0) | (1 << OctaveMatlabSyntaxParser.INT) | (1 << OctaveMatlabSyntaxParser.FLOAT) | (1 << OctaveMatlabSyntaxParser.STRING) | (1 << OctaveMatlabSyntaxParser.ID))) !== 0)) {
					{
					this.state = 105;
					this.argument_list();
					}
				}

				this.state = 108;
				this.match(OctaveMatlabSyntaxParser.T__1);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public argument_list(): Argument_listContext {
		let _localctx: Argument_listContext = new Argument_listContext(this._ctx, this.state);
		this.enterRule(_localctx, 26, OctaveMatlabSyntaxParser.RULE_argument_list);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 111;
			this.expression();
			this.state = 116;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === OctaveMatlabSyntaxParser.OP_COMMA) {
				{
				{
				this.state = 112;
				this.match(OctaveMatlabSyntaxParser.OP_COMMA);
				this.state = 113;
				this.expression();
				}
				}
				this.state = 118;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public relational_operator(): Relational_operatorContext {
		let _localctx: Relational_operatorContext = new Relational_operatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 28, OctaveMatlabSyntaxParser.RULE_relational_operator);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 119;
			_la = this._input.LA(1);
			if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << OctaveMatlabSyntaxParser.OP_EQUAL) | (1 << OctaveMatlabSyntaxParser.OP_NOT_EQUAL) | (1 << OctaveMatlabSyntaxParser.OP_LESS_THAN) | (1 << OctaveMatlabSyntaxParser.OP_LESS_THAN_OR_EQUAL) | (1 << OctaveMatlabSyntaxParser.OP_GREATER_THAN) | (1 << OctaveMatlabSyntaxParser.OP_GREATER_THAN_OR_EQUAL))) !== 0))) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public additive_operator(): Additive_operatorContext {
		let _localctx: Additive_operatorContext = new Additive_operatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 30, OctaveMatlabSyntaxParser.RULE_additive_operator);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 121;
			_la = this._input.LA(1);
			if (!(_la === OctaveMatlabSyntaxParser.OP_ADD || _la === OctaveMatlabSyntaxParser.OP_SUB)) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public multiplicative_operator(): Multiplicative_operatorContext {
		let _localctx: Multiplicative_operatorContext = new Multiplicative_operatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 32, OctaveMatlabSyntaxParser.RULE_multiplicative_operator);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 123;
			_la = this._input.LA(1);
			if (!(_la === OctaveMatlabSyntaxParser.OP_MUL || _la === OctaveMatlabSyntaxParser.OP_DIV)) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public elementwise_operator(): Elementwise_operatorContext {
		let _localctx: Elementwise_operatorContext = new Elementwise_operatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 34, OctaveMatlabSyntaxParser.RULE_elementwise_operator);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 125;
			_la = this._input.LA(1);
			if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_MUL) | (1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_DIV) | (1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_POWER) | (1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_LEFT_DIV) | (1 << OctaveMatlabSyntaxParser.OP_ELEMENTWISE_RIGHT_DIV))) !== 0))) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03#\x82\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
		"\x13\t\x13\x03\x02\x06\x02(\n\x02\r\x02\x0E\x02)\x03\x03\x03\x03\x05\x03" +
		".\n\x03\x03\x04\x03\x04\x03\x04\x03\x04\x03\x05\x03\x05\x03\x06\x03\x06" +
		"\x03\x06\x07\x069\n\x06\f\x06\x0E\x06<\v\x06\x03\x07\x03\x07\x03\x07\x03" +
		"\x07\x05\x07B\n\x07\x03\b\x03\b\x03\b\x03\b\x05\bH\n\b\x03\t\x03\t\x03" +
		"\t\x03\t\x05\tN\n\t\x03\n\x03\n\x03\n\x05\nS\n\n\x03\v\x03\v\x03\v\x03" +
		"\v\x05\vY\n\v\x03\f\x03\f\x05\f]\n\f\x03\r\x03\r\x03\r\x03\r\x03\r\x03" +
		"\r\x03\r\x03\r\x05\rg\n\r\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x05\x0Em\n\x0E" +
		"\x03\x0E\x05\x0Ep\n\x0E\x03\x0F\x03\x0F\x03\x0F\x07\x0Fu\n\x0F\f\x0F\x0E" +
		"\x0Fx\v\x0F\x03\x10\x03\x10\x03\x11\x03\x11\x03\x12\x03\x12\x03\x13\x03" +
		"\x13\x03\x13\x02\x02\x02\x14\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02" +
		"\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02\x1A\x02\x1C\x02\x1E\x02" +
		" \x02\"\x02$\x02\x02\x06\x03\x02\x17\x1C\x03\x02\v\f\x03\x02\r\x0E\x03" +
		"\x02\x11\x15\x02\x7F\x02\'\x03\x02\x02\x02\x04-\x03\x02\x02\x02\x06/\x03" +
		"\x02\x02\x02\b3\x03\x02\x02\x02\n5\x03\x02\x02\x02\f=\x03\x02\x02\x02" +
		"\x0EC\x03\x02\x02\x02\x10I\x03\x02\x02\x02\x12O\x03\x02\x02\x02\x14T\x03" +
		"\x02\x02\x02\x16Z\x03\x02\x02\x02\x18f\x03\x02\x02\x02\x1Ao\x03\x02\x02" +
		"\x02\x1Cq\x03\x02\x02\x02\x1Ey\x03\x02\x02\x02 {\x03\x02\x02\x02\"}\x03" +
		"\x02\x02\x02$\x7F\x03\x02\x02\x02&(\x05\x04\x03\x02\'&\x03\x02\x02\x02" +
		"()\x03\x02\x02\x02)\'\x03\x02\x02\x02)*\x03\x02\x02\x02*\x03\x03\x02\x02" +
		"\x02+.\x05\x06\x04\x02,.\x05\b\x05\x02-+\x03\x02\x02\x02-,\x03\x02\x02" +
		"\x02.\x05\x03\x02\x02\x02/0\x05\x1A\x0E\x0201\x07\x16\x02\x0212\x05\n" +
		"\x06\x022\x07\x03\x02\x02\x0234\x05\n\x06\x024\t\x03\x02\x02\x025:\x05" +
		"\f\x07\x0267\x07\x1E\x02\x0279\x05\f\x07\x0286\x03\x02\x02\x029<\x03\x02" +
		"\x02\x02:8\x03\x02\x02\x02:;\x03\x02\x02\x02;\v\x03\x02\x02\x02<:\x03" +
		"\x02\x02\x02=A\x05\x0E\b\x02>?\x05\x1E\x10\x02?@\x05\x0E\b\x02@B\x03\x02" +
		"\x02\x02A>\x03\x02\x02\x02AB\x03\x02\x02\x02B\r\x03\x02\x02\x02CG\x05" +
		"\x10\t\x02DE\x05 \x11\x02EF\x05\x10\t\x02FH\x03\x02\x02\x02GD\x03\x02" +
		"\x02\x02GH\x03\x02\x02\x02H\x0F\x03\x02\x02\x02IM\x05\x12\n\x02JK\x05" +
		"\"\x12\x02KL\x05\x12\n\x02LN\x03\x02\x02\x02MJ\x03\x02\x02\x02MN\x03\x02" +
		"\x02\x02N\x11\x03\x02\x02\x02OR\x05\x14\v\x02PQ\x07\x0F\x02\x02QS\x05" +
		"\x14\v\x02RP\x03\x02\x02\x02RS\x03\x02\x02\x02S\x13\x03\x02\x02\x02TX" +
		"\x05\x16\f\x02UV\x05$\x13\x02VW\x05\x16\f\x02WY\x03\x02\x02\x02XU\x03" +
		"\x02\x02\x02XY\x03\x02\x02\x02Y\x15\x03\x02\x02\x02Z\\\x05\x18\r\x02[" +
		"]\x07\x10\x02\x02\\[\x03\x02\x02\x02\\]\x03\x02\x02\x02]\x17\x03\x02\x02" +
		"\x02^g\x07\x07\x02\x02_g\x07\b\x02\x02`g\x07\t\x02\x02ag\x05\x1A\x0E\x02" +
		"bc\x07\x03\x02\x02cd\x05\n\x06\x02de\x07\x04\x02\x02eg\x03\x02\x02\x02" +
		"f^\x03\x02\x02\x02f_\x03\x02\x02\x02f`\x03\x02\x02\x02fa\x03\x02\x02\x02" +
		"fb\x03\x02\x02\x02g\x19\x03\x02\x02\x02hp\x07\n\x02\x02ij\x07\n\x02\x02" +
		"jl\x07\x03\x02\x02km\x05\x1C\x0F\x02lk\x03\x02\x02\x02lm\x03\x02\x02\x02" +
		"mn\x03\x02\x02\x02np\x07\x04\x02\x02oh\x03\x02\x02\x02oi\x03\x02\x02\x02" +
		"p\x1B\x03\x02\x02\x02qv\x05\n\x06\x02rs\x07#\x02\x02su\x05\n\x06\x02t" +
		"r\x03\x02\x02\x02ux\x03\x02\x02\x02vt\x03\x02\x02\x02vw\x03\x02\x02\x02" +
		"w\x1D\x03\x02\x02\x02xv\x03\x02\x02\x02yz\t\x02\x02\x02z\x1F\x03\x02\x02" +
		"\x02{|\t\x03\x02\x02|!\x03\x02\x02\x02}~\t\x04\x02\x02~#\x03\x02\x02\x02" +
		"\x7F\x80\t\x05\x02\x02\x80%\x03\x02\x02\x02\x0F)-:AGMRX\\flov";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!OctaveMatlabSyntaxParser.__ATN) {
			OctaveMatlabSyntaxParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(OctaveMatlabSyntaxParser._serializedATN));
		}

		return OctaveMatlabSyntaxParser.__ATN;
	}

}

export class ProgramContext extends ParserRuleContext {
	public statement(): StatementContext[];
	public statement(i: number): StatementContext;
	public statement(i?: number): StatementContext | StatementContext[] {
		if (i === undefined) {
			return this.getRuleContexts(StatementContext);
		} else {
			return this.getRuleContext(i, StatementContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_program; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterProgram) {
			listener.enterProgram(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitProgram) {
			listener.exitProgram(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitProgram) {
			return visitor.visitProgram(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StatementContext extends ParserRuleContext {
	public assignment_statement(): Assignment_statementContext | undefined {
		return this.tryGetRuleContext(0, Assignment_statementContext);
	}
	public expression_statement(): Expression_statementContext | undefined {
		return this.tryGetRuleContext(0, Expression_statementContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_statement; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterStatement) {
			listener.enterStatement(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitStatement) {
			listener.exitStatement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitStatement) {
			return visitor.visitStatement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Assignment_statementContext extends ParserRuleContext {
	public variable(): VariableContext {
		return this.getRuleContext(0, VariableContext);
	}
	public OP_ASSIGN(): TerminalNode { return this.getToken(OctaveMatlabSyntaxParser.OP_ASSIGN, 0); }
	public expression(): ExpressionContext {
		return this.getRuleContext(0, ExpressionContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_assignment_statement; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterAssignment_statement) {
			listener.enterAssignment_statement(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitAssignment_statement) {
			listener.exitAssignment_statement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitAssignment_statement) {
			return visitor.visitAssignment_statement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Expression_statementContext extends ParserRuleContext {
	public expression(): ExpressionContext {
		return this.getRuleContext(0, ExpressionContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_expression_statement; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterExpression_statement) {
			listener.enterExpression_statement(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitExpression_statement) {
			listener.exitExpression_statement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitExpression_statement) {
			return visitor.visitExpression_statement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ExpressionContext extends ParserRuleContext {
	public relational_expression(): Relational_expressionContext[];
	public relational_expression(i: number): Relational_expressionContext;
	public relational_expression(i?: number): Relational_expressionContext | Relational_expressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(Relational_expressionContext);
		} else {
			return this.getRuleContext(i, Relational_expressionContext);
		}
	}
	public OP_OR(): TerminalNode[];
	public OP_OR(i: number): TerminalNode;
	public OP_OR(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(OctaveMatlabSyntaxParser.OP_OR);
		} else {
			return this.getToken(OctaveMatlabSyntaxParser.OP_OR, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_expression; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterExpression) {
			listener.enterExpression(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitExpression) {
			listener.exitExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitExpression) {
			return visitor.visitExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Relational_expressionContext extends ParserRuleContext {
	public additive_expression(): Additive_expressionContext[];
	public additive_expression(i: number): Additive_expressionContext;
	public additive_expression(i?: number): Additive_expressionContext | Additive_expressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(Additive_expressionContext);
		} else {
			return this.getRuleContext(i, Additive_expressionContext);
		}
	}
	public relational_operator(): Relational_operatorContext | undefined {
		return this.tryGetRuleContext(0, Relational_operatorContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_relational_expression; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterRelational_expression) {
			listener.enterRelational_expression(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitRelational_expression) {
			listener.exitRelational_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitRelational_expression) {
			return visitor.visitRelational_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Additive_expressionContext extends ParserRuleContext {
	public multiplicative_expression(): Multiplicative_expressionContext[];
	public multiplicative_expression(i: number): Multiplicative_expressionContext;
	public multiplicative_expression(i?: number): Multiplicative_expressionContext | Multiplicative_expressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(Multiplicative_expressionContext);
		} else {
			return this.getRuleContext(i, Multiplicative_expressionContext);
		}
	}
	public additive_operator(): Additive_operatorContext | undefined {
		return this.tryGetRuleContext(0, Additive_operatorContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_additive_expression; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterAdditive_expression) {
			listener.enterAdditive_expression(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitAdditive_expression) {
			listener.exitAdditive_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitAdditive_expression) {
			return visitor.visitAdditive_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Multiplicative_expressionContext extends ParserRuleContext {
	public power_expression(): Power_expressionContext[];
	public power_expression(i: number): Power_expressionContext;
	public power_expression(i?: number): Power_expressionContext | Power_expressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(Power_expressionContext);
		} else {
			return this.getRuleContext(i, Power_expressionContext);
		}
	}
	public multiplicative_operator(): Multiplicative_operatorContext | undefined {
		return this.tryGetRuleContext(0, Multiplicative_operatorContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_multiplicative_expression; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterMultiplicative_expression) {
			listener.enterMultiplicative_expression(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitMultiplicative_expression) {
			listener.exitMultiplicative_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitMultiplicative_expression) {
			return visitor.visitMultiplicative_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Power_expressionContext extends ParserRuleContext {
	public elementwise_expression(): Elementwise_expressionContext[];
	public elementwise_expression(i: number): Elementwise_expressionContext;
	public elementwise_expression(i?: number): Elementwise_expressionContext | Elementwise_expressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(Elementwise_expressionContext);
		} else {
			return this.getRuleContext(i, Elementwise_expressionContext);
		}
	}
	public OP_POWER(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_POWER, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_power_expression; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterPower_expression) {
			listener.enterPower_expression(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitPower_expression) {
			listener.exitPower_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitPower_expression) {
			return visitor.visitPower_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Elementwise_expressionContext extends ParserRuleContext {
	public transpose_expression(): Transpose_expressionContext[];
	public transpose_expression(i: number): Transpose_expressionContext;
	public transpose_expression(i?: number): Transpose_expressionContext | Transpose_expressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(Transpose_expressionContext);
		} else {
			return this.getRuleContext(i, Transpose_expressionContext);
		}
	}
	public elementwise_operator(): Elementwise_operatorContext | undefined {
		return this.tryGetRuleContext(0, Elementwise_operatorContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_elementwise_expression; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterElementwise_expression) {
			listener.enterElementwise_expression(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitElementwise_expression) {
			listener.exitElementwise_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitElementwise_expression) {
			return visitor.visitElementwise_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Transpose_expressionContext extends ParserRuleContext {
	public simple_expression(): Simple_expressionContext {
		return this.getRuleContext(0, Simple_expressionContext);
	}
	public OP_TRANSPOSE(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_TRANSPOSE, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_transpose_expression; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterTranspose_expression) {
			listener.enterTranspose_expression(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitTranspose_expression) {
			listener.exitTranspose_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitTranspose_expression) {
			return visitor.visitTranspose_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Simple_expressionContext extends ParserRuleContext {
	public INT(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.INT, 0); }
	public FLOAT(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.FLOAT, 0); }
	public STRING(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.STRING, 0); }
	public variable(): VariableContext | undefined {
		return this.tryGetRuleContext(0, VariableContext);
	}
	public expression(): ExpressionContext | undefined {
		return this.tryGetRuleContext(0, ExpressionContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_simple_expression; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterSimple_expression) {
			listener.enterSimple_expression(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitSimple_expression) {
			listener.exitSimple_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitSimple_expression) {
			return visitor.visitSimple_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class VariableContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(OctaveMatlabSyntaxParser.ID, 0); }
	public argument_list(): Argument_listContext | undefined {
		return this.tryGetRuleContext(0, Argument_listContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_variable; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterVariable) {
			listener.enterVariable(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitVariable) {
			listener.exitVariable(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitVariable) {
			return visitor.visitVariable(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Argument_listContext extends ParserRuleContext {
	public expression(): ExpressionContext[];
	public expression(i: number): ExpressionContext;
	public expression(i?: number): ExpressionContext | ExpressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExpressionContext);
		} else {
			return this.getRuleContext(i, ExpressionContext);
		}
	}
	public OP_COMMA(): TerminalNode[];
	public OP_COMMA(i: number): TerminalNode;
	public OP_COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(OctaveMatlabSyntaxParser.OP_COMMA);
		} else {
			return this.getToken(OctaveMatlabSyntaxParser.OP_COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_argument_list; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterArgument_list) {
			listener.enterArgument_list(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitArgument_list) {
			listener.exitArgument_list(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitArgument_list) {
			return visitor.visitArgument_list(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Relational_operatorContext extends ParserRuleContext {
	public OP_EQUAL(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_EQUAL, 0); }
	public OP_NOT_EQUAL(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_NOT_EQUAL, 0); }
	public OP_LESS_THAN(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_LESS_THAN, 0); }
	public OP_LESS_THAN_OR_EQUAL(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_LESS_THAN_OR_EQUAL, 0); }
	public OP_GREATER_THAN(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_GREATER_THAN, 0); }
	public OP_GREATER_THAN_OR_EQUAL(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_GREATER_THAN_OR_EQUAL, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_relational_operator; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterRelational_operator) {
			listener.enterRelational_operator(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitRelational_operator) {
			listener.exitRelational_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitRelational_operator) {
			return visitor.visitRelational_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Additive_operatorContext extends ParserRuleContext {
	public OP_ADD(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_ADD, 0); }
	public OP_SUB(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_SUB, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_additive_operator; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterAdditive_operator) {
			listener.enterAdditive_operator(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitAdditive_operator) {
			listener.exitAdditive_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitAdditive_operator) {
			return visitor.visitAdditive_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Multiplicative_operatorContext extends ParserRuleContext {
	public OP_MUL(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_MUL, 0); }
	public OP_DIV(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_DIV, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_multiplicative_operator; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterMultiplicative_operator) {
			listener.enterMultiplicative_operator(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitMultiplicative_operator) {
			listener.exitMultiplicative_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitMultiplicative_operator) {
			return visitor.visitMultiplicative_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Elementwise_operatorContext extends ParserRuleContext {
	public OP_ELEMENTWISE_MUL(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_ELEMENTWISE_MUL, 0); }
	public OP_ELEMENTWISE_DIV(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_ELEMENTWISE_DIV, 0); }
	public OP_ELEMENTWISE_POWER(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_ELEMENTWISE_POWER, 0); }
	public OP_ELEMENTWISE_LEFT_DIV(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_ELEMENTWISE_LEFT_DIV, 0); }
	public OP_ELEMENTWISE_RIGHT_DIV(): TerminalNode | undefined { return this.tryGetToken(OctaveMatlabSyntaxParser.OP_ELEMENTWISE_RIGHT_DIV, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return OctaveMatlabSyntaxParser.RULE_elementwise_operator; }
	// @Override
	public enterRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.enterElementwise_operator) {
			listener.enterElementwise_operator(this);
		}
	}
	// @Override
	public exitRule(listener: OctaveMatlabSyntaxListener): void {
		if (listener.exitElementwise_operator) {
			listener.exitElementwise_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: OctaveMatlabSyntaxVisitor<Result>): Result {
		if (visitor.visitElementwise_operator) {
			return visitor.visitElementwise_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


