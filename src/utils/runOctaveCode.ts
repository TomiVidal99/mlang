import { exec } from 'node:child_process';

/**
 * runs some given string with octave
 * TODO: here should go the given path to octave binary
 */
export function runOctaveCode(octaveCode: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Replace 'octave' with the actual path to your Octave executable if it's not in the system PATH.
    const octaveProcess = exec('octave', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });

    // TODO: if the code could not be executed
    // throw an error to the user

    octaveProcess?.stdin?.write(octaveCode);
    octaveProcess?.stdin?.end();
  });
}
