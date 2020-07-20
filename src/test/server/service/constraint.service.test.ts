import "reflect-metadata";
import container from "~/src/server/inversify.config";

import ConstraintService from "~/src/server/service/constraint.service";

const constraintService = container.get<ConstraintService>(ConstraintService);

test("evalNumber null", () => {
  expect(constraintService["evalNumber"](null, null)).toBe(true);
});
