import { getCompletionNativeFunctions } from '../data';

export function getNataiveFunctionsList(): string[] {
  return getCompletionNativeFunctions().map((keyword) => keyword.label);
}
