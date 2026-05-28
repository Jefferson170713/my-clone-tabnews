# Governança de Arquivos Iguinorados com .gitignore

Este documento consolida os aprendizados sobre o ciclo de vida de arquivos no Git, focando na criação e configuração do arquivo `.gitignore` para proteger o repositório contra o envio de dependências pesadas e dados sensíveis.

---

## 1. O que é o `.gitignore` e para que serve?

O **`.gitignore`** é um arquivo de configuração estrito colocado obrigatoriamente na raiz do repositório. A sua função na arquitetura do projeto é listar padrões de nomes de arquivos e diretórios que o Git deve ignorar completamente. 

Arquivos que casam com as regras do `.gitignore` não aparecem no comando `git status` e ficam impedidos de entrar na *Stage Area*, evitando commits acidentais de arquivos desnecessários ou perigosos.

---

## 2. Por que ignorar a pasta `node_modules/`?

A pasta `node_modules/` armazena os códigos físicos de todas as dependências que instalamos via NPM. Ela não deve ser versionada no GitHub por três motivos de engenharia:

1. **Peso Excessivo:** Um projeto simples com poucas dependências pode facilmente ultrapassar 100MB de código na `node_modules/` devido às subdependências em cascata.
2. **Desempenho do Git:** O Git acompanha as mudanças linha por linha de cada arquivo. Rastrear milhares de arquivos de terceiros deixa comandos como `git status` e `git commit` extremamente lentos.
3. **Redundância:** O arquivo `package.json` já funciona como o manifesto oficial do projeto. Se outro desenvolvedor baixar o repositório puro, basta ele executar o comando `npm install` para que o NPM recrie a pasta `node_modules/` localmente de forma idêntica.

---

## 3. Como criar e configurar na prática

Para aplicar essa governança no Clone do TabNews, precisamos criar um arquivo chamado exatamente **`.gitignore`** (repare no ponto no início, ele é um arquivo oculto do sistema) na **raiz do projeto**.

### Conteúdo recomendado para o arquivo `.gitignore`:

Dentro do arquivo `.gitignore` na raiz, adicionamos as seguintes regras de bloqueio:

```text
# Dependências (Código de terceiros gerado localmente)
node_modules/

# Logs do NPM (Arquivos de histórico de erros)
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Pastas de Build e Produção (Geradas automaticamente)
.next/
out/
build/
dist/

# Arquivos do Sistema Operacional (Lixo visual do sistema)
.DS_Store
Thumbs.db

# Dados Sensíveis (Variáveis de ambiente com senhas e chaves de API)
.env
.env.local
.env.development.local
```

---

## 4. Fluxo de Trabalho no Terminal

Após criar e salvar o arquivo `.gitignore` na raiz do projeto, execute os seguintes comandos para validar o isolamento:

### Passo 1: Verificar se surtiu efeito
```bash
git status
```
*Se você fez tudo certo, a pasta `node_modules/` sumirá da listagem de arquivos modificados, e apenas o arquivo `.gitignore` aparecerá como novo arquivo detectado.*

### Passo 2: Adicionar o configurador ao Git
```bash
git add .gitignore
```

### Passo 3: Realizar o commit semântico
```bash
git commit -m "chore(infra): adiciona arquivo .gitignore para isolamento de dependencias"
```