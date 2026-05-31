# Automação de Formatação de Código com Prettier

Este documento consolida os aprendizados das aulas 43 e 44 do curso.dev, focando na instalação do Prettier como dependência de desenvolvimento e na automação de checagem e correção estética via scripts do NPM.

---

## 1. O que é o Prettier e para que serve?

O **Prettier** é um formatador de código opinativo (_opinionated code formatter_). Ele serve para automatizar completamente a estética do código, garantindo que todo o projeto siga exatamente o mesmo padrão visual (estilo de aspas, pontos e vírgulas, quebras de linha e espaçamentos).

Diferente do `.editorconfig`, que atua enquanto você digita, o Prettier atua processando o arquivo pronto. Ele analisa o código gerado, remove toda a formatação manual e o reescreve aplicando regras padronizadas de mercado. Isso elimina discussões em times sobre "onde quebrar a linha" e acelera o processo de Code Review.

---

## 2. Gerenciamento de Dependências: A Flag `-D`

Para instalar o Prettier no projeto, executamos no terminal o comando:

```bash
npm install -D prettier
```

_(O comando também pode ser executado como `npm install --save-dev prettier`)_

### O Impacto Arquitetural no `package.json`

A flag `-D` avisa ao NPM que o Prettier é uma **dependência de desenvolvimento** (_devDependencies_).

Na arquitetura de software, separamos o manifesto do projeto em dois grupos:

1. **`dependencies`**: Bibliotecas que o software precisa para rodar em produção (ex: Next.js, React). Sem elas, o sistema quebra para o usuário final.
2. **`devDependencies`**: Ferramentas que só o desenvolvedor precisa para trabalhar no código (ex: formatadores, linters, ambientes de teste). Quando o projeto vai para o servidor de produção, essas ferramentas são descartadas, deixando o pacote final mais leve e seguro.

Após a execução, o `package.json` injeta automaticamente o novo bloco:

```json
"devDependencies": {
  "prettier": "^3.x.x"
}
```

---

## 3. Automação de Qualidade com NPM Scripts

Para facilitar a execução do Prettier no dia a dia e permitir que esteiras de automação futuras (CI/CD) testem a qualidade do código, inserimos dois comandos especializados na seção `scripts` do `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "lint:check": "prettier --check .",
  "lint:fix": "prettier --write ."
}
```

### Explicação Técnica dos Comandos:

- **`npm run lint:check`**: Executa o comando `prettier --check .`. O caractere ponto (`.`) instrui a ferramenta a varrer o diretório atual e todas as subpastas. O Prettier fará apenas uma auditoria, listando no terminal quais arquivos violam as regras de estilo, sem alterá-los. Retorna um código de erro caso encontre problemas (ideal para travar deploys incorretos).
- **`npm run lint:fix`**: Executa o comando `prettier --write .`. Este é o comando corretivo. O Prettier varrerá todo o projeto e reescreverá fisicamente todos os arquivos que estiverem fora do padrão, alinhando-os instantaneamente.
