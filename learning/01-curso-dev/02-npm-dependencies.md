# Gerenciamento de Pacotes e Manifesto de Dependências com NPM

Este documento consolida os aprendizados das aulas 11 em diante do curso.dev, focando no entendimento do ecossistema NPM, na criação do manifesto do projeto (`package.json`) e na instalação das dependências base para o ecossistema React/Next.js.

---

## 1. O que é o NPM e para que serve?

O **NPM (Node Package Manager)** é o gerenciador de pacotes oficial do Node.js. Ele é composto por duas partes fundamentais:

1. **Um Registro Online:** Um banco de dados público gigantesco onde desenvolvedores do mundo inteiro publicam códigos e bibliotecas prontas (open-source).
2. **Uma Interface de Linha de Comando (CLI):** A ferramenta de terminal que utilizamos para instalar, atualizar e remover essas bibliotecas no nosso projeto local.

Em suma, o NPM serve para que não precisemos "reinventar a roda". Se precisamos de um sistema de rotas robusto ou de manipulação de componentes visuais, nós instalamos pacotes criados e testados pela comunidade através do NPM.

---

## 2. O Manifesto do Projeto: `package.json`

Para iniciar a governança do nosso software, precisamos criar o arquivo de manifesto. Executamos no terminal o comando de inicialização:

```bash
npm init
```

_Nota: Esse comando abrirá um questionário no terminal pedindo o nome do projeto, versão, descrição, etc. Para aceitar todas as configurações padrão de forma rápida, pode-se usar `npm init -y`._

### O que é o `package.json`?

Ele é o arquivo de configuração central do projeto, escrito em formato JSON. Ele funciona como um mapa que descreve metadados do projeto (nome, autor, licença), scripts de automação de tarefas e, crucialmente, a lista de todas as **dependências** externas que o projeto precisa para funcionar em ambiente de desenvolvimento ou produção.

---

## 3. Instalação das Dependências Base

Para construir o Clone do TabNews, faremos uso do framework Next.js e da biblioteca React. As dependências específicas solicitadas são:

- **next (`^13.1.6`):** O framework backend e frontend que nos dá roteamento baseado em arquivos, renderização no lado do servidor (SSR) e otimizações de produção.
- **react (`^18.2.0`):** A biblioteca core para construção de interfaces de usuário baseadas em componentes.
- **react-dom (`^18.2.0`):** O pacote que serve de cola entre o React e o DOM (Document Object Model) do navegador, permitindo a renderização dos componentes na tela.

### Como Instalar:

Para instalar todas as três dependências de uma única vez travando nas versões especificadas, execute o seguinte comando no terminal da raiz do projeto:

```bash
npm install next@13.1.6 react@18.2.0 react-dom@18.2.0
```

_(Você também pode utilizar a abreviação `npm i next@13.1.6 react@18.2.0 react-dom@18.2.0`)_

### O que acontece após a instalação?

1. O NPM criará a pasta **`node_modules/`**, que contém o código real físico de todas as bibliotecas instaladas (e das subdependências delas).
2. O NPM criará o arquivo **`package-lock.json`**, que funciona como um espelho estrito da árvore de dependências exata instalada, garantindo que o ambiente seja idêntico em qualquer máquina.
3. O arquivo **`package.json`** será atualizado automaticamente, injetando o objeto `dependencies`:

```json
"dependencies": {
  "next": "^13.1.6",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```
