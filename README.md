# mlang (LSP for Octave)
This is an implementation of the [Language Server Protocol](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) for the [Octave](https://octave.org/) programming language

## Features
- None yet.

## How to setup in the client
### Neovim (lua)
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

## TODO
- [ ] make tests.
- [ ] add husky (for linting before commit).
- [ ] key words completion.
- [ ] syntax checking.
- [ ] formatting.

## How to contribute?
Clone the repository and install the node dependencies with ```$ yarn```. Then modify the files in the _"src"_ folder. After you should be able to compile the server with ```$ yarn compile```
Also consider running ```$ yarn watch``` to compile after every change you make.

## Contributors
- [Tomás Vidal](https://github.com/TomiVidal99)