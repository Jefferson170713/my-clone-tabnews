# Auditoria de Infraestrutura, Comandos de Metadados SQL e Contratos de API

Este documento consolida os aprendizados das aulas 85 a 89 do curso.dev, detalhando a implementação de um endpoint de auditoria de saúde (_Health Check_), a diferença conceitual de comandos de inspeção no PostgreSQL e a validação estrita de tipos e formatos de dados em testes de integração.

---

## 1. Comandos de Inspeção e Metadados no PostgreSQL

Para expor o estado e as propriedades da nossa infraestrutura através da API, consultamos o banco de dados utilizando duas abordagens distintas fornecidas pelo motor do PostgreSQL:

### A. O Comando `SHOW server_version`

O comando `SHOW` no ecossistema SQL é utilizado para inspecionar parâmetros de configuração em tempo de execução do servidor. Quando executamos `SHOW server_version;`, o banco não realiza processamentos complexos em tabelas de sistema; ele lê diretamente a variável de runtime armazenada na memória do servidor.

- **Formato do Retorno:** Retorna uma string limpa e direta contendo apenas o número e a tag da versão (ex: `19beta1`). É o padrão ideal para consumo programático por APIs.

### B. A Função `SELECT version()`

A instrução `SELECT version();` invoca uma função interna do motor que extrai a assinatura completa de compilação do binário do banco de dados.

- **Formato do Retorno:** Retorna um texto descritivo denso (ex: `PostgreSQL 19beta1 on x86_64-pc-linux-musl, compiled by gcc...`). Embora rica para auditorias manuais via terminal, essa string exige tratamentos complexos de strings para extração de dados isolados em aplicações backend.

---

## 2. Implementação do Endpoint de Status (`pages/api/v1/status/index.js`)

Refatoramos o controlador para buscar os metadados do banco de forma assíncrona e estruturar um payload dinâmico que documenta o momento exato da requisição seguindo o padrão internacional **ISO 8601**:

```javascript
import database from "infra/database.js";

async function status(request, response) {
  // Captura a estampa de tempo atualizada no padrão UTC completo
  const updatedAt = new Date().toISOString();

  // Executa a consulta de parâmetro administrativo do Postgres
  const dataBaseVersionResult = await database.query("SHOW server_version;");
  const dataBaseResulValue = dataBaseVersionResult.rows[0].server_version;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dataBaseResulValue,
      },
    },
  });
}

export default status;
```

---

## 3. Validação de Contratos em Testes de Integração (`test/integration/api/v1/status/get.test.js`)

Para garantir que o endpoint não sofra regressões e mantenha o seu contrato estável, evoluímos a suíte de testes de integração para validar não apenas o Status Code, mas a estrutura e a semântica do JSON retornado:

```javascript
test("GET to api/v1/status should return status 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  // 1. Validação de Existência: Garante que a propriedade de tempo foi enviada
  expect(responseBody.updated_at).toBeDefined();

  // 2. Validação de Formato (ISO 8601): Tenta reconstruir a data a partir da string recebida
  const parseUpDatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parseUpDatedAt);

  // 3. Validação de Infraestrutura: Garante que o banco conectado é a versão Alpine configurada
  expect(responseBody.dependencies.database.version).toEqual("19beta1");
});
```

### Por que essa validação é considerada de Elite?

A validação de data com o re-parsing do `toISOString()` garante que o valor trafegado na rede é uma data válida estruturada. Se o servidor respondesse com um texto corrompido, o construtor `new Date()` falharia, derrubando o teste e impedindo que um bug de contrato fosse enviado para o repositório do GitHub.
