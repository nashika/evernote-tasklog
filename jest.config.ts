import { InitialOptions } from "@jest/types/build/Config";

const conf: InitialOptions = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
    "^vue$": "vue/dist/vue.common.js",
  },
  moduleFileExtensions: ["js", "vue", "json"],
  transform: {
    "^.+\\.js$": "babel-jest",
    ".*\\.(vue)$": "vue-jest",
  },
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/components/**/*.vue", "<rootDir>/pages/**/*.vue"],
  rootDir: "test", // tsが通らないから追加した
  maxWorkers: 8, // tsが通らないから追加した
};

export default conf;
