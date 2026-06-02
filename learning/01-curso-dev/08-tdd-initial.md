# Desenvolvimento Guiado por Testes (TDD) e Ciclo Red-Green-Refactor

Este documento consolida os aprendizados sobre a implementação de lógica de negócios na camada `models/`, o isolamento de tipos de dados e a metodologia de desenvolvimento TDD utilizando o Jest em modo contínuo.

---

## 1. O Ciclo de Desenvolvimento TDD (Red-Green-Refactor)

O **TDD (Test-Driven Development)** é uma técnica de engenharia de software que inverte o fluxo tradicional de desenvolvimento. Em vez de escrever o código e depois testar, nós escrevemos o teste antes do código de produção.

Esse processo funciona como uma engrenagem contínua dividida em três fases:

1. **RED (Vermelho):** Escreve-se um teste automatizado que expressa uma nova necessidade do sistema. Como a funcionalidade ainda não foi implementada, o teste obrigatoriamente falha. Isso garante que o teste é confiável e não um "falso positivo".
2. **GREEN (Verde):** Escreve-se a menor quantidade de código de produção necessária para fazer o teste passar. O objetivo aqui é atingir o comportamento correto o mais rápido possível, sem se preocupar com a perfeição estétia do código.
3. **REFACTOR (Refatorar):** Com o terminal verde (segurança), o desenvolvedor limpa o código, elimina duplicidades, melhora os nomes de variáveis e otimiza a performance. O conjunto de testes garante que nenhuma regra de negócio antiga foi quebrada durante a limpeza.

---

## 2. Anatomia do Módulo de Negócio (`models/calculadora.js`)

Para implementar a lógica de soma com segurança estrita de tipos, isolamos a função dentro da camada de modelos usando o sistema de módulos do Node.js (_CommonJS_):

```javascript
function somar(numero1, numero2) {
  if (typeof numero1 !== "number" || typeof numero2 !== "number") {
    throw new Error("Os parâmetros devem ser números");
  }
  return numero1 + numero2;
}

exports.somar = somar;
```

### Blindagem de Tipos:

O JavaScript é uma linguagem fracamente tipada. Se passássemos `10 + "7"`, o interpretador realizaria uma coerção de tipo implícita e retornaria a string `"107"`. A validação com `typeof` bloqueia esse comportamento na raiz, lançando uma exceção de runtime caso as regras de negócio sejam violadas.

---

## 3. Estratégia Avançada de Testes (`test/calculadora.test.js`)

A especificação de testes evoluiu para avaliar tanto o caminho feliz (sucesso) quanto o fluxo de exceção (erro):

```javascript
const calculadora = require("../models/calculadora.js");

test("01 - função teste - Soma", () => {
  const a = 10;
  const b = 7;
  const resultado = a + b;
  expect(resultado).toBe(17);
});

test("02 - função da soma - models", () => {
  const a = 10;
  const b = 7;
  const resultado = calculadora.somar(a, b);
  expect(resultado).toBe(17);
});

test("03 - deve lançar um erro ao passar parâmetros inválidos", () => {
  const a = 10;
  const b = "7";

  // Para testar exceções no Jest, passamos a execução dentro de uma função anônima
  expect(() => {
    calculadora.somar(a, b);
  }).toThrow("Os parâmetros devem ser números");
});
```

### O Matcher `.toThrow()`:

No teste 03, como o modelo está blindado, passar uma string causará um erro. Se rodássemos a função solta, o Jest abortaria o teste como uma falha catastrófica. Ao envelopar a chamada em `() => { calculadora.somar(a, b) }`, permitimos que o Jest capture o erro e use o matcher `.toThrow()` para validar se a mensagem disparada é exatamente a mensagem de erro que nossa regra de negócio exige.
