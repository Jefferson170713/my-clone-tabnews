# Orquestração de Testes: Sincronização Ativa, Async-Retry e Expansão de Variáveis

Este documento detalha a implementação de um Orquestrador de Testes para garantir a sincronização entre a suíte do Jest e o ciclo de inicialização (Cold Start) do servidor web Next.js, eliminando falhas de conexão prematuras (ECONNREFUSED) e falsos positivos de timeout.

---

## 1. Sincronização Ativa com Padrão de Polling Resiliente (`async-retry`)

Quando executamos testes de integração em paralelo com a inicialização do servidor web, a suíte de testes (Jest) tende a executar suas asserções antes que o servidor (Next.js) esteja pronto para aceitar conexões. Isso gera erros críticos de infraestrutura, como `ECONNREFUSED`.

Para resolver essa assimetria de tempo, implementamos um **Orquestrador** centralizado (`test/orchestrator.js`) utilizando a biblioteca `async-retry`. Esta ferramenta introduz um padrão de arquitetura conhecido como _Polling Resiliente_:

```javascript
import retry from "async-retry";

async function waitForAllServices() {
  await awaitForWebServer();

  async function awaitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      minTimeout: 1000,
      maxTimeout: 1000, // Tenta novamente de forma linear a cada 1 segundo
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      const responseBody = await response.json();
    }
  }
}

export default { waitForAllServices };
```

**Mecânica Subjacente:** O orquestrador atua como um "maestro". Ele tenta acessar o endpoint de status. Se o servidor Next.js ainda estiver compilando, a chamada `fetch` falha. A biblioteca `async-retry` intercepta a exceção silenciosamente e repete a operação até o limite de 100 tentativas, travando a execução dos testes até que a infraestrutura esteja 100% operante.

---

## 2. Expansão Dinâmica de Variáveis no Contexto do Jest

A nossa injeção de dependências no banco de dados depende de uma `DATABASE_URL` construída dinamicamente via variáveis interpoladas (ex: `postgres://${POSTGRES_USER}...`).

O framework Next.js resolve essa interpolação nativamente no seu _runtime_. No entanto, o Jest é agnóstico a essa mecânica e falha ao ler a URL interpolada. Para garantir que o ambiente de testes possua a mesma inteligência do ambiente de desenvolvimento, acoplamos o módulo `dotenv-expand` diretamente nas configurações do executor de testes:

```javascript
// jest.config.js
const dotenv = require("dotenv");
const dotEnvExpand = require("dotenv-expand");

// Carrega o arquivo e expande as variáveis simultaneamente na memória do Jest
dotEnvExpand.expand(dotenv.config({ path: ".env.development" }));
```

---

## 3. Ajuste de Timeout Global e Hooks de Ciclo de Vida (`beforeAll`)

### Injeção de Dependência nos Testes via `beforeAll`

Para garantir que nenhum bloco de teste seja iniciado antes do ambiente estar pronto, invocamos o orquestrador no escopo global de cada arquivo de teste de integração através do _hook_ `beforeAll`:

```javascript
import orchestrator from "test/orchestrator.js";

beforeAll(async () => {
  // Sincroniza a infraestrutura antes de prosseguir
  await orchestrator.waitForAllServices();
  // ... (Limpeza de banco para idempotência) ...
});
```

### Calibragem do `testTimeout`

O Jest possui um sistema de segurança (Timeout) que aborta automaticamente qualquer teste que demore mais de 5000ms (5 segundos). Como o nosso orquestrador agora pausa a execução ativamente para aguardar o servidor subir — o que pode levar até 10 segundos no primeiro _Cold Start_ do Turbopack —, o Jest cancelaria a operação prematuramente.

Ajustamos o limite global no `jest.config.js` para 60 segundos (60000ms), fornecendo a elasticidade necessária para orquestrações complexas:

```javascript
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000, // Fôlego estendido para a orquestração ocorrer sem falsos positivos
});
```
