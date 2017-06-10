import * as path from "path";

export function root(p: string): string {
  return path.join(__dirname, "..", p);
}
