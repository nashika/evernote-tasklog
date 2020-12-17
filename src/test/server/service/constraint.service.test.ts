import "reflect-metadata";
import container from "~/src/server/inversify.config";

import ConstraintService from "~/src/server/service/constraint.service";
import TableService from "~/src/server/service/table.service";
import TagEntity from "~/src/common/entity/tag.entity";

const constraintService = container.get<ConstraintService>(ConstraintService);
const tableService = container.get<TableService>(TableService);

tableService.caches.tags = {
  a001: new TagEntity({
    guid: "a001",
    name: "Tag-a001",
    parentGuid: null,
    updateSequenceNum: 0,
  }),
  a002: new TagEntity({
    guid: "a002",
    name: "Tag-a002",
    parentGuid: "a001",
    updateSequenceNum: 0,
  }),
  a003: new TagEntity({
    guid: "a003",
    name: "Tag-a003",
    parentGuid: "a001",
    updateSequenceNum: 0,
  }),
  a004: new TagEntity({
    guid: "a004",
    name: "Tag-a004",
    parentGuid: "a003",
    updateSequenceNum: 0,
  }),
};

describe("evalNumber", () => {
  type paramTypes = Parameters<ConstraintService["evalNumber"]>;
  type paramsType = {
    target: paramTypes[0];
    query: paramTypes[1];
    result: boolean;
  };
  const myTest = (params: paramsType) => {
    test(JSON.stringify(params), () => {
      expect(constraintService["evalNumber"](params.target, params.query)).toBe(
        params.result
      );
    });
  };
  myTest({ target: null, query: null, result: true });
  myTest({ target: undefined, query: null, result: true });
  myTest({ target: null, query: 1, result: false });
  myTest({ target: 1, query: null, result: false });
  myTest({ target: 1, query: 1, result: true });
  myTest({ target: 1, query: 0, result: false });
  myTest({ target: 1, query: 0, result: false });
  myTest({ target: 1, query: {}, result: true });
  myTest({ target: 1, query: { $eq: 1 }, result: true });
  myTest({ target: 1, query: { $eq: 0 }, result: false });
  myTest({ target: 1, query: { $ne: 0 }, result: true });
  myTest({ target: 1, query: { $ne: 1 }, result: false });
  myTest({ target: 1, query: { $gt: 0 }, result: true });
  myTest({ target: 1, query: { $gt: 1 }, result: false });
  myTest({ target: 1, query: { $gte: 1 }, result: true });
  myTest({ target: 1, query: { $gte: 2 }, result: false });
  myTest({ target: 1, query: { $lt: 2 }, result: true });
  myTest({ target: 1, query: { $lt: 1 }, result: false });
  myTest({ target: 1, query: { $lte: 1 }, result: true });
  myTest({ target: 1, query: { $lte: 0 }, result: false });
  myTest({ target: 1, query: { $between: [1, 2] }, result: true });
  myTest({ target: 1, query: { $between: [2, 3] }, result: false });
  myTest({ target: 1, query: { $notBetween: [2, 3] }, result: true });
  myTest({ target: 1, query: { $notBetween: [1, 2] }, result: false });
  myTest({ target: 1, query: { $in: [1, 2, 3] }, result: true });
  myTest({ target: 1, query: { $in: [2, 3] }, result: false });
  myTest({ target: 1, query: { $notIn: [2, 3] }, result: true });
  myTest({ target: 1, query: { $notIn: [1, 2, 3] }, result: false });
  myTest({ target: 1, query: { $not: { $eq: 0 } }, result: true });
  myTest({ target: 1, query: { $not: { $eq: 1 } }, result: false });
});

