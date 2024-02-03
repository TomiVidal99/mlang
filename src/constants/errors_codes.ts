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
  MISSING_PATH: 200,
  TOO_MANY_ARGS: 201,
  MAX_ITERATION_COMMENTS_BEFORE: 2000,
  MAX_ITERATION_COMMENTS_AFTER: 2001,
  MAX_ITERATION_PARSING_COMMENT_BEFORE: 3001,
  PARSE_ERR_STMNT: 4000,
  COULD_NOT_FIND_RPAREN_STMNT: 4001,
  MISSING_CONDITION_ELSEIF: 4002,
  MISSING_END_STMNT: 4002,
  UNEXPECTED_END_OF_STMNT: 4003,
  VISITOR_COULDNT_FIND_REF: 10000,
  UNEXPECTED_UNDEFINED_TOKEN: 20000,
} as const;
