import * as os from "os";

// The example settings
export interface ISettings {
  maxNumberOfProblems: number;
  maxFilesSearchDepth: number;
  defaultInitFile: string;
  enableInitFile: boolean;
}

/**
* Returns the default init file depending on the OS
* for Linux: ~/.octaverc
* on windows: 
*/
function getDefaultInitFile(): string {
  switch (os.platform()) {
    case 'linux':
      return `${os.homedir()}/.octaverc`;
    case 'darwin':
      return `${os.homedir()}/.octaverc`;
    case 'win32':
      return `${os.homedir()}\\Documents\\Octave\\octaverc`;
    default:
      throw new Error(`Unsupported platform: ${os.platform()}`);
  }
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
export const defaultSettings: ISettings = {
  maxNumberOfProblems: 1000,
  maxFilesSearchDepth: 3,
  defaultInitFile: getDefaultInitFile(),
  enableInitFile: true,
};

export let globalSettings: ISettings = defaultSettings;
export function updateGlobalSettings(settings: ISettings) {
  globalSettings = settings;
}
