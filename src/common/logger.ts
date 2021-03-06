import { SYMBOL_TYPES } from "~/src/common/symbols";
import { container } from "~/src/common/inversify.config";

export interface ILogger {
  trace(message: any, ...args: any[]): void;
  debug(message: any, ...args: any[]): void;
  info(message: any, ...args: any[]): void;
  warn(message: any, ...args: any[]): void;
  error(message: any, ...args: any[]): void;
}

// eslint-disable-next-line import/no-mutable-exports
export let logger: ILogger;

export function initializeLogger() {
  logger = container.get<ILogger>(SYMBOL_TYPES.Logger);
}
