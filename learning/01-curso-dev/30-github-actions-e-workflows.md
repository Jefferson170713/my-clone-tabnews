# DevOps e Integração Contínua (CI): GitHub Actions e Workflows

Este documento detalha a fundação da nossa esteira de Integração Contínua (CI) em ambiente de nuvem, utilizando o GitHub Actions. O objetivo é garantir que nenhuma alteração de código (Pull Request) seja integrada à _branch_ principal sem antes passar por um rigoroso processo de validação automatizada num ambiente estéril.

---

## 1. A Estrutura de Diretórios de CI

Para o GitHub reconhecer que a nossa aplicação possui automações, é obrigatório respeitar a convenção estrutural da plataforma. Criamos o diretório oculto `.github/` na raiz do projeto, e dentro dele a pasta `workflows/`. Qualquer arquivo `.yaml` ou `.yml` colocado ali será automaticamente interpretado como um robô inspetor (um _Runner_).

---

## 2. Dissecando o Arquivo `tests.yaml` (Linha a Linha)

O arquivo de configuração declarativa `.github/workflows/tests.yaml` orquestra exatamente o que a nuvem deve fazer com o nosso código.

```yaml
name: Automated Tests

on: pull_request

jobs:
  jest:
    name: Jest Ubuntu Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20.9.0"

      - run: npm ci

      - run: npm test
```

### Anatomia do Workflow:

- **`name: Automated Tests`**: O identificador visual do fluxo. É o nome que aparecerá no painel _Actions_ do repositório no GitHub.
- **`on: pull_request`**: O **Gatilho (Trigger)**. Define qual evento do Git acorda a máquina virtual. Neste caso, qualquer _Pull Request_ aberto, atualizado ou reaberto disparará este fluxo.
- **`jobs:` e `jest:`**: _Jobs_ são conjuntos de tarefas. Criamos um job batizado de `jest`. Em sistemas de larga escala, poderíamos ter _jobs_ paralelos (ex: um para _linting_, outro para testes de backend, outro para testes _end-to-end_).
- **`runs-on: ubuntu-latest`**: A escolha do Sistema Operacional do _Runner_. O GitHub provisiona, de graça, uma Máquina Virtual (VM) rodando a versão mais recente do Linux Ubuntu. É um ambiente efêmero (nasce, roda e morre).
- **`steps:`**: O vetor de execução sequencial (o passo a passo) que a VM executará.
- **`- uses: actions/checkout@v4`**: Uma _Action_ oficial do GitHub. A VM alugada nasce completamente vazia. Este passo executa um `git clone` seguro do nosso repositório para dentro da VM.
- **`- uses: actions/setup-node@v4`**: Configura o ecossistema base. A propriedade `with: node-version: "20.9.0"` obriga a VM a instalar a exata versão do Node.js que usamos no ambiente local, eliminando o problema _"na minha máquina funciona"_.
- **`- run: npm ci`**: Comando crucial de ambientes profissionais. Em vez do clássico `npm install` (que pode atualizar pacotes e quebrar o sistema), o **`npm ci` (Clean Install)** deleta a `node_modules` (se existir) e instala as dependências de forma estrita, lendo fielmente as versões travadas no `package-lock.json`.
- **`- run: npm test`**: O gatilho final. Dispara o script definido no nosso `package.json`, que por sua vez levanta o banco de dados via Docker e executa a suíte de testes do Jest.
