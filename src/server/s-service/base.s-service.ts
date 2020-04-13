import { injectable } from "inversify";

@injectable()
export default abstract class BaseSService {
  abstract async initialize(...args: any[]): Promise<void>;
}
