import { randomUUID } from "crypto";
import { IKeyword } from ".";
import { IFunctionDefinition, IFunctionReference } from "../parser";

export function parseToIKeyword(data: IFunctionDefinition | IFunctionReference, uri: string): IKeyword {
  const keyword: IKeyword = {
    uri,
    range: {
      start: data.start,
      end: data.end,
    },
    id: randomUUID(),
    name: data.name,
  };
  return keyword;
}
