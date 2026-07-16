# Execução Programática de Migrações: Runner do Node-PG-Migrate e Endpoints de API

Este documento consolida e aprofunda os aprendizados sobre a transição do gerenciamento de banco de dados via interface de linha de comando (CLI) para execução programática em runtime, detalhando contratos de exportação de módulos JavaScript e testes de asserção de tipos estruturais.

---

## 1. O Mistério dos Módulos: Named Exports vs Default Exports

Durante a integração do ecossistema de migrações na API do Next.js, a sintaxe de importação padrão direta falha sob a assinatura `import migrationRunner from 'node-pg-migrate'`.

Isso ocorre devido ao design de arquitetura de módulos adotado pela biblioteca `node-pg-migrate` baseado no ecossistema **ECMAScript Modules (ESM)**:

### A. Default Export (Exportação Padrão):

Ocorre quando um arquivo exporta um único bloco ou função como o elemento raiz através da diretiva `export default`. O arquivo receptor pode apelidar esse elemento com qualquer nome sem o uso de chaves.

### B. Named Exports (Exportações Nomeadas):

Ocorre quando um pacote exporta múltiplos objetos ou funções de forma granular. A biblioteca `node-pg-migrate` não disponibiliza uma exportação padrão. Ela exporta uma coleção de utilitários isolados. A função motor central do pacote é exposta com o nome restrito de `runner`.

Para consumi-la, a arquitetura exige o uso de chaves para desestruturação do objeto, permitindo a aplicação de um apelido semântico (_Alias_) via palavra-chave `as`:

```javascript
// Abordagem cirúrgica via Named Export e Alias de Claras de Código
import { runner as migrationRunner } from "node-pg-migrate";
```

---

## 2. A Ilusão do Parâmetro `dryRun` e Gerenciamento de Estado

No arquivo de controle de rota em `pages/api/v1/migrations/index.js`, instanciamos o executor programático configurando propriedades fundamentais de infraestrutura:

```javascript
import { runner as migrationRunner } from "node-pg-migrate";
import { join } from "node:path";

export default async function migrations(request, response) {
  const migrationss = await migrationRunner({
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true, // Flag de simulação segura (Sem mutação real)
    dir: join("infra", "migrations"),
    direction: "up", // Sentido incremental da linha do tempo
    verbose: true,
    migrationsTable: "pgmigrations", // Tabela interna de controle de versão
  });

  response.status(200).json(migrationss);
}
```

### O Mecanismo do `dryRun: true`:

Em engenharia de software, um _Dry Run_ representa uma execução experimental seca. O motor do `node-pg-migrate` se conecta ao PostgreSQL, inspeciona a tabela interna de controle `pgmigrations`, calcula quais arquivos na pasta `infra/migrations` ainda não foram aplicados e monta o JSON descritivo.

Contudo, devido ao `dryRun: true`, nenhuma alteração real de esquema é persistida e nenhuma tabela é criada de fato no banco de dados.

### Resposta ao Teste de Mesa Mental:

Se o usuário bater no endpoint repetidas vezes, o array retornado **continuará vindo cheio com as mesmas migrações pendentes**. Como o estado do banco nunca é modificado pela simulação, o motor sempre interpretará aquelas migrações como "novas" e pendentes de execução.

---

## 3. Validação de Contratos de API com Asserções do Jest

Para garantir a estabilidade do endpoint, criamos o arquivo de testes de integração. Corrigimos a nomenclatura para manter o isolamento semântico estrito do método HTTP mapeado: `test/integration/api/v1/migrations/get.test.js`.

```javascript
test("GET to api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  // Asserção Estrutural: Garante que o contrato da API retorna um Array legítimo
  expect(Array.isArray(responseBody)).toBe(true);
  console.log(responseBody);
});
```

### Explicação da Asserção de Tipo:

O método `Array.isArray(responseBody)` avalia em tempo de execução se a estrutura recebida via JSON possui a matriz de dados nativa de um vetor JavaScript. Testar o tipo de dados é uma barreira de segurança vital para garantir que, caso o banco falhe ou o runner quebre e devolva um objeto de erro, a suíte do Jest capture a regressão imediatamente.
