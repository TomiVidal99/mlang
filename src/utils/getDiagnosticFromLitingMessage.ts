import {
  type Diagnostic,
  DiagnosticSeverity,
} from 'vscode-languageserver/node';
import { type LintingWarning, type LintingError } from '../types';
import { CERO_POSITION } from '../constants';

export function getDiagnosticFromLitingMessage(
  lintingMessage: LintingError | LintingWarning,
  severity: 'error' | 'warn',
): Diagnostic {
  return {
    range: lintingMessage?.range ?? CERO_POSITION, // TODO: think how to better handle this, because this should never happen
    message: lintingMessage.message,
    severity:
      severity === 'error'
        ? DiagnosticSeverity.Error
        : DiagnosticSeverity.Warning,
    source: 'mlang',
  };
}
