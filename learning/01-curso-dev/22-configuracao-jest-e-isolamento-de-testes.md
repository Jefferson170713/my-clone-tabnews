# Configuração Avançada do Jest, Variáveis de Ambiente e Isolamento de Testes

Este documento consolida os aprendizados da aula 106 do curso.dev, detalhando o comportamento de variáveis de ambiente em diferentes contextos de execução (Next.js vs Jest), a configuração do `jest.config.js` e a garantia de idempotência em testes de integração de banco de dados.

---

## 1. Divergência de Ambientes de Execução (Contexto do Jest)

No ecossistema Node.js, diferentes ferramentas gerenciam o ciclo de vida do processo de maneiras distintas.

- Quando iniciamos a aplicação web (`next dev`), o framework Next.js injeta a variável `NODE_ENV="development"` e carrega o arquivo `.env.development` automaticamente.
- Quando iniciamos a suíte de testes (`jest`), a ferramenta de testes injeta `NODE_ENV="test"` e **não carrega** arquivos `.env` arbitrários por padrão.

Essa divergência causou falhas de conexão com o banco de dados durante a execução dos testes, pois as variáveis de credenciais (como `POSTGRES_PASSWORD`) estavam indefinidas.

### Solução: Injeção Direta no `jest.config.js`

Para equalizar os ambientes, modificamos o arquivo de configuração raiz do Jest para invocar o ecossistema `dotenv` antes de instanciar os testes, forçando o carregamento das variáveis locais:

```javascript
const dotenv = require("dotenv");

// Força o carregamento das variáveis de desenvolvimento no runtime de testes
dotenv.config({
  path: ".env.development",
});

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
```

---

## 2. Refinamento de Segurança SSL na Camada de Persistência

Evoluímos a validação dinâmica de criptografia no módulo `infra/database.js`. Em vez de usar um operador ternário focado no ambiente de desenvolvimento, invertemos a lógica para adotar o padrão de **"Segurança por Padrão" (Secure by Default)**:

```javascript
function getSSLValue() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }
  // Exige SSL (true) estritamente se o ambiente for o de produção
  return process.env.NODE_ENV === "production" ? true : false;
}
```

Isso garante que, se o `NODE_ENV` for `test` (injetado pelo Jest), o driver continue desligando o SSL para permitir a comunicação com o container local do banco.

---

## 3. Princípio da Idempotência e Limpeza de Estado (`beforeAll`)

Testes de integração que manipulam banco de dados sofrem com poluição de estado. Executar uma suíte de migrações repetidas vezes falhará caso as tabelas geradas nos testes anteriores não sejam removidas.

Para garantir que cada execução ocorra num ambiente estéril, implementamos uma função de destruição de esquemas chamada pelo _hook_ `beforeAll` do Jest:

```javascript
import database from "infra/database.js";

// Executa a instrução antes de todos os blocos de teste (it/test)
beforeAll(cleanDatabase);

async function cleanDatabase() {
  // CASCADE: Força a remoção de tudo que depende do schema public
  await database.query("drop schema public cascade; create schema public;");
}
```

Esse padrão arquitetural garante o isolamento absoluto dos testes, permitindo que a integração contínua (CI/CD) rode de forma previsível e sem efeitos colaterais.
