import { completionKeywords } from "../data";

export function getKeywordsFromCompletion(): string[] {
  return completionKeywords().map(keyword => keyword.label);
}
