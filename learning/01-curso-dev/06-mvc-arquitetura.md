# Arquitetura de Software: Padronização MVC e Isolamento de Infraestrutura

Este documento consolida os aprendizados das aulas 44 a 56 do curso.dev, detalhando a proposta de arquitetura de pastas adotada para a segunda milestone do projeto, baseada no padrão conceitual MVC adaptado para o Next.js e isolamento de Infraestrutura.

---

## 1. O Padrão Arquitetural MVC no Ecossistema Moderno

Para garantir escalabilidade, testabilidade e manutenibilidade do código do Clone do TabNews, o projeto adota o padrão **MVC (Model-View-Controller)**. Este padrão separa a lógica da aplicação em três camadas de responsabilidade única:

- **View (Visão - Pasta `pages/`):** Camada de interface com o usuário. No Next.js, os componentes React estruturados dentro do diretório `pages/` funcionam como as visões do sistema, responsáveis por renderizar o JSX e capturar as interações do usuário.
- **Model (Modelo - Pasta `models/`):** O coração da aplicação. Aqui residem as regras de negócio cruciais, validações de dados, regras de criptografia e manipulação das entidades (ex: regras para criação de usuários em `user.js` ou controle de tópicos em `content.js`). O modelo não sabe quem o está chamando e nem qual banco de dados está sendo usado.
- **Controller (Controlador - Integrado nas Rotas de API):** Atua como o intermediário. No Next.js, as rotas de API backend (que serão criadas no padrão `pages/api/`) funcionam como os Controladores, recebendo as requisições HTTP, acionando as regras de negócio dos modelos e retornando as respostas apropriadas.

---

## 2. A Camada Especializada de Infraestrutura (`infra/`)

Aplicações reais de mercado necessitam interagir com serviços externos. Para evitar que os nossos modelos fiquem poluídos com códigos de conexão física, criamos a camada **`infra/`**. Ela é responsável pelo isolamento tecnológico:

- **`infra/database.js`**: Centraliza o cliente de conexão com o banco de dados (PostgreSQL). Se no futuro precisarmos trocar o driver do banco ou alterar a estratégia de pooling de conexões, alteramos apenas este arquivo.
- **`infra/migrations/`**: Armazena os scripts declarativos de evolução do esquema do banco de dados (criação de tabelas, alteração de colunas). Garante que o banco possa ser recriado idêntico em qualquer ambiente.
- **`infra/provisioning/`**: Configurações de infraestrutura como código (Iac) ou scripts de inicialização para subir os ambientes de desenvolvimento (`starting/`) e produção (`production/`).

---

## 3. Benefícios Práticos da Arquitetura Adotada

1. **Testabilidade Isolada:** É possível testar as regras de negócio contidas na pasta `models/` sem precisar subir uma interface gráfica (View) ou simular cliques na tela.
2. **Desacoplamento Técnico:** A lógica de negócio (`models`) fica completamente protegida e separada da infraestrutura física de banco de dados (`infra`) e da camada de entrega web (`pages`).
3. **Paralelismo no Desenvolvimento:** Um desenvolvedor pode trabalhar na interface visual do feed (`pages/index.js`) enquanto outro implementa as validações de senha no backend (`models/password.js`) sem gerar conflitos de código.
