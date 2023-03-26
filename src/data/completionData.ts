import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';

export const completionData: CompletionItem[] = [
  {
    label: 'function',
    kind: CompletionItemKind.Function,
    documentation: '[Octave function](https://docs.octave.org/v4.0.1/Defining-Functions.html)'
  },
  {
    label: "abs",
    kind: CompletionItemKind.Function,
    documentation: "Return the absolute value of a number",
  },
  {
    label: "acos",
    kind: CompletionItemKind.Function,
    documentation: "Return the arccosine of a number",
  },
  {
    label: "acosh",
    kind: CompletionItemKind.Function,
    documentation: "Return the hyperbolic arccosine of a number",
  },
  {
    label: "angle",
    kind: CompletionItemKind.Function,
    documentation: "Return the angle (in radians) of a complex number",
  },
  {
    label: "arg",
    kind: CompletionItemKind.Function,
    documentation: "Return the argument (in radians) of a complex number",
  },
  {
    label: "asin",
    kind: CompletionItemKind.Function,
    documentation: "Return the arcsine of a number",
  },
  {
    label: "asinh",
    kind: CompletionItemKind.Function,
    documentation: "Return the hyperbolic arcsine of a number",
  },
  {
    label: "atan",
    kind: CompletionItemKind.Function,
    documentation: "Return the arctangent of a number",
  },
  {
    label: "atanh",
    kind: CompletionItemKind.Function,
    documentation: "Return the hyperbolic arctangent of a number",
  },
  {
    label: "ceil",
    kind: CompletionItemKind.Function,
    documentation: "Round up to the nearest integer",
  },
  {
    label: "conj",
    kind: CompletionItemKind.Function,
    documentation: "Return the complex conjugate of a number",
  },
  {
    label: "cos",
    kind: CompletionItemKind.Function,
    documentation: "Return the cosine of a number",
  },
  {
    label: "cosh",
    kind: CompletionItemKind.Function,
    documentation: "Return the hyperbolic cosine of a number",
  },
  {
    label: "cot",
    kind: CompletionItemKind.Function,
    documentation: "Return the cotangent of a number",
  },
  {
    label: "csc",
    kind: CompletionItemKind.Function,
    documentation: "Return the cosecant of a number",
  },
  {
    label: "det",
    kind: CompletionItemKind.Function,
    documentation: "Compute the determinant of a matrix",
  },
  {
    label: "diag",
    kind: CompletionItemKind.Function,
    documentation: "Extract or construct a diagonal matrix",
  },
  {
    label: "diff",
    kind: CompletionItemKind.Function,
    documentation: "Compute the difference between adjacent elements of a matrix",
  },
  {
    label: "disp",
    kind: CompletionItemKind.Function,
    documentation: "Display the value of an expression",
  },
  {
    label: "eig",
    kind: CompletionItemKind.Function,
    documentation: "Compute the eigenvalues and eigenvectors of a matrix",
  },
  {
    label: "eps",
    kind: CompletionItemKind.Constant,
    documentation: "Return the machine epsilon (smallest number representable in floating point arithmetic)",
  },
  {
    label: "erf",
    kind: CompletionItemKind.Function,
    documentation: "Return the error function of a number",
  },
  {
    label: "erfc",
    kind: CompletionItemKind.Function,
    documentation: "Return the complementary error function of a number",
  },
];
