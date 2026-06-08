# Integração de Banco de Dados: Camada de Infraestrutura e Driver pg

Este documento consolida os aprendizados das aulas 76 a 78 do curso.dev, detalhando a implementação do driver nativo `pg` para estabelecimento de conexões de rede, o gerenciamento do ciclo de vida de clientes SQL e a automação do fluxo de testes contínuos com monitoramento global.

---

## 1. O Driver de Conexão `pg` (Node-Postgres)

Para que o ambiente de execução Node.js consiga se comunicar com um banco de dados PostgreSQL, precisamos de um driver intermediário que entenda o protocolo nativo de rede do banco. Instalamos o pacote oficial de mercado travado na versão estável:

```bash
npm install pg@8.11.0
```

O módulo **`pg` (Node-Postgres)** é uma coleção de módulos em JavaScript puro responsáveis por serializar comandos SQL, enviá-los via sockets TCP/IP para o servidor do banco de dados e desserializar a resposta binária de volta em objetos JavaScript nativos.

---

## 2. Abstração de Infraestrutura (`infra/database.js`)

Para manter os nossos controladores e rotas limpos e focados apenas em requisições, centralizamos a lógica física de conexão na camada de persistência. Criamos o arquivo `infra/database.js` encapsulando o ciclo de vida do cliente:

```javascript
import { Client } from "pg";

async function query(queryObject) {
  // Instancia a configuração física do cliente (Temporariamente Hardcoded)
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "local_password",
  });

  // 1. Estabelece a conexão física de rede (Handshake)
  await client.connect();

  // 2. Executa a instrução SQL de forma assíncrona no motor do Postgres
  const result = await client.query(queryObject);

  // 3. Encerra a conexão e libera o socket para evitar vazamento de memória (Memory Leak)
  await client.end();

  return result;
}

export default {
  query: query,
};
```

---

## 3. Consumo de Infraestrutura no API Route Controller

Modificamos o controlador da nossa API em `pages/api/v1/status/index.js` para realizar uma consulta de auditoria no banco de dados antes de responder ao cliente:

```javascript
import database from "../../../../infra/database.js";

async function status(request, response) {
  // Executa uma query de teste com apelido estruturado (Alias)
  const result = await database.query("SELECT 1 + 1 as sum;");

  // Imprime o primeiro registro retornado no terminal do servidor Next.js
  console.log(result.rows[0]); // Saída esperada no console: { sum: 2 }

  response.status(200).json({
    "teste de api funcionando": "ok",
  });
}

export default status;
```

---

## 4. Orquestração de Terminais no Fluxo de Desenvolvimento

O ecossistema do projeto agora depende de uma arquitetura distribuída. Para trabalhar de forma eficiente, o fluxo de desenvolvimento exige 3 terminais paralelos operando de forma coordenada:

1. **Terminal 1 (Infraestrutura Ativa):** Mantém o container do banco de dados rodando em segundo plano.
   ```bash
   docker compose -f infra/compose.yaml up -d
   ```
2. **Terminal 2 (Servidor Web Backend/Frontend):** Roda o compilador e o roteador dinâmico do Next.js.
   ```bash
   npm run dev
   ```
3. **Terminal 3 (Testes Contínuos Totais):** Monitora globalmente as alterações do sistema através do script otimizado com a flag `--watchAll` no `package.json`, rodando os testes de integração contra a API e o banco simultaneamente.
   ```bash
   npm run test:watch
   ```
