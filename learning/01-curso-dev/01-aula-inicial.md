# Diário de Bordo: Fundamentos, Ambiente e Gerenciamento de Versões

Este documento consolida os aprendizados das aulas 06 a 10 do curso.dev, focando no setup do ambiente de desenvolvimento moderno utilizando GitHub Codespaces, isolamento de infraestrutura e governança de versões.

---

## 1. Setup do Ambiente e Produtividade (Aulas 06 e 07)

O desenvolvimento moderno exige consistência. Para mitigar o clássico problema do *"na minha máquina funciona"*, o projeto adota o **GitHub Codespaces**, um ambiente de desenvolvimento baseado em nuvem que roda dentro de um container Docker seguro e padronizado.

### Extensões Essenciais Configuradas no Ambiente:
- **Material Icon Theme:** Padronização visual de ícones para identificação rápida de extensões de arquivos, reduzindo a carga cognitiva durante a navegação na árvore de diretórios.
- **Dracula Official:** Tema escuro de alto contraste que melhora a ergonomia visual para longas jornadas de programação.
- **Markdown All in One / View:** Habilita a visualização em tempo real (preview) da documentação técnica, garantindo a qualidade da escrita antes do commit.

---

## 2. Pilares de Infraestrutura do Projeto (Aula 08)

A arquitetura do projeto foi desenhada para depender do mínimo possível de instalações globais na máquina local. Toda a stack necessária é composta por duas tecnologias fundamentais, já nativas no Codespaces:

### A. Node.js
Diferente do conceito tradicional, o Node.js **não é uma linguagem de programação e nem um simples interpretador**. Ele é um **ambiente de execução (runtime)** assíncrono para JavaScript, construído sobre o motor V8 do Google Chrome. Ele permite a execução de código JavaScript diretamente no lado do servidor (backend), fornecendo APIs nativas para manipulação de sistema de arquivos, criptografia e redes.

- **Comando de Verificação:**
```bash
node -v
```
*Exibe a versão do runtime ativa no terminal.*

### B. Docker e Docker Compose
O **Docker** é uma plataforma de conteinerização que utiliza virtualização a nível de sistema operacional (kernel compartilhado) para isolar o software em ambientes leves chamados containers. Neste projeto, utilizaremos o Docker para subir instâncias de bancos de dados (como o PostgreSQL) sem a necessidade de instalar o banco diretamente no sistema operacional do Codespaces.
O **Docker Compose** é uma ferramenta complementar utilizada para definir e orquestrar múltiplos containers Docker por meio de um arquivo de configuração declarativo estruturado.

- **Comandos de Verificação:**
```bash
docker -v
docker compose -v
```
*Garantem que a engine do Docker e o orquestrador Compose estão operacionais no ambiente.*

---

## 3. Governança e Versionamento com NVM (Aulas 09 e 10)

O **NVM (Node Version Manager)** é um utilitário essencial para gerenciamento de ambientes. Em uma corporação, diferentes sistemas rodam em diferentes versões do Node.js. O NVM resolve esse problema permitindo instalar e alternar entre múltiplas versões do runtime de forma isolada na mesma máquina.

### Comandos de Inspeção e Configuração:
- **Listar versões locais e remotas:**
```bash
nvm list
```
- **Definir um apelido (alias) padrão para o terminal:**
```bash
nvm alias default lts/hydrogen
```
*Garantem que qualquer novo terminal aberto neste ambiente iniciará automaticamente utilizando a versão especificada.*

### Governança do Projeto com `.nvmrc`
Para assegurar a reprodutibilidade do projeto e garantir que futuros desenvolvedores (or esteiras de automação de CI/CD) utilizem exatamente a mesma versão do ecossistema, foi criado o arquivo `.nvmrc` na raiz do projeto com o seguinte conteúdo:

```text
lts/hydrogen
```

Isso documenta que o projeto utiliza a versão estável **Node.js 18 (LTS Hydrogen)**. Quando um novo engenheiro clonar o repositório, ele não precisará adivinhar a versão; bastará executar o comando de sincronização no terminal.

- **Comando de Ativação do Arquivo de Configuração:**
```bash
nvm use
```
*O NVM lerá automaticamente o arquivo `.nvmrc` presente no diretório atual e aplicará a versão correta instantaneamente.*

```text
my-clone-tabnews/
├── .nvmrc
├── README.md
└── learning/                  <-- Sua pasta principal de estudos
    ├── 01-curso-dev/          <-- Conteúdo sequencial das aulas
    │   ├── 01-introducao.md
    │   ├── 02-setup-ambiente.md
    │   └── 03-variaveis-amb.md
    └── 02-conhecimento-geral/ <-- Conceitos base (tecnologias, arquitetura)
        ├── git/
        │   └── comandos-uteis.md
        ├── docker/
        │   └── conceitos-basicos.md
        └── arquitetura/
            └── solid.md
```