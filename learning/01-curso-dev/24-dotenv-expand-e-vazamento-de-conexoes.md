# Arquitetura Avançada: Dotenv-Expand, Injeção de Dependências e Prevenção de Connection Leaks

Este documento é um aprofundamento técnico da aula 110. Nele, analisamos a transição de configurações estáticas para variáveis dinâmicas (DRY), a refatoração do módulo de banco de dados para suportar Injeção de Dependência e o diagnóstico clínico de vazamento de conexões na camada TCP do PostgreSQL.

---

## 1. O Princípio DRY nas Variáveis de Ambiente (`dotenv-expand`)

### O Cenário Anterior (O Problema):

Na raiz do nosso projeto, no arquivo `.env.development`, tínhamos credenciais fragmentadas e uma string de conexão (`DATABASE_URL`) completamente estática:

```text
POSTGRES_USER=local_user
POSTGRES_PASSWORD=local_password
# ...
DATABASE_URL=postgres://local_user:local_password@localhost:5432/local_db
```

Isso violava o princípio **DRY (Don't Repeat Yourself)**. Se a senha do banco mudasse, o desenvolvedor teria que alterar em duas linhas diferentes. A chance de esquecer uma delas e gerar um bug silencioso em produção era imensa.

### A Solução Arquitetural:

Instalamos o pacote `dotenv-expand@12.0.1`. Ele intercepta o carregamento do `dotenv` e adiciona um motor de interpolação.

```text
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```

**Aprofundamento:** Agora, a `DATABASE_URL` não é mais um dado fixo, é uma fórmula. O Node.js resolve as variáveis internas (como `${POSTGRES_USER}`) em tempo de execução, criando uma "Single Source of Truth" (Fonte Única de Verdade). Alterou o host ou a porta? Todo o ecossistema herda a mudança instantaneamente.

---

## 2. Refatoração do `infra/database.js`: Isolamento do Cliente

### O Cenário Anterior (O Problema):

O nosso arquivo de banco exportava apenas a função `query`. Essa função era uma "caixa preta": ela mesma abria a conexão, executava uma query única e fechava a conexão no `finally`.
Isso é excelente para consultas isoladas, mas inútil para o `node-pg-migrate`. Uma migração precisa rodar vários comandos SQL sequenciais (criar tabela, adicionar índice, alterar coluna) em uma **única transação contínua**.

### A Solução Arquitetural:

Nós "quebramos" a caixa preta e expusemos a criação do cliente.

```javascript
// Nova função que apenas FABRICA e CONECTA o cliente, mas não o fecha!
async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    // ... configurações ...
    ssl: getSSLValue(),
  });
  await client.connect();
  return client; // Retorna a "porta aberta" para quem chamou
}

export default {
  query: query,
  getNewClient: getNewClient, // Expomos a nova função para o mundo externo
};
```

**Aprofundamento:** Isso nos dá flexibilidade. Se um endpoint precisa de uma query rápida, usa o `database.query`. Se precisa de um canal aberto para streaming de dados ou migrações complexas, usa o `database.getNewClient()`.

---

## 3. Injeção de Dependência no Controlador (`migrations/index.js`)

### O Cenário Anterior (O Problema):

Antes, passávamos apenas a string `databaseUrl` para o `node-pg-migrate`:

```javascript
const defaultMigrationOptions = {
  databaseUrl: process.env.DATABASE_URL, // Delegação cega
  // ...
};
```

Aqui nós dizíamos ao pacote: _"Toma a string, se vira para abrir a conexão no banco e rodar"_. Nós perdíamos totalmente o controle do ciclo de vida da infraestrutura.

### A Solução Arquitetural (Injeção de Dependência):

Nós assumimos o volante. Em vez de passar uma URL, nós instanciamos o cliente no nosso código e o injetamos pronto para o pacote usar:

```javascript
import database from "infra/database.js";

export default async function migrations(request, response) {
  // 1. Nós criamos e abrimos a conexão
  const dbClient = await database.getNewClient();

  const defaultMigrationOptions = {
    dbClient: dbClient, // 2. INJEÇÃO DE DEPENDÊNCIA: Toma o cliente pronto!
    dir: join("infra", "migrations"),
    // ...
  };

  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
    });

    // 3. Nós assumimos a responsabilidade de FECHAR a conexão!
    await dbClient.end();
    return response.status(200).json(pendingMigrations);
  }
  // ... lógica do POST omitida para brevidade (segue o mesmo padrão) ...
}
```

---

## 4. O Diagnóstico Clínico: Vazamento de Conexões (Connection Leak)

O que aconteceria se você deletasse a linha `await dbClient.end();` do seu controlador? Você observou de forma brilhante o impacto disso no endpoint `/api/v1/status`:

```json
{
  "dependencies": {
    "database": {
      "version": "19beta1",
      "max_connections": 100,
      "opened_connections": 1 // Esse número começou a subir: 2, 3, 4...
    }
  }
}
```

**O Aprofundamento no Motor do PostgreSQL:**
Cada vez que você dá um `await client.connect()`, o banco de dados PostgreSQL aloca memória RAM e cria um novo processo (um "fork") no sistema operacional para ouvir aquele canal TCP.
Se você retorna a resposta HTTP (`response.status(200)`) sem enviar o sinal de encerramento (`client.end()`), o processo do Node.js "esquece" daquela conexão, mas o banco de dados **não**. A conexão fica "Zumbi" (aberta indefinidamente).

Como o seu `max_connections` é 100, bastaria que o usuário apertasse "F5" na página de migrações 100 vezes para derrubar o banco de dados inteiro em produção, causando um erro fatal de "Too many clients already". Ao injetar o `dbClient` e colocar o `await dbClient.end();`, você fechou a porta da dispensa e evitou o colapso sistêmico.
