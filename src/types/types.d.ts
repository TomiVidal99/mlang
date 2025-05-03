declare module 'bun' {
  interface Env {
    isDevEnv: 'dev' | 'prod';
  }
}
