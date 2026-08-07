# Integração Contínua (CI): Orquestração de Processos, Concurrency e Diagnóstico de Falhas

Este documento aprofunda o processo de automação de testes de integração, detalhando a resolução de falhas de conexão HTTP, timeouts provocados por assimetria de inicialização e a orquestração avançada de múltiplos processos com o pacote `concurrently`.

---

## 1. O Problema da Ausência de Serviços (ECONNREFUSED)

Em testes de unidade, a lógica é testada de forma isolada na memória. No entanto, nossos testes na pasta `test/integration` são testes de contrato (API) reais, que utilizam a função `fetch` para realizar chamadas HTTP contra a URL `http://localhost:3000`.

Ao rodar puramente o comando `jest`, o ambiente colapsou com erros estruturais:

```text
Error: connect ECONNREFUSED 127.0.0.1:5432
TypeError: fetch failed (http://localhost:3000/api/v1/status)
```

**Causa Raiz:** O executor de testes tentou acessar infraestruturas físicas (Banco de Dados na porta 5432 e Servidor Web na porta 3000) que não haviam sido instanciadas. O sistema operacional recusa conexões (Connection Refused) a portas sem processos vinculados (Listen).

---

## 2. Orquestração Paralela e a Nova Race Condition (Timeout)

Para solucionar a ausência do servidor web, a abordagem inicial seria instanciar o Next.js e o Jest simultaneamente. Instalamos a dependência de desenvolvimento `concurrently`:

```bash
npm install --save-dev concurrently@8.2.2
```

O primeiro comando estruturado foi:

```json
"test": "npm run services:up && npm run wait-for-postgres && concurrently 'next dev' 'jest --runInBand'"
```

### O Efeito Colateral: Test Timeouts

O log acusou um novo padrão de falha catastrófica em todos os testes:

```text
thrown: "Exceeded timeout of 5000 ms for a test.
```

**Diagnóstico Arquitetural:** Essa é uma _Race Condition_ (Condição de Corrida) em nível de aplicação.
O Jest é executado de imediato e dispara as requisições `fetch`. Paralelamente, o Next.js inicia seu processo pesado de compilação (Turbopack), demorando cerca de 3 a 4 segundos para expor a porta 3000.
Como o Jest possui um limitador interno de 5000ms (5 segundos) de espera passiva, a requisição sofre timeout antes que o Next.js consiga responder adequadamente.

---

## 3. Maestria em CI: A Anatomia do Comando Concurrently Avançado

Para transformar o nosso script local em uma esteira homologada para CI/CD (ex: GitHub Actions), reestruturamos as flags do `concurrently` aplicando padrões de observabilidade e gerenciamento de ciclo de vida de processos:

```json
"test": "npm run services:up && npm run wait-for-postgres && concurrently -n next,jest --hide next -k -s command-jest 'next dev' 'jest --runInBand'"
```

### Dissecando os Parâmetros (Flags):

- **`--n next,jest` (Names):** Atribui prefixos nominais explícitos aos fluxos de saída (stdout). Evita a desordem visual de logs cruzados.
- **`--hide next`:** Suprime o log gerado pelo Next.js. Em um ambiente de testes, o output de compilação do framework web é ruído; o foco total de depuração deve ser nos _assertions_ do Jest.
- **`-k` (`--kill-others`):** Previne o fenômeno de Processos Zumbis (Zombie Processes). Quando a suíte de testes do Jest finaliza sua execução, o servidor web continuaria rodando indefinidamente, travando pipelines de CI. Essa flag impõe que a morte de um processo dispare o sinal `SIGTERM` para abater os demais.
- **`-s command-jest` (`--success command-jest`):** A pedra angular do CI/CD. Esteiras dependem de _Exit Codes_ (0 para sucesso, 1+ para falha). Se o servidor Next.js for morto pela flag `-k`, ele retornaria um código de falha, derrubando falsamente a esteira. Essa flag define que o status de saída global do script espelhará **estrita e unicamente** o resultado do comando rotulado como `jest`.
