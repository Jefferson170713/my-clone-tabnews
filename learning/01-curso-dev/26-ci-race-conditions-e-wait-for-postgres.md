# Integração Contínua (CI): Estabilização Local, Race Conditions e Orquestração Docker

Este documento é um registro aprofundado e passo a passo da aula 124. O objetivo central é pavimentar o caminho para a Integração Contínua (CI) através da criação de um ambiente de desenvolvimento local previsível, unificado e à prova de falhas de sincronização (Race Conditions).

---

## 1. O Desafio da Integração Contínua (CI)

A premissa de um ambiente maduro de desenvolvimento é a capacidade de iniciar todo o ecossistema da aplicação (Banco de Dados, Migrações e Servidor Web) com um único comando: `npm run dev`.

Antes dessa refatoração, o nosso `package.json` possuía scripts fragmentados:

```json
"scripts": {
  "dev": "npm run services:up && next dev",
  "services:up": "docker compose -f infra/compose.yaml up -d",
  "test:watch": "jest --watchAll --runInBand",
  // ...
}
```

Se um desenvolvedor rodasse apenas `npm run test:watch` em uma máquina virgem, todos os testes falhariam, pois a infraestrutura (banco de dados) não havia sido iniciada.

Para alcançar a excelência de CI, estabelecemos 3 metas:

1. Estabilizar o Ambiente Local
2. Estabilizar os Testes Locais
3. Estabilizar o CI

A primeira tentativa natural seria encadear os comandos na propriedade dev:
`"dev": "npm run services:up && npm run migration:up && next dev"`

Porém, essa abordagem ingênua esbarra em um problema arquitetural clássico: **A Condição de Corrida**.

---

## 2. A Condição de Corrida (Race Condition)

Uma _Race Condition_ (Condição de Corrida ou de Competição) ocorre quando o comportamento de um software depende da ordem e do tempo de eventos incontroláveis.

Quando executamos o `services:up`, o Docker aloca o container e libera o terminal quase instantaneamente. No entanto, o motor do PostgreSQL _dentro_ do container ainda está carregando na memória. O script seguinte (`migration:up`) tenta conectar imediatamente no banco, encontra a porta fechada e o processo estoura um erro fatal. O script "correu" mais rápido que a inicialização do banco.

---

## 3. Previsibilidade com `container_name` no Docker

Para resolver a condição de corrida, precisamos criar um script que "espere" o banco de dados. Mas para um script interagir com o container do banco, ele precisa saber o nome exato desse container.

Ao rodarmos `docker ps`, vimos que o Docker inventa nomes baseados na pasta (ex: `infra-database-1`). Em DevOps, aleatoriedade é o inimigo.

```text
CONTAINER ID   IMAGE                         COMMAND                  STATUS          PORTS                    NAMES
a5ccb4329c08   postgres:19beta1-alpine3.22   "docker-entrypoint.s…"   Up 12 minutes   0.0.0.0:5432->5432/tcp   infra-database-1
```

**A Solução:** Alteramos o arquivo `infra/compose.yaml` para forçar um nome fixo e previsível através da propriedade `container_name`:

```yaml
services:
  database:
    container_name: "postgres-dev"
    image: "postgres:19beta1-alpine3.22"
    env_file:
      - ../.env.development
    ports:
      - "5432:5432"
```

Após reiniciar os serviços, pudemos testar a comunicação manualmente com o utilitário `pg_isready`:

```bash
docker exec postgres-dev pg_isready
# Retorno de sucesso: /var/run/postgresql:5432 - accepting connections

# Se o container for parado (npm run services:stop), o retorno é:
# Error response from daemon: container <id> is not running
```

---

## 4. O Padrão Polling com `wait-for-postgres.js`

Com o container mapeado e previsível, criamos o script `infra/scripts/wait-for-postgres.js`. Utilizamos o módulo nativo `node:child_process` para criar uma técnica chamada **Polling** (sondagem contínua).

```javascript
const { exec } = require("node:child_process");

function checkPostgres() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkPostgres(); // Polling recursivo: chama a si mesmo até dar certo
      return;
    }

    console.log("\n\n🟢 POSTGRES está aceitando conexões!");
  }
}

process.stdout.write("\n\n🔵 Aguardando o POSTGRES aceitar conexões...\n\n");
checkPostgres();
```

Esse script roda ciclicamente. Se o `stdout` não contiver a string de sucesso, ele imprime um ponto (`.`) para dar feedback visual ao usuário e tenta de novo. Ele atua como uma barreira de segurança sólida.

---

## 5. Orquestração Final e Limpeza Profunda (Docker System Prune)

Por fim, integramos o script no nosso `package.json`:

```json
"scripts": {
  "wait-for-postgres": "node infra/scripts/wait-for-postgres.js",
  "dev": "npm run services:up && npm run wait-for-postgres && npm run migration:up && next dev",
  // ...
}
```

### O Comando de Faxina: `docker system prune -a`

Para testar se a esteira de CI realmente funciona a partir do zero (simulando a máquina nova de um desenvolvedor recém-contratado), utilizamos o comando nuclear do Docker:

```bash
docker system prune -a
```

**O que isso faz na prática?**
Esse comando remove tudo que não está sendo usado ativamente no exato momento. Ele deleta _Containers_ parados, limpa a rede local interna gerada pelo compose, limpa os _Build Caches_ antigos e apaga as _Imagens_ (o `-a` garante que até imagens sem container associado sejam apagadas).

É a limpeza profunda que garante que o próximo `npm run dev` faça o download do banco e teste a nossa _Race Condition_ de forma 100% realística. Ao rodar `npm run dev` após essa faxina, a mágica acontece: o banco é baixado, o script aguarda fielmente e o sistema sobe em perfeita harmonia!
