import { injectable } from "inversify";

@injectable()
export abstract class BaseServerService {
  abstract async initialize(...args: any[]): Promise<void>;
}
