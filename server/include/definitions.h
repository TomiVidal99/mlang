#include <stdlib.h>

typedef enum
{
    COMMA = 0,
    COLON = 1,
    SEMICOLON = 2,
    L_BRACKET = 3,
    R_BRACKET = 4,
    L_PAREN = 5,
    R_PAREN = 6,
    L_BRACE = 7,
    R_BRACE = 8,
    LITERAL = 9,
    KEYWORD = 10,
    IDENTIFIER = 11,
    LINE_JMP = 12,
} token_type;

typedef struct
{
    token_type type;
    char *content;
    int content_length;
    int pos_col;
    int pos_row;
} token_t;