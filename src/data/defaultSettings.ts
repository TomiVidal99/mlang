// The example settings
export interface ISettings {
  maxNumberOfProblems: number;
  maxFilesSearchDepth: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
export const defaultSettings: ISettings = {
  maxNumberOfProblems: 1000,
  maxFilesSearchDepth: 3,
};

export let globalSettings: ISettings = defaultSettings;
export function updateGlobalSettings(settings: ISettings) {
  globalSettings = settings;
}
