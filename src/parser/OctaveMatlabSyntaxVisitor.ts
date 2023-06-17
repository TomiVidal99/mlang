// Generated from ./src/parser/OctaveMatlabSyntax.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

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
 * This interface defines a complete generic visitor for a parse tree produced
 * by `OctaveMatlabSyntaxParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface OctaveMatlabSyntaxVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.program`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitProgram?: (ctx: ProgramContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.statement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStatement?: (ctx: StatementContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.assignment_statement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAssignment_statement?: (ctx: Assignment_statementContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.expression_statement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpression_statement?: (ctx: Expression_statementContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpression?: (ctx: ExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.relational_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelational_expression?: (ctx: Relational_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.additive_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAdditive_expression?: (ctx: Additive_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.multiplicative_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMultiplicative_expression?: (ctx: Multiplicative_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.power_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPower_expression?: (ctx: Power_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.elementwise_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitElementwise_expression?: (ctx: Elementwise_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.transpose_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTranspose_expression?: (ctx: Transpose_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.simple_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSimple_expression?: (ctx: Simple_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.variable`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitVariable?: (ctx: VariableContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.argument_list`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitArgument_list?: (ctx: Argument_listContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.relational_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelational_operator?: (ctx: Relational_operatorContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.additive_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAdditive_operator?: (ctx: Additive_operatorContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.multiplicative_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMultiplicative_operator?: (ctx: Multiplicative_operatorContext) => Result;

	/**
	 * Visit a parse tree produced by `OctaveMatlabSyntaxParser.elementwise_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitElementwise_operator?: (ctx: Elementwise_operatorContext) => Result;
}

