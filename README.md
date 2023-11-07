# mlang (LSP for Octave) - version 2.0.0

This is an implementation of the [Language Server Protocol](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) for the [Octave](https://octave.org/) programming language.

## Screenshots

![Screenshot](./mlang_screenshot.png)

## Technologies

- [Typescript](https://www.typescriptlang.org/)
- [esbuild](https://esbuild.github.io/)
- [bun](https://bun.sh/) _just for testing_
- [vscode-languageserver](https://www.npmjs.com/package/vscode-languageserver) _(LSP official node package)_

## Working features

- Completion _(some keywords, some native functions, user defined functions with default arguments (atm))_
- goToDefinition _(for user defined functions in the same file (atm))_
- goToReference
- diagnostics _(closing tags, basic typing errors)_

## How to setup in the client

### Neovim (lua)

```lua
local lspconfig = require("lspconfig")
local lspconfig_config = require("lspconfig.configs")
-- mlang
if not lspconfig_config.mlang then
local mlang_server = "path/to/server.js"
lspconfig_config.mlang = {
    default_config = {
        name = "mlang",
        cmd = { "node", mlang_server, "--stdio" },
        filetypes = { "matlab", "octave", "m" },
        root_dir = function()
            return vim.fn.getcwd()
            end,
        settings = {
            settings = {
                maxNumberOfProblems = 1000,
            },
        },
    },
}
end
```

## TODO

- [ ] ADD: STRUCTS '{}'.
- [ ] MAYBE: instead of creating new instances of Tokenizer, Parser and Visitor, reuse the same.
- [ ] FIX: 'x(1)' it's not just a function call, it could be a vector (eventually add checking that the element accessed it's valid).
- [ ] FIX: structs can be accessed inside vector outputs: '[a.x] = myFunc()'.
- [ ] FIX: add more keywords like: 'global'.
- [ ] FIX: multiple calls freezes the server.
- [ ] FIX: KEYWORDS are not native functions.
- [ ] FIX: functions with no parenthesis are not getting recognized.
- [ ] FIX: '\n' inside strings breaks the getRowsAndCols function.
- [ ] ADD: diagnostics for: redefined functions, missing imports.
- [ ] ADD: references to files.
- [ ] ADD: block comments.
- [ ] ADD: Maybe consider documentation with comments on variable as well.
- [ ] ADD: CI/CD.
- [ ] ADD: Finish refactor on error codes (for the ERROR_CODES and the throw errors).
- [ ] FEATURES?: Maybe have a user setting to be able to multiple variables and functions definitions, instead of grabbing the first one?
- [ ] FEATURES: run lines of code or code blocks (%%).

<!-- ## How to contribute? -->

<!-- Clone the repository and install the node dependencies with `$ yarn`. Then modify the files in the _"src"_ folder. After you should be able to compile the server with `$ yarn compile` -->
<!-- Also consider running `$ yarn watch` to compile after every change you make. -->

### _Reference_ or _Keyword_ not found

If a reference or a keyword it's not found and it should because it's defined by default by the language you simply add it in _'./src/data/completionKeywords.ts'_.

## Contributors

- [Tomás Vidal](https://github.com/TomiVidal99)
