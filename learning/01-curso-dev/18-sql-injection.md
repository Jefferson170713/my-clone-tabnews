# Segurança da Informação e Resiliência: Prevenção de SQL Injection e Ciclo de Vida Conexões

Este documento consolida e aprofunda os aprendizados das aulas 92 a 95 do curso.dev, detalhando os riscos de vulnerabilidades por injeção de comandos SQL, a implementação de Queries Parametrizadas e a blindagem de recursos de rede através da estrutura `try/catch/finally`.

---

## 1. O que é SQL Injection (Injeção de SQL)

A **Injeção de SQL** é uma das vulnerabilidades de segurança mais críticas da história da computação (frequentemente listada no topo do _OWASP Top 10_). Ela ocorre quando um software permite que dados fornecidos por um usuário externo (via formulários, parâmetros de URL ou cabeçalhos) sejam concatenados diretamente como texto em instruções SQL dinâmicas enviadas ao banco de dados.

### Mecânica do Ataque:

Se a query de contagem de conexões utilizasse interpolação direta de strings:

```javascript
const query = `SELECT count(*)::int FROM pg_stat_activity WHERE datname = '${databaseName}';`;
```

Um usuário mal-intencionado poderia manipular a variável alterando a chamada da URL HTTP:

```text
http://localhost:3000/api/v1/status?databaseName=local_db'; DROP DATABASE local_db;--
```

O interpretador de comandos do PostgreSQL processaria duas instruções sequenciais divididas pelo caractere ponto-e-vírgula (`;`), resultando na exclusão imediata e irreversível da base de dados do sistema, enquanto os caracteres `--` comentariam o restante da query original para evitar falhas de sintaxe.

---

## 2. Queries Parametrizadas (_Prepared Statements_) como Defesa

A solução definitiva e de alta performance adotada para mitigar esse vetor de ataque foi a refatoração do manipulador de rota em `pages/api/v1/status/index.js` para utilizar objetos de consulta parametrizados nativos do driver `pg`:

```javascript
const databaseName = process.env.POSTGRES_DB;
const databaseOpenedConnection = await database.query({
  text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
  values: [databaseName],
});
```

### Como funciona a proteção de baixo nível:

Ao enviar a instrução estruturada, o driver `pg` divide a comunicação em duas etapas com o PostgreSQL:

1. O texto contendo o caractere coringa `$1` é enviado para o banco. O motor do banco de dados compila e analisa a árvore sintática da query isolando a lógica de execução.
2. O array contendo as variáveis (`values`) é enviado na sequência. O banco de dados injeta o conteúdo de `databaseName` estritamente na vaga reservada por `$1`, tratando-o puramente como uma string literal. Mesmo que este dado contenha comandos como `DROP DATABASE`, ele jamais será interpretado como código executável.

---

## 3. Gerenciamento Seguro de Recursos com `try/catch/finally`

Aberturas de conexões TCP/IP com bancos de dados consomem recursos finitos de hardware. Se uma instrução SQL disparar uma falha de sintaxe, o fluxo do Node.js é interrompido e os comandos posteriores de encerramento são ignorados, gerando um vazamento catastrófico de conexões (_Connection Leak_).

Para mitigar esse risco de infraestrutura, reestruturamos o módulo centralizador de persistência em `infra/database.js` usando blocos de controle de exceção estáveis:

```javascript
import { Client } from "pg";

async function query(queryObject) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });

  await client.connect();

  try {
    // Bloco Principal: Tenta executar a query e coletar o resultado
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    // Bloco de Contingência: Captura falhas de execução impedindo o travamento da aplicação
    console.error(error);
  } finally {
    // Bloco Mandatório: É executado OBRIGATORIAMENTE tanto no sucesso quanto na falha catastrófica
    await client.end(); // Garante o encerramento do socket sob qualquer circunstância
  }
}

export default {
  query: query,
};
```
