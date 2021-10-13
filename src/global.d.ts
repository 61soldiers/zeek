export {};

declare global {
  interface Window {
    electron: IPreloadApi;
  }
}

interface IPreloadApi {
  send(channel: string, payload?: any): void
  on(channel: string, callback: Function): void
  once(channel: string, callback: Function): void
}