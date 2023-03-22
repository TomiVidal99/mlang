"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
const server_1 = require("./server");
// This handler provides the initial list of the completion items.
server_1.connection.onCompletion((_textDocumentPosition) => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return data_1.completionData;
    // return [
    // 	{
    // 		lbel: 'TypeScript',
    // 		kind: CompletionItemKind.Text,
    // 		data: 1
    // 	},
    // 	{
    // 		label: 'JavaScript',
    // 		kind: CompletionItemKind.Text,
    // 		data: 2
    // 	},
    //     {
    // 		label: 'function myFunction()\n\nend',
    // 		kind: CompletionItemKind.Function,
    // 		data: 3,
    // 	}
    // ];
});
// This handler resolves additional information for the item selected in
// the completion list.
server_1.connection.onCompletionResolve((item) => {
    // if (item.data === 1) {
    // 	item.detail = 'TypeScript details';
    // 	item.documentation = 'TypeScript documentation';
    // } else if (item.data === 2) {
    // 	item.detail = 'JavaScript details';
    // 	item.documentation = 'JavaScript documentation';
    // } else if (item.data === 3) {
    // 	item.detail = 'Function';
    // 	item.documentation = 'Octave function';
    // }
    return item;
});
//# sourceMappingURL=completionHandler.js.map