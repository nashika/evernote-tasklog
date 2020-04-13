import { injectable } from "inversify";

@injectable()
export default abstract class BaseServerService {
  abstract async initialize(...args: any[]): Promise<void>;
}
