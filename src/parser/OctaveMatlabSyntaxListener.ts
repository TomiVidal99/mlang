// Generated from ./src/parser/OctaveMatlabSyntax.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { ProgramContext } from "./OctaveMatlabSyntaxParser";
import { StatementContext } from "./OctaveMatlabSyntaxParser";
import { Assignment_statementContext } from "./OctaveMatlabSyntaxParser";
import { Expression_statementContext } from "./OctaveMatlabSyntaxParser";
import { ExpressionContext } from "./OctaveMatlabSyntaxParser";
import { Relational_expressionContext } from "./OctaveMatlabSyntaxParser";
import { Additive_expressionContext } from "./OctaveMatlabSyntaxParser";
import { Multiplicative_expressionContext } from "./OctaveMatlabSyntaxParser";
import { Power_expressionContext } from "./OctaveMatlabSyntaxParser";
import { Elementwise_expressionContext } from "./OctaveMatlabSyntaxParser";
import { Transpose_expressionContext } from "./OctaveMatlabSyntaxParser";
import { Simple_expressionContext } from "./OctaveMatlabSyntaxParser";
import { VariableContext } from "./OctaveMatlabSyntaxParser";
import { Argument_listContext } from "./OctaveMatlabSyntaxParser";
import { Relational_operatorContext } from "./OctaveMatlabSyntaxParser";
import { Additive_operatorContext } from "./OctaveMatlabSyntaxParser";
import { Multiplicative_operatorContext } from "./OctaveMatlabSyntaxParser";
import { Elementwise_operatorContext } from "./OctaveMatlabSyntaxParser";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `OctaveMatlabSyntaxParser`.
 */
export interface OctaveMatlabSyntaxListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.program`.
	 * @param ctx the parse tree
	 */
	enterProgram?: (ctx: ProgramContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.program`.
	 * @param ctx the parse tree
	 */
	exitProgram?: (ctx: ProgramContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.statement`.
	 * @param ctx the parse tree
	 */
	enterStatement?: (ctx: StatementContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.statement`.
	 * @param ctx the parse tree
	 */
	exitStatement?: (ctx: StatementContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.assignment_statement`.
	 * @param ctx the parse tree
	 */
	enterAssignment_statement?: (ctx: Assignment_statementContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.assignment_statement`.
	 * @param ctx the parse tree
	 */
	exitAssignment_statement?: (ctx: Assignment_statementContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.expression_statement`.
	 * @param ctx the parse tree
	 */
	enterExpression_statement?: (ctx: Expression_statementContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.expression_statement`.
	 * @param ctx the parse tree
	 */
	exitExpression_statement?: (ctx: Expression_statementContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.expression`.
	 * @param ctx the parse tree
	 */
	enterExpression?: (ctx: ExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.expression`.
	 * @param ctx the parse tree
	 */
	exitExpression?: (ctx: ExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.relational_expression`.
	 * @param ctx the parse tree
	 */
	enterRelational_expression?: (ctx: Relational_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.relational_expression`.
	 * @param ctx the parse tree
	 */
	exitRelational_expression?: (ctx: Relational_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.additive_expression`.
	 * @param ctx the parse tree
	 */
	enterAdditive_expression?: (ctx: Additive_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.additive_expression`.
	 * @param ctx the parse tree
	 */
	exitAdditive_expression?: (ctx: Additive_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.multiplicative_expression`.
	 * @param ctx the parse tree
	 */
	enterMultiplicative_expression?: (ctx: Multiplicative_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.multiplicative_expression`.
	 * @param ctx the parse tree
	 */
	exitMultiplicative_expression?: (ctx: Multiplicative_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.power_expression`.
	 * @param ctx the parse tree
	 */
	enterPower_expression?: (ctx: Power_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.power_expression`.
	 * @param ctx the parse tree
	 */
	exitPower_expression?: (ctx: Power_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.elementwise_expression`.
	 * @param ctx the parse tree
	 */
	enterElementwise_expression?: (ctx: Elementwise_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.elementwise_expression`.
	 * @param ctx the parse tree
	 */
	exitElementwise_expression?: (ctx: Elementwise_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.transpose_expression`.
	 * @param ctx the parse tree
	 */
	enterTranspose_expression?: (ctx: Transpose_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.transpose_expression`.
	 * @param ctx the parse tree
	 */
	exitTranspose_expression?: (ctx: Transpose_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.simple_expression`.
	 * @param ctx the parse tree
	 */
	enterSimple_expression?: (ctx: Simple_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.simple_expression`.
	 * @param ctx the parse tree
	 */
	exitSimple_expression?: (ctx: Simple_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.variable`.
	 * @param ctx the parse tree
	 */
	enterVariable?: (ctx: VariableContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.variable`.
	 * @param ctx the parse tree
	 */
	exitVariable?: (ctx: VariableContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.argument_list`.
	 * @param ctx the parse tree
	 */
	enterArgument_list?: (ctx: Argument_listContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.argument_list`.
	 * @param ctx the parse tree
	 */
	exitArgument_list?: (ctx: Argument_listContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.relational_operator`.
	 * @param ctx the parse tree
	 */
	enterRelational_operator?: (ctx: Relational_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.relational_operator`.
	 * @param ctx the parse tree
	 */
	exitRelational_operator?: (ctx: Relational_operatorContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.additive_operator`.
	 * @param ctx the parse tree
	 */
	enterAdditive_operator?: (ctx: Additive_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.additive_operator`.
	 * @param ctx the parse tree
	 */
	exitAdditive_operator?: (ctx: Additive_operatorContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.multiplicative_operator`.
	 * @param ctx the parse tree
	 */
	enterMultiplicative_operator?: (ctx: Multiplicative_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.multiplicative_operator`.
	 * @param ctx the parse tree
	 */
	exitMultiplicative_operator?: (ctx: Multiplicative_operatorContext) => void;

	/**
	 * Enter a parse tree produced by `OctaveMatlabSyntaxParser.elementwise_operator`.
	 * @param ctx the parse tree
	 */
	enterElementwise_operator?: (ctx: Elementwise_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `OctaveMatlabSyntaxParser.elementwise_operator`.
	 * @param ctx the parse tree
	 */
	exitElementwise_operator?: (ctx: Elementwise_operatorContext) => void;
}

