grammar OctaveMatlabSyntax;

// Lexer Rules
WS : [ \t\r\n]+ -> skip;
COMMENT : '%' ~[\r\n]* -> skip;
INT : [0-9]+;
FLOAT : [0-9]+ '.' [0-9]*;
STRING : '\'' ( ~'\'' | '\'\'' )* '\'';
ID : [a-zA-Z_] [a-zA-Z0-9_]*;
OP_ADD : '+';
OP_SUB : '-';
OP_MUL : '*';
OP_DIV : '/';
OP_POWER : '^';
OP_TRANSPOSE : '\'';
OP_ELEMENTWISE_MUL : '.*';
OP_ELEMENTWISE_DIV : './';
OP_ELEMENTWISE_POWER : '.^';
OP_ELEMENTWISE_LEFT_DIV : '.\\';
OP_ELEMENTWISE_RIGHT_DIV : './';
OP_ASSIGN : '=';
OP_EQUAL : '==';
OP_NOT_EQUAL : '~=';
OP_LESS_THAN : '<';
OP_LESS_THAN_OR_EQUAL : '<=';
OP_GREATER_THAN : '>';
OP_GREATER_THAN_OR_EQUAL : '>=';
OP_AND : '&';
OP_OR : '|';
OP_NOT : '~';
OP_TILDE : '~';
OP_DOT : '.';
OP_COLON : ':';
OP_COMMA : ',';

// Parser Rules
program : statement+;

statement : assignment_statement
          | expression_statement;

assignment_statement : variable OP_ASSIGN expression;

expression_statement : expression;

expression : relational_expression (OP_OR relational_expression)*;

relational_expression : additive_expression (relational_operator additive_expression)?;

additive_expression : multiplicative_expression (additive_operator multiplicative_expression)?;

multiplicative_expression : power_expression (multiplicative_operator power_expression)?;

power_expression : elementwise_expression (OP_POWER elementwise_expression)?;

elementwise_expression : transpose_expression (elementwise_operator transpose_expression)?;

transpose_expression : simple_expression (OP_TRANSPOSE)?;

simple_expression : INT
                  | FLOAT
                  | STRING
                  | variable
                  | '(' expression ')';

variable : ID
         | ID '(' argument_list? ')';

argument_list : expression (OP_COMMA expression)*;

relational_operator : OP_EQUAL
                    | OP_NOT_EQUAL
                    | OP_LESS_THAN
                    | OP_LESS_THAN_OR_EQUAL
                    | OP_GREATER_THAN
                    | OP_GREATER_THAN_OR_EQUAL;

additive_operator : OP_ADD
                  | OP_SUB;

multiplicative_operator : OP_MUL
                        | OP_DIV;

elementwise_operator : OP_ELEMENTWISE_MUL
                     | OP_ELEMENTWISE_DIV
                     | OP_ELEMENTWISE_POWER
                     | OP_ELEMENTWISE_LEFT_DIV
                     | OP_ELEMENTWISE_RIGHT_DIV;

