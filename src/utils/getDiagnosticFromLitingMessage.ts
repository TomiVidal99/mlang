import {
  type Diagnostic,
  DiagnosticSeverity,
} from 'vscode-languageserver/node';
import { type LintingWarning, type LintingError } from '../types';

export function getDiagnosticFromLitingMessage(
  lintingMessage: LintingError | LintingWarning,
  severity: 'error' | 'warn',
): Diagnostic {
  return {
    range: lintingMessage.range,
    message: lintingMessage.message,
    severity:
      severity === 'error'
        ? DiagnosticSeverity.Error
        : DiagnosticSeverity.Warning,
    source: 'mlang',
  };
}
