import {
  type CompletionItem,
  CompletionItemKind,
  MarkupKind,
} from 'vscode-languageserver';

export const completionNativeFunctions: CompletionItem[] = [
  {
    label: 'quad',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        ': q = quad (f, a, b)\n: q = quad (f, a, b, tol)\n: q = quad (f, a, b, tol, sing)\n: [q, ier, nfun, err] = quad (…)\n    Numerically evaluate the integral of f from a to b using Fortran routines from QUADPACK.\n    f is a function handle, inline function, or a string containing the name of the function to evaluate. The function must have the form y = f (x) where y and x are scalars.\n    a and b are the lower and upper limits of integration. Either or both may be infinite.\n    The optional argument tol is a vector that specifies the desired accuracy of the result. The first element of the vector is the desired absolute tolerance, and the second element is the desired relative tolerance. To choose a relative test only, set the absolute tolerance to zero. To choose an absolute test only, set the relative tolerance to zero. Both tolerances default to sqrt (eps) or approximately 1.5e^{-8}.\n    The optional argument sing is a vector of values at which the integrand is known to be singular.\n    The result of the integration is returned in q.\n    ier contains an integer error code (0 indicates a successful integration).\n    nfun indicates the number of function evaluations that were made.\n    err contains an estimate of the error in the solution.\n    The function quad_options can set other optional parameters for quad.\n    Note: because quad is written in Fortran it cannot be called recursively. This prevents its use in integrating over more than one variable by routines dblquad and triplequad.\n    See also: quad_options, quadv, quadl, quadgk, quadcc, trapz, dblquad, triplequad. \n\n[quad function](https://octave.sourceforge.io/octave/function/quad.html)',
    },
  },
  {
    label: 'inputParser',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        'Not documented \n\n[inputParser function](https://octave.sourceforge.io/octave/function/inputParser.html)',
    },
  },
  {
    label: 'pol2cart',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        ' __[x, y] = pol2cart (theta, r)__\n __[x, y, z] = pol2cart (theta, r, z)__\n __[x, y] = pol2cart (P)__\n __[x, y, z] = pol2cart (P)__\n __C = pol2cart (…)__\n    Transform polar or cylindrical coordinates to Cartesian coordinates.\n    The inputs theta, r, (and z) must be the same shape, or scalar. If called with a single matrix argument then each row of P represents the polar/(cylindrical) coordinate (theta, r (, z)).\n    theta describes the angle relative to the positive x-axis.\n    r is the distance to the z-axis (0, 0, z).\n    If only a single return argument is requested then return a matrix C where each row represents one Cartesian coordinate (x, y (, z)).\n    See also: cart2pol, sph2cart, cart2sph. \n\n[pol2cart function](https://octave.sourceforge.io/octave/function/pol2cart.html)',
    },
  },
  {
    label: 'deg2rad',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        ' __rad = deg2rad (deg)__\n    Convert degrees to radians.\n    The input deg must be a scalar, vector, or N-dimensional array of double or single floating point values. deg may be complex in which case the real and imaginary components are converted separately.\n    The output rad is the same size and shape as deg with degrees converted to radians using the conversion constant pi/180.\n    Example:\n    deg2rad ([0, 90, 180, 270, 360])\n      ⇒  0.00000   1.57080   3.14159   4.71239   6.28319\n    See also: rad2deg. \n\n[deg2rad function](https://octave.sourceforge.io/octave/function/deg2rad.html)',
    },
  },
  {
    label: 'length',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        ' __length (a)__\n    Return the length of the object a.\n    The length is 0 for empty objects, 1 for scalars, and the number of elements for vectors. For matrix or N-dimensional objects, the length is the number of elements along the largest dimension (equivalent to max (size (a))).\n    See also: numel, size. \n\n[length function](https://octave.sourceforge.io/octave/function/length.html)',
    },
  },
  {
    label: 'struct',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '  __s = struct ()__\n __s = struct (field1, value1, field2, value2, …)__\n __s = struct (obj)__\n    Create a scalar or array structure and initialize its values.\n    The field1, field2, … variables are strings specifying the names of the fields and the value1, value2, … variables can be of any type.\n    If the values are cell arrays, create a structure array and initialize its values. The dimensions of each cell array of values must match. Singleton cells and non-cell values are repeated so that they fill the entire array. If the cells are empty, create an empty structure array with the specified field names.\n    If the argument is an object, return the underlying struct.\n    Observe that the syntax is optimized for struct arrays. Consider the following examples:\n    struct ("foo", 1)\n     ⇒ scalar structure containing the fields:\n       foo =  1\n    struct ("foo", {})\n     ⇒ 0x0 struct array containing the fields:\n       foo\n    struct ("foo", { {} })\n     ⇒ scalar structure containing the fields:\n       foo = {}(0x0)\n    struct ("foo", {1, 2, 3})\n     ⇒ 1x3 struct array containing the fields:\n       foo\n    The first case is an ordinary scalar struct—one field, one value. The second produces an empty struct array with one field and no values, since being passed an empty cell array of struct array values. When the value is a cell array containing a single entry, this becomes a scalar struct with that single entry as the value of the field. That single entry happens to be an empty cell array.\n    Finally, if the value is a non-scalar cell array, then struct produces a struct array.\n    See also: cell2struct, fieldnames, getfield, setfield, rmfield, isfield, orderfields, isstruct, structfun. \n\n[struct function](https://octave.sourceforge.io/octave/function/struct.html)',
    },
  },
  {
    label: 'addpath',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        ' __addpath (dir1, …)__\n __addpath (dir1, …, option)__\n    Add named directories to the function search path.\n    If option is "-begin" or 0 (the default), prepend the directory name to the current path. If option is "-end" or 1, append the directory name to the current path. Directories added to the path must exist.\n    In addition to accepting individual directory arguments, lists of directory names separated by pathsep are also accepted. For example:\n    addpath ("dir1:/dir2:~/dir3")\n    For each directory that is added, and that was not already in the path, addpath checks for the existence of a file named PKG_ADD (note lack of .m extension) and runs it if it exists.\n    See also: path, rmpath, genpath, pathdef, savepath, pathsep. \n\n[addpath function](https://octave.sourceforge.io/octave/function/addpath.html)',
    },
  },
  {
    label: 'argv',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        'Return the command line arguments passed to Octave.\n\nFor example, if you invoked Octave using the command\n\noctave --no-line-editing --silent\n\nargv would return a cell array of strings with the elements --no-line-editing and --silent.\n\nIf you write an executable Octave script, argv will return the list of arguments passed to the script. See ‘Executable Octave Programs’, for an example of how to create an executable Octave script.\n\n[argv function](https://octave.sourceforge.io/octave/function/argv.html)',
    },
  },
  {
    label: 'hold',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[hold function](https://octave.sourceforge.io/octave/function/hold.html)',
    },
  },
  {
    label: 'axis',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[axis function](https://octave.sourceforge.io/octave/function/axis.html)',
    },
  },
  {
    label: 'printf',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[printf function](https://octave.sourceforge.io/octave/function/printf.html)',
    },
  },
  {
    label: 'figure',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[figure function](https://octave.sourceforge.io/octave/function/figure.html)',
    },
  },
  {
    label: 'set',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[set function](https://octave.sourceforge.io/octave/function/set.html)',
    },
  },
  {
    label: 'grid',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[grid function](https://octave.sourceforge.io/octave/function/grid.html)',
    },
  },
  {
    label: 'clc',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[clc function](https://octave.sourceforge.io/octave/function/clc.html)',
    },
  },
  {
    label: 'quit',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[quit function](https://docs.octave.org/interpreter/Quitting-Octave.html)',
    },
  },
  {
    label: 'help',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[help function](https://octave.sourceforge.io/octave/function/help.html)',
    },
  },
  {
    label: 'stem',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[stem function](https://octave.sourceforge.io/octave/function/stem.html)',
    },
  },
  {
    label: 'plot',
    kind: CompletionItemKind.Function,
    documentation: {
      kind: MarkupKind.Markdown,
      value:
        '[plot function](https://octave.sourceforge.io/octave/function/plot.html)',
    },
  },
  {
    label: 'abs',
    kind: CompletionItemKind.Function,
    documentation: 'Return the absolute value of a number',
  },
  {
    label: 'acos',
    kind: CompletionItemKind.Function,
    documentation: 'Return the arccosine of a number',
  },
  {
    label: 'acosh',
    kind: CompletionItemKind.Function,
    documentation: 'Return the hyperbolic arccosine of a number',
  },
  {
    label: 'angle',
    kind: CompletionItemKind.Function,
    documentation: 'Return the angle (in radians) of a complex number',
  },
  {
    label: 'arg',
    kind: CompletionItemKind.Function,
    documentation: 'Return the argument (in radians) of a complex number',
  },
  {
    label: 'asin',
    kind: CompletionItemKind.Function,
    documentation: 'Return the arcsine of a number',
  },
  {
    label: 'asinh',
    kind: CompletionItemKind.Function,
    documentation: 'Return the hyperbolic arcsine of a number',
  },
  {
    label: 'atan',
    kind: CompletionItemKind.Function,
    documentation: 'Return the arctangent of a number',
  },
  {
    label: 'atanh',
    kind: CompletionItemKind.Function,
    documentation: 'Return the hyperbolic arctangent of a number',
  },
  {
    label: 'ceil',
    kind: CompletionItemKind.Function,
    documentation: 'Round up to the nearest integer',
  },
  {
    label: 'conj',
    kind: CompletionItemKind.Function,
    documentation: 'Return the complex conjugate of a number',
  },
  {
    label: 'cos',
    kind: CompletionItemKind.Function,
    documentation: 'Return the cosine of a number',
  },
  {
    label: 'cosh',
    kind: CompletionItemKind.Function,
    documentation: 'Return the hyperbolic cosine of a number',
  },
  {
    label: 'cot',
    kind: CompletionItemKind.Function,
    documentation: 'Return the cotangent of a number',
  },
  {
    label: 'csc',
    kind: CompletionItemKind.Function,
    documentation: 'Return the cosecant of a number',
  },
  {
    label: 'det',
    kind: CompletionItemKind.Function,
    documentation: 'Compute the determinant of a matrix',
  },
  {
    label: 'diag',
    kind: CompletionItemKind.Function,
    documentation: 'Extract or construct a diagonal matrix',
  },
  {
    label: 'diff',
    kind: CompletionItemKind.Function,
    documentation:
      'Compute the difference between adjacent elements of a matrix',
  },
  {
    label: 'disp',
    kind: CompletionItemKind.Function,
    documentation: 'Display the value of an expression',
  },
  {
    label: 'eig',
    kind: CompletionItemKind.Function,
    documentation: 'Compute the eigenvalues and eigenvectors of a matrix',
  },
  {
    label: 'eps',
    kind: CompletionItemKind.Constant,
    documentation:
      'Return the machine epsilon (smallest number representable in floating point arithmetic)',
  },
  {
    label: 'erf',
    kind: CompletionItemKind.Function,
    documentation: 'Return the error function of a number',
  },
  {
    label: 'erfc',
    kind: CompletionItemKind.Function,
    documentation: 'Return the complementary error function of a number',
  },
];
