const lockMap: Map<any, boolean> = new Map();

export async function exclusiveExecSingle(
  me: Object,
  func: () => Promise<void>,
  key?: any
): Promise<void> {
  if (key === undefined) key = func;
  if (!lockMap.get(key)) {
    lockMap.set(key, true);
    try {
      await func.call(me);
    } finally {
      lockMap.set(key, false);
    }
  }
}
