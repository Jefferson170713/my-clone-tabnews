# Configuração Avançada do Jest, Variáveis de Ambiente e Isolamento de Testes

Este documento detalha a resolução de conflitos de ambiente entre o Next.js e o Jest, a implementação de políticas de segurança (Secure by Default) para conexões de banco de dados e a garantia de idempotência através do isolamento de testes de integração.

---

## 1. O Conflito de Ambientes: Next.js vs Jest

Durante a execução da infraestrutura, observamos um comportamento divergente dependendo de qual ferramenta assumia o controle do processo Node.js.

- **Next.js (`npm run dev`)**: Injeta nativamente a variável de ambiente `NODE_ENV="development"` e possui inteligência embutida para ler e carregar o arquivo `.env.development`.
- **Jest (`npm run test`)**: Quando executado em uma aba separada, o Jest assume o controle, injeta `NODE_ENV="test"` e **não carrega** arquivos `.env` locais por padrão.

Isso gerou um "apagão de credenciais" no ambiente de testes, culminando em dois erros críticos de infraestrutura que precisaram ser resolvidos em etapas.

### Erro 1: O Falso Positivo de SSL

```text
Error: The server does not support SSL connections
```

**Causa:** A nossa função `getSSLValue()` estava configurada como `process.env.NODE_ENV === "development" ? false : true;`. Como o Jest injetou `NODE_ENV="test"`, a condição falhou e o sistema tentou forçar uma conexão SSL (true) com o banco local, que não suporta criptografia.

**Solução (Secure by Default):** Invertemos a lógica para o padrão de mercado. Em vez de desligar o SSL apenas no desenvolvimento, nós o ligamos **estritamente** na produção. Qualquer outro ambiente (`test`, `development`, `homologation`) rodará com SSL desligado por padrão:

```javascript
function getSSLValue() {
  if (process.env.POSTGRES_CA) {
    return process.env.POSTGRES_CA;
  }
  return process.env.NODE_ENV === "production" ? true : false;
}
```

### Erro 2: A Falha de Autenticação (Password Undefined)

```text
Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

**Causa:** Mesmo resolvendo o SSL, o Jest ainda não conhecia a variável `process.env.POSTGRES_PASSWORD`, enviando um valor `undefined` (não-string) para o PostgreSQL, que rejeitou a conexão.

**Solução (Injeção via jest.config.js):** Para equalizar os ambientes, importamos o módulo `dotenv` diretamente na raiz da configuração do Jest, forçando o motor de testes a ler o arquivo de credenciais antes de iniciar qualquer suíte:

```javascript
const dotenv = require("dotenv");
dotenv.config({ path: ".env.development" });

const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
```

---

## 2. Princípio da Idempotência e Isolamento de Testes

Na engenharia de software de elite, testes automatizados devem seguir o princípio da **Idempotência**: um teste deve produzir o mesmo resultado, independentemente de ser executado 1 ou 1.000 vezes seguidas.

Ao testarmos o endpoint de migrações (`POST /api/v1/migrations`), o banco de dados tem seu estado alterado (tabelas são criadas). Se rodarmos o teste novamente, ele falhará por conflito de tabelas pré-existentes.

Para resolver a poluição de estado, implementamos a estratégia de Teardown/Setup utilizando o hook `beforeAll` do Jest.

### A Estratégia do "Drop Schema Cascade"

```javascript
import database from "infra/database.js";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}
```

**Por que `beforeAll` e não dentro do teste?**
Ao extrairmos a lógica para o hook `beforeAll`, garantimos que o banco seja limpo e estruturado **antes** de qualquer bloco `test()` ser executado naquele arquivo. O comando `drop schema public cascade` atua como um botão de reinício absoluto, destruindo todas as tabelas e dependências e recriando um ambiente estéril. Isso garante que todo arquivo de teste seja executado sob condições previsíveis e isoladas.
