import { IFunctionDefinition } from "../parser";

/**
 * Returns a well parsed, pretty message for a completion item.
 * @returns {string} message.
 */
export function getFunctionReferenceMessage(
  funcDef: IFunctionDefinition
): string {
  return `**${funcDef.description[0].replace(
    /([*_~`>])/g,
    "\\$1"
  )}**\n${funcDef.description
    .slice(1)
    .join("\n")
    .replace(/([*_~`>])/g, "\\$1")
    .replace(/#/g, "%")
} ${
    funcDef.uri ? `\n\n[From](${funcDef.uri})` : ""
  }`;
}
