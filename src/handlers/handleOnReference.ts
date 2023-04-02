import { HandlerResult, Location, ReferenceParams } from "vscode-languageserver";

export function handleOnReference({ params }: { params: ReferenceParams }): HandlerResult<Location[], void> {
  return null;
  // return new Promise((resolve, _reject) => { resolve(void); });
}
