# Observabilidade de Banco de Dados: Monitoramento de Conexões Ativas e Catálogos de Estatísticas

Este documento consolida os aprendizados das aulas 90 e 91 do curso.dev, detalhando a implementação de telemetria de conexões no endpoint de status, o uso de tabelas do sistema do PostgreSQL para auditoria de processos e a validação de limites de infraestrutura através de testes de integração.

---

## 1. Catálogos de Estatísticas do PostgreSQL: `pg_stat_activity` vs `pg_stat_database`

O PostgreSQL expõe o seu estado interno por meio de visões dinâmicas de sistema. Para mensurar a saúde do banco de dados do Clone do TabNews, exploramos dois catálogos cruciais:

### A. A View `pg_stat_activity`

É uma tabela dinâmica que exibe uma linha para cada processo de backend ativo no servidor. Ela monitora o estado atual de conexões físicas estabelecidas.

- **Para que serve:** Identificar quais usuários estão conectados, de qual endereço IP eles vêm, quais queries estão executando no exato momento e há quanto tempo aquela sessão está aberta.
- **Aplicação no Projeto:** É a ferramenta ideal para contar quantas conexões simultâneas a nossa aplicação web possui abertas contra o banco através da instrução filtrada:
  ```sql
  SELECT count(*)::int FROM pg_stat_activity WHERE datname = 'local_db';
  ```
- **O operador `::int`**: Força a conversão (_typecasting_) do retorno padrão `bigint` do Postgres para um inteiro de 32 bits, garantindo que o driver `pg` entregue o dado ao Node.js como um número numérico puro e não como uma string.

### B. A View `pg_stat_database`

Diferente da anterior que foca no "agora" (processos), a `pg_stat_database` armazena métricas acumuladas sobre o comportamento macro de cada banco de dados da instância.

- **Para que serve:** Exibir estatísticas consolidadas de desempenho, tais como: quantidade de transações efetivadas (_xact_commit_), transações abortadas (_xact_rollback_), leituras de blocos de disco e total de conflitos de travas de segurança (_deadlocks_). É utilizada para monitoramento de infraestrutura a longo prazo.

---

## 2. Evolução do Endpoint de Diagnóstico (`pages/api/v1/status/index.js`)

Refatoramos o controlador para paralelizar consultas administrativas do Postgres e extrair o teto limite de conexões (`max_connections`) juntamente com a quantidade de sessões ativas exclusivas da nossa base de dados:

```javascript
import database from "infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  // 1. Coleta a versão do motor do banco de dados
  const dataBaseVersionResult = await database.query("SHOW server_version;");
  const dataBaseResulValue = dataBaseVersionResult.rows[0].server_version;

  // 2. Coleta o teto máximo de conexões configurado no Postgres
  const databaseMaxConnectionsResult = await database.query(
    "SHOW max_connections;",
  );
  const databaseMaxConnectionValue = parseInt(
    databaseMaxConnectionsResult.rows[0].max_connections,
  );

  // 3. Coleta o total de conexões abertas e ativas associadas ao nosso banco de dados
  const databaseOpenedConnection = await database.query(
    "SELECT count(*)::int FROM pg_stat_activity WHERE datname = 'local_db';",
  );
  const databaseOpendConnectionValue = databaseOpenedConnection.rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dataBaseResulValue,
        max_connections: databaseMaxConnectionValue,
        opened_connections: databaseOpendConnectionValue,
      },
    },
  });
}

export default status;
```

---

## 3. Validação Estrita dos Limites de Conexão no Teste de Integração

Evoluímos as asserções em `test/integration/api/v1/status/get.test.js` para certificar que os valores retornados condizem com as restrições da nossa infraestrutura isolada via Docker:

```javascript
test("GET to api/v1/status should return status 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  // Asserções padrão de tempo e versão
  expect(responseBody.updated_at).toBeDefined();
  const parseUpDatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parseUpDatedAt);
  expect(responseBody.dependencies.database.version).toEqual("19beta1");

  // 1. Validação do Teto Limite: A imagem oficial Postgres Alpine possui o padrão de 100 conexões
  expect(responseBody.dependencies.database.max_connections).toBe(100);

  // 2. Validação de Conexões Ativas: Garante que apenas a conexão deste próprio teste de integração está ativa
  expect(responseBody.dependencies.database.opened_connections).toBe(1);
});
```
