# Guia de Convenções Git e Commits Semânticos

Este documento serve como o manual oficial de padronização para o histórico de versionamento do projeto. Seguindo o padrão **Conventional Commits**.

---

## 1. Estrutura Padrão do Commit

Toda mensagem de commit deve seguir a seguinte estrutura:

```test
   <tipo>(<escopo>): <descrição curta em minúsculo>
```

- **Tipo**: OBRIGATÓRIO. Indica a natureza da alteração (ex: nova funcionalidade, correção).
- **Escopo**: OPCIONAL (mas recomendado). Indica qual parte do código foi afetada (ex: readme, login, banco-dados).
- **Descrição**: OBRIGATÓRIO. Um resumo claro, direto, no presente e iniciando em letra minúscula.

---

## 2. Tipos de Commit Mais Utilizados (Padrão de Mercado)

| Tipo         | Quando usar?                                                                                         | Exemplo Prático                                                |
| :----------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **feat**     | Quando você adiciona uma nova funcionalidade ao sistema.                                             | feat(api): adiciona rota de criação de usuários                |
| **fix**      | Quando você corrige um bug ou comportamento incorreto.                                               | fix(auth): corrige expiração do token de sessão                |
| **docs**     | Alterações exclusivas na documentação (README, manuais).                                             | docs(readme): atualiza instruções de pré-requisitos            |
| **style**    | Mudanças de estilo/formatação que não alteram a lógica (espaços, ponto e vírgula, lint).             | style(css): centraliza botão do card de notícias               |
| **refactor** | Alteração no código que melhora a estrutura interna sem mudar o comportamento público.               | refactor(db): otimiza query de busca de posts                  |
| **test**     | Criação, modificação ou correção de testes unitários ou de integração.                               | test(user): adiciona teste para e-mail duplicado               |
| **chore**    | Atualizações de tarefas de build, pacotes adicionados no package.json, configurações de ferramentas. | chore(deps): adiciona pacote dotenv para variáveis de ambiente |

---

## 3. As 4 Regras de Ouro para a Descrição

Para manter o histórico legível por humanos e ferramentas de automação, a descrição do commit deve seguir estas diretrizes:

1. **Use o modo imperativo (no presente):** Escreva como se estivesse dando uma ordem ao código.
   - Errado: feat(api): adicionado rota de login ou feat(api): adicionando rota de login
   - Certo: feat(api): adiciona rota de login
2. **Inicie sempre com letra minúscula:** A primeira letra após os dois pontos (:) nunca deve ser maiúscula.
3. **Não coloque ponto final:** A mensagem de commit é um título, não um parágrafo. Evite terminar com ponto.
4. **Limite de 50 caracteres:** Seja sucinto. Se precisar explicar muito, a alteração deveria ter sido dividida em commits menores.

---

## 4. Mudanças de Ruptura (Breaking Changes) ⚠️

Uma Breaking Change ocorre quando você faz uma alteração no código que quebra a compatibilidade com versões anteriores (ex: deletar uma rota que o frontend usava, ou mudar o nome de uma coluna crucial no banco de dados).

Para sinalizar isso no padrão semântico, adicionamos uma exclamação (!) logo após o escopo. Isso avisa as ferramentas de CI/CD para gerarem uma nova Major Version do software de forma automática.

### Exemplos:

- feat(api)!: altera o formato de retorno do payload de autenticação
- refactor(db)!: remove a tabela temporaria de logs antigos

---

## 5. Dicionário de Escopos do Projeto (Mapeamento)

Para evitar que cada hora você invente um nome de escopo diferente, ficam padronizados os seguintes escopos para o nosso projeto:

- learning: Para resumos, anotações e guias criados na pasta de estudos.
- readme: Alterações exclusivas no arquivo README.md principal.
- api: Códigos relacionados ao backend (Node.js, rotas, controladores).
- web: Códigos relacionados ao frontend (React, Next.js, componentes).
- db: Scripts de banco de dados, migrações ou modelagem de dados.
- infra: Configurações de Docker, ambientes ou esteiras do GitHub Actions.
