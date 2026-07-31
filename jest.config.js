const dotenv = require("dotenv");
const dotEnvExpand = require("dotenv-expand");
dotenv.config({
  path: ".env.development",
});

dotEnvExpand.expand(dotenv.config({ path: ".env.development" }));

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
