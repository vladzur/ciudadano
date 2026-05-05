import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  moduleNameMapper: {
    "^@ciudadano/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@ciudadano/database$": "<rootDir>/../../packages/database/src/client.ts",
    "^(\\.\\.?/.+)\\.js$": "$1",
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
};

export default config;
