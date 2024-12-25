#include <stdlib.h>
#include <stdio.h>

#include "definitions.h"

#define DEFAULT_TOKENS_AMOUNT 1000

int tokenizer(char *text)
{
    int c_count = 0;
    char c;
    token_t tokens[DEFAULT_TOKENS_AMOUNT];
    token_t temp_token;
    int tokens_added = 0;
    int lines_jumped = 0;
    int chars_read = 0;

    while (c != EOF)
    {
        c = text[c_count];

        switch (c)
        {
        case ';':
        {
            temp_token = {
                type = SEMICOLON,
                content = ";",
                content_length = 1,
                pos_col = lines_jumped,
                pos_row = chars_read};
        }
        break;

        default:
            break;
        }

        if (tokens_added < DEFAULT_TOKENS_AMOUNT)
        {
            tokens[tokens_added] = temp_token;
            tokens_added++;
        }
        else
        {
            // TODO: should allocate more space for more tokens
            // TODO: think of a better way to do this??
        }

        c_count++;
    }

    return EXIT_SUCCESS;
}