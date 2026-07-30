test("migration file should be loadable as CommonJS", () => {
  const migrationModule = require("infra/migrations/1782527569138_teste-migration.js");

  expect(migrationModule.shorthands).toBeUndefined();
  expect(typeof migrationModule.up).toBe("function");
  expect(typeof migrationModule.down).toBe("function");
});
