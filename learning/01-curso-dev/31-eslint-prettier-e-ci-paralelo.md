# Qualidade de Código: Gestão de Dependências, ESLint, Prettier e Paralelismo no CI

Este documento consolida a arquitetura de análise estática do projeto. Detalhamos as dependências instaladas, os scripts de automação, a separação de responsabilidades entre Formatadores (Prettier) e Linters (ESLint) e a orquestração de testes em paralelo na esteira de CI/CD.

---

## 1. Fundação: Gestão de Dependências e Scripts (`package.json`)

Para habilitar a análise estática avançada, expandimos a fundação do nosso projeto com bibliotecas específicas de qualidade de código.

### Instalação de Dependências (DevDependencies):

Foram adicionados os pacotes centrais do ESLint, os plugins específicos para Next.js e Jest, e a configuração integradora do Prettier para evitar conflitos:

```json
  "devDependencies": {
    "@eslint/js": "^9.39.5",
    "concurrently": "^8.2.2",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.15",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-jest": "^28.6.0",
    "jest": "^29.6.2",
    "node-pg-migrate": "^9.0.0",
    "prettier": "^3.8.3",
    "typescript": "^6.0.3"
  }
```

### Mapeamento de Scripts Granulares:

Substituímos os scripts genéricos por comandos granulares e descritivos. Isso permite que tanto o desenvolvedor local quanto a esteira de CI executem verificações isoladas:

```json
  "scripts": {
    "lint:check": "prettier --check .",
    "lint:prettier:check": "prettier --check .",
    "lint:fix": "prettier --write .",
    "lint:prettier:fix": "prettier --write .",
    "lint:eslint:check": "next lint --dir .",
    // ... demais scripts omitidos para brevidade ...
  }
```

---

## 2. Separação de Preocupações: Prettier vs ESLint

Para garantir uma base de código imaculada, adotamos duas ferramentas com responsabilidades estritamente separadas:

- **Prettier (O Formatador):** Focado exclusivamente na sintaxe e estilo (espaçamentos, quebras de linha, aspas). Ele garante que todos os desenvolvedores escrevam códigos visualmente idênticos.
- **ESLint (O Analisador de Qualidade):** Focado na detecção de _Code Smells_, bugs potenciais, variáveis não utilizadas e violações de padrões de arquitetura.

---

## 3. A Arquitetura do `.eslintrc.json`

Criamos o arquivo de configuração `.eslintrc.json` na raiz do projeto para ditar as regras do nosso inspetor, herdando pacotes de regras consolidadas:

```json
{
  "extends": [
    "eslint:recommended",
    "next/core-web-vitals",
    "plugin:jest/recommended",
    "prettier"
  ]
}
```

### Dissecando a Herança de Regras:

1. **`eslint:recommended`**: Ativa regras vitais do JavaScript moderno.
2. **`next/core-web-vitals`**: Regras estritas do Next.js (ex: exige o uso do componente otimizado `<Image />`).
3. **`plugin:jest/recommended`**: Regras de segurança para testes (ex: proíbe o uso isolado de `test.only()`).
4. **`prettier`**: A "cola" arquitetural. Como o ESLint possui regras antigas de formatação, ele entraria em conflito com o Prettier. Esta extensão desliga todas as regras cosméticas do ESLint, delegando a estética 100% ao Prettier.

---

## 4. Escalabilidade Horizontal no GitHub Actions (`linting.yml`)

Evoluímos nosso arquivo `.github/workflows/linting.yml` adicionando um novo _job_ para o ESLint:

```yaml
name: Linting

on: pull_request

jobs:
  prettier:
    name: Prettier linting
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.9.0
      - run: npm ci
      - run: npm run lint:prettier:check

  eslint:
    name: Eslint linting
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.9.0
      - run: npm ci
      - run: npm run lint:eslint:check
```

### O Impacto na Infraestrutura:

Ao definir `eslint` como um _job_ irmão, o GitHub Actions provisiona **múltiplos _Runners_ (Máquinas Virtuais) rodando paralelamente**. Isso resulta em um paradigma de _Fail Fast_. Se houver um erro de qualidade de código, a máquina do ESLint derrubará a esteira instantaneamente de forma isolada, indicando o erro exato na interface do Pull Request.
