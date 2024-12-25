#include <stdio.h>

#include "definitions.h"

int parser(token_t *tokens, int total_tokens)
{
    int i;

    for (i = 0; i < total_tokens; i++)
    {
        printf("Token: \n\tType '%d'\n\tContent: '%s'\n", tokens[i].type, tokens[i].content);
    }

    return EXIT_SUCCESS;
}