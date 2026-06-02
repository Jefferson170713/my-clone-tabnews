# Fundamentos de Testes Automatizados com Jest

Este documento consolida os aprendizados das aulas 56 a 65 do curso.dev, detalhando a implementação do framework Jest como Test Runner do projeto, o fluxo de desenvolvimento com o modo watch e a anatomia de um teste automatizado.

---

## 1. O papel do Test Runner (Jest) na Engenharia de Software

Um **Test Runner** é a infraestrutura responsável por encontrar, executar e reportar o resultado de testes automatizados em uma aplicação. Para o Clone do TabNews, a escolha foi o **Jest (v29.6.2)**, um framework de testes em JavaScript focado na simplicidade e performance.

### Instalação como Dependência de Desenvolvimento:

Como os testes são ferramentas utilizadas estritamente pelo engenheiro durante o ciclo de desenvolvimento (e não pelo usuário final em produção), o framework foi instalado com a flag `-D`:

```bash
npm install --save-dev jest@29.6.2
```

---

## 2. Automação de Atalhos e o Modo Watch

No arquivo de manifesto do projeto (`package.json`), foram mapeados dois scripts fundamentais para o gerenciamento de testes:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

### Diferença Crítica dos Comandos:

- **`npm test`**: Executa o Jest em modo de varredura única (_Single Run_). Ele varre o projeto, roda todos os testes encontrados, exibe o relatório final no terminal e encerra o processo. É o comando perfeito para ser executado de forma automática em esteiras de Continuous Integration (CI).
- **`npm run test:watch`**: Inicia o Jest em modo de observação contínua. O framework fica acoplado ao monitor do sistema operacional. Toda vez que um arquivo de código ou de teste for salvo, o Jest recalcula as dependências e executa de forma isolada apenas os testes afetados por aquela alteração, fornecendo feedback instantâneo ao desenvolvedor.

---

## 3. Padrão de Identificação de Arquivos

O Jest adota uma convenção de nomenclatura estrita para identificar o que é código de produção e o que é especificação de teste. Criamos a pasta `test/` na raiz do projeto e nela inserimos o arquivo com o padrão do framework.

Caminho do arquivo: test/calculadora.test.js

O sufixo **`.test.js`** (ou `.spec.js`) serve como uma flag para a engine do Jest. Arquivos comuns como `calculadora.js` são ignorados pelo Runner, garantindo que apenas os arquivos de asserção entrem no ciclo de execução de testes.

---

## 4. Anatomia e Ciclo de Vida de um Teste (Padrão AAA)

A estrutura de um arquivo de teste implementa o concept de asserção programática. Veja o exemplo estruturado:

```javascript
test("01 - função teste - Soma", () => {
  // 1. Arrange (Organizar o cenário)
  const a = 10;
  const b = 7;

  // 2. Act (Executar a ação)
  const resultado = a + b;

  // 3. Assert (Verificar a expectativa)
  expect(resultado).toBe(17);
});
```

### Componentes do Bloco de Código:

- **`test()`**: Função global do Jest que registra uma unidade de teste no Runner. O primeiro argumento é uma string descritiva que mapeia o comportamento esperado.
- **`expect()`**: Método de asserção. Ele recebe o valor real gerado pela execução do seu código.
- **`.toBe()`**: Um _matcher_ (comparador) do Jest. Ele faz uma comparação de igualdade estrita (`===`) entre o valor passado para o `expect` e o valor esperado pelo desenvolvedor. Se a comparação for falsa, o Jest interrompe a execução, marca o teste como falho (_failed_) e exibe um relatório detalhado mostrando a linha exata do erro.
