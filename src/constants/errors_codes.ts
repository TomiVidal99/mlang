// TODO: add the rest
export const ERROR_CODES = {
  OUTPUT_VECTOR: 1,
  EXPECTED_FN_IDENT: 2,
  AST_MAX_STMNT_REACHED: 3,
  FN_CALL_EXCEEDED_CALLS: 4,
  FN_DEF_MISSING_END: 5,
  MISSING_PAREN: 6,
  EXPECTED_COMMA_PAREN: 7,
  UNEXPECTED_NL: 50,
  TOO_MANY_NL: 60,
  STRUCT_BAD_ARGS: 140,
  STRUCT_BAD_COMMA: 141,
  MAX_ITERATION_COMMENTS_BEFORE: 2000,
  MAX_ITERATION_COMMENTS_AFTER: 2001,
  MAX_ITERATION_PARSING_COMMENT_BEFORE: 3001,
  EXPECTED_LPAREN_IF_STMNT: 4000,
  EXCEEDED_CALLS_RPAREN_IF_STMNT: 4001,
  EXPECTED_VALID_IF_STMNT: 4002,
  EXPECTED_VALID_SYMBOL_IF_STMNT: 4003,
  EXCEEDED_CALLS_PARSING_STMNTS_IF_STMNT: 4004,
  MISSING_END_IF_STMNT: 4005,
  EXPECTED_VALID_DATA_TYPE_IF_STMNT: 4006,
} as const;
