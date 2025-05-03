import path = require('node:path');
import os = require('node:os');

/**
 * if the given path contains ~, it will be expanded
 */
export function expandPath(p: string): string {
  if (p[0] === '~') {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}
