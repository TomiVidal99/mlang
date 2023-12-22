import { getCompletionKeywords } from '../data';

export function getKeywordsFromCompletion(): string[] {
  return getCompletionKeywords().map((keyword) => keyword.label);
}
