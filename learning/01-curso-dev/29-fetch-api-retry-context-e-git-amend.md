# Arquitetura de Orquestração: Armadilhas do Fetch, Resiliência Ativa e Reescrita de Histórico Git

Este documento aprofunda o refinamento do nosso Orquestrador de Testes, cobrindo o comportamento da API nativa `fetch` diante de códigos HTTP, a consolidação de checagens de infraestrutura e a manutenção de uma esteira limpa de controle de versão utilizando comandos destrutivos do Git.

---

## 1. O Comportamento Silencioso da API `fetch`

Durante a maturação do nosso `test/orchestrator.js`, identificamos uma vulnerabilidade na forma como avaliávamos a prontidão do ambiente.

### O Problema:

Na especificação da API nativa `fetch`, uma requisição só é considerada "falha" (disparando uma exceção tratável por um bloco `catch`) quando ocorre um erro de rede no nível TCP/IP (como _Connection Refused_ ou falha de DNS).
Se o servidor web estiver operante, mas a aplicação quebrar internamente e devolver um código de erro HTTP (ex: `404 Not Found`, `500 Internal Server Error`, `502 Bad Gateway`), a _Promise_ do `fetch` será resolvida com **sucesso**.

No nosso orquestrador original, se o banco de dados caísse, o endpoint `/api/v1/status` retornaria `500`. O `fetch` não lançaria erro, o `async-retry` não interceptaria nada e a suíte de testes iniciaria com a infraestrutura corrompida.

### A Solução Arquitetural (Validação Estrita):

Para blindar o orquestrador, extraímos parâmetros do contexto do `async-retry` (como `tryNumber`) para observabilidade e forçamos o lançamento manual de exceções condicionais baseadas no Status Code:

```javascript
async function fetchStatusPage(bail, tryNumber) {
  const response = await fetch("http://localhost:3000/api/v1/status");

  // Validação explícita: Se não for 200 (OK), forçamos uma falha.
  // Isso obriga o async-retry a interceptar a exceção e rodar o loop novamente.
  if (response.status !== 200) {
    throw Error(`Status page returned ${response.status}`);
  }
}
```

---

## 2. Simplificação da Esteira de Testes (Efeito Dominó)

A nossa rota de `/api/v1/status` possui uma dependência forte com o banco de dados, pois executa instruções SQL (`SHOW server_version;`, `pg_stat_activity`) para montar o payload de resposta.

Isso cria um efeito arquitetural em cadeia:

1. O Orquestrador aguarda a rota responder com status `200`.
2. A rota só consegue responder `200` se o PostgreSQL estiver perfeitamente ativo e aceitando conexões.

**Conclusão:** O orquestrador valida implicitamente o banco de dados. Devido a essa garantia cruzada, pudemos remover o script avulso `npm run wait-for-postgres` do fluxo de testes no `package.json`, reduzindo redundâncias e otimizando o comando do `concurrently`:

```json
"scripts": {
  // O wait-for-postgres foi removido, pois o status da API garante o banco de dados.
  "test": "npm run services:up && concurrently -n next,jest --hide next -k -s command-jest \"next dev\" \"jest --runInBand --verbose\"",
}
```

_(Adicionamos também a flag `--verbose` ao Jest para garantir logs mais detalhados e analíticos na execução unificada)._

---

## 3. Manutenção Profissional do Histórico Git (`--amend` e `-f`)

Para manter os padrões de _Clean History_ (Histórico Limpo) exigidos em ambientes corporativos, evitamos criar _commits_ de correção pequenos (ex: "corrigindo erro do orquestrador").

Quando precisamos integrar as novas validações do `fetch` ao último commit realizado, utilizamos as seguintes operações do Git:

1. **`git commit --amend`:** Pega os arquivos indexados no momento (via `git add -A`) e os injeta dentro do último commit da linha do tempo, permitindo, inclusive, a reescrita da mensagem original.
2. **`git push -f origin fix-npm-test` (Force Push):** Como o `--amend` alterou o hash criptográfico do commit local (reescrevendo o passado), ele diverge da linha do tempo guardada no servidor do GitHub. O push padrão é rejeitado para prevenir perda de dados. A flag `-f` (force) anula essa proteção de segurança, ordenando que o repositório remoto sobrescreva o histórico antigo pela nossa nova versão higienizada.