describe("evalString", () => {
  type paramTypes = Parameters<ConstraintService["evalString"]>;
  type paramsType = {
    target: paramTypes[0];
    query: paramTypes[1];
    result: boolean;
  };
  const myTest = (params: paramsType) => {
    test(JSON.stringify(params), () => {
      expect(constraintService["evalString"](params.target, params.query)).toBe(
        params.result
      );
    });
  };
  myTest({ target: null, query: null, result: true });
  myTest({ target: undefined, query: null, result: true });
  myTest({ target: "", query: null, result: false });
  myTest({ target: null, query: "", result: false });
  myTest({ target: "", query: "", result: true });
  myTest({ target: "a", query: "a", result: true });
  myTest({ target: "a", query: "b", result: false });
  myTest({ target: "a", query: ["a", "b"], result: true });
  myTest({ target: "a", query: ["b", "c"], result: false });
  myTest({ target: "a", query: [], result: false });
  myTest({ target: "abcde", query: /abc/, result: true });
  myTest({ target: "abcde", query: /ace/, result: false });
  myTest({ target: "a", query: { $eq: "a" }, result: true });
  myTest({ target: "a", query: { $eq: "b" }, result: false });
  myTest({ target: "a", query: { $ne: "b" }, result: true });
  myTest({ target: "a", query: { $ne: "a" }, result: false });
  myTest({ target: "a", query: { $in: ["a", "b"] }, result: true });
  myTest({ target: "a", query: { $in: ["b", "c"] }, result: false });
  myTest({ target: "a", query: { $notIn: ["b", "c"] }, result: true });
  myTest({ target: "a", query: { $notIn: ["a", "b"] }, result: false });
  myTest({ target: "a", query: { $not: { $eq: "b" } }, result: true });
  myTest({ target: "a", query: { $not: { $eq: "a" } }, result: false });
});

describe("evalArray", () => {
  type paramTypes = Parameters<ConstraintService["evalArray"]>;
  const myTest = (
    target: paramTypes[0],
    query: paramTypes[1],
    result: boolean
  ) => {
    test(JSON.stringify({ target, query, result }), () => {
      expect(constraintService["evalArray"](target, query)).toBe(result);
    });
  };
  myTest(null, "a", false);
  myTest(undefined, "a", false);
  myTest(["a", "b"], "a", true);
  myTest(["b", "c"], "a", false);
  myTest([], "a", false);
  myTest(["a", "b", "c"], ["a", "b"], true);
  myTest(["a", "b", "c"], ["a"], true);
  myTest(["a", "b", "c"], [], true);
  myTest(["a", "b"], ["a", "b", "c"], false);
  myTest([], ["a"], false);
  myTest(["a", "b", "c"], { $in: ["a"] }, true);
  myTest(["a", "b", "c"], { $in: ["a", "d"] }, true);
  myTest(["a", "b", "c"], { $in: ["d", "e"] }, false);
  myTest(["a", "b", "c"], { $in: [] }, false);
  myTest(["a", "b", "c"], { $notIn: ["d", "e"] }, true);
  myTest(["a", "b", "c"], { $notIn: [] }, true);
  myTest(["a", "b", "c"], { $notIn: ["a"] }, false);
  myTest(["a", "b", "c"], { $notIn: ["a", "d"] }, false);
  myTest(["a", "b", "c"], { $all: ["a", "b"] }, true);
  myTest(["a", "b", "c"], { $all: [] }, true);
  myTest(["a", "b", "c"], { $all: ["a", "d"] }, false);
  myTest(["a", "b", "c"], { $notAll: ["a", "d"] }, true);
  myTest(["a", "b", "c"], { $notAll: ["a", "b"] }, false);
  myTest(["a", "b", "c"], { $notAll: [] }, false);
});

describe("expandTagTree", () => {
  type paramTypes = Parameters<ConstraintService["expandTagTree"]>;
  const myTest = (target: paramTypes[0], result: string[]) => {
    test(JSON.stringify({ target, result }), () => {
      expect(constraintService["expandTagTree"](target)).toStrictEqual(result);
    });
  };
  myTest([], []);
  myTest(["Tag-a001"], ["Tag-a001"]);
  myTest(
    ["Tag-a001", "Tag-a002", "Tag-a003"],
    ["Tag-a001", "Tag-a002", "Tag-a003"]
  );
  myTest({ $children: "Tag-a001" }, ["Tag-a002", "Tag-a003"]);
  myTest({ $descendants: "Tag-a001" }, ["Tag-a002", "Tag-a003", "Tag-a004"]);
});
