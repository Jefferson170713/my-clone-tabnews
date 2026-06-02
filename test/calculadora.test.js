const calculadora = require("../models/calculadora.js");

test("01 - função teste - Soma", () => {
  const a = 10;
  const b = 7;
  const resultado = a + b;
  expect(resultado).toBe(17);
});

test("02 função da soma - models", () => {
  const a = 10;
  const b = 7;
  const resultado = calculadora.somar(a, b);
  expect(resultado).toBe(17);
});

test("03 função da soma - models", () => {
  const a = 10;
  const b = "7";
  const resultado = calculadora.somar(a, b);
  expect(resultado).toBe(17);
});
