# Estratégia de Testes: A Pirâmide de Testes e Remodelação de Diretórios

Este documento consolida os aprendizados das aulas 65 a 68 do curso.dev, detalhando o conceito teórico da Pirâmide de Testes e a reestruturação física do diretório `test/` para isolamento de escopos em testes Unitários e de Integração.

---

## 1. O Conceito Conceitual da Pirâmide de Testes

Na engenharia de software de alta performance, a **Pirâmide de Testes** é um modelo que dita a proporção ideal de tipos de testes automatizados que uma aplicação deve possuir para garantir qualidade sem inflar os custos de manutenção e o tempo de execução do pipeline.

A pirâmide é baseada em três regras de proporção inversa: **Velocidade, Custo e Confiança**.

### Camada 1: Testes Unitários (A Base)

- **Escopo:** Testam a menor unidade avaliável de código de forma isolada (funções puras, métodos de modelos, algoritmos de validação).
- **Características:** Não realizam chamadas de rede, não acessam sistemas de arquivos e não se conectam a bancos de dados. Utilizam stubs ou mocks para simular dependências.
- **Vantagens:** São executados em frações de milissegundos e possuem custo de manutenção baixíssimo. Representam a maior fatia do volume de testes do projeto.

### Camada 2: Testes de Integração (O Meio)

- **Escopo:** Testam a comunicação e o acoplamento entre múltiplos módulos da aplicação ou entre a aplicação e componentes externos (chamadas HTTP a endpoints de API, persistência em bancos de dados).
- **Características:** Exigem que os serviços estejam disponíveis de forma local ou conteinerizada (como instâncias do PostgreSQL via Docker).
- **Vantagens:** Garantem que os componentes do sistema funcionam de forma integrada. São mais lentos que os unitários, porém oferecem maior nível de fidelidade com o cenário real.

### Camada 3: Testes End-to-End / E2E (O Topo)

- **Escopo:** Simulam a jornada completa do usuário final do início ao fim do fluxo (ex: abrir o navegador, preencher o formulário de login, clicar no botão de submissão e validar a renderização do dashboard).
- **Características:** Utilizam ferramentas que automatizam navegadores reais (Cypress, Playwright).
- **Desvantagens:** São extremamente lentos, consomem muitos recursos de hardware e são frágeis a alterações estéticas da interface. Por isso, devem ser aplicados apenas nos fluxos críticos do software.

---

## 2. Remodelação Arquitetural do Diretório /test

Para refletir a teoria da pirâmide na estrutura do projeto Clone do TabNews, o diretório de testes foi remodelado para separar fisicamente as responsabilidades de execução, evitando que testes rápidos rodem misturados com testes de integração pesados.

A estrutura de pastas ficou definida assim dentro da raiz:

- test/unit/ para os testes isolados (ex: calculadora.test.js)
- test/integration/ para os futuros testes de rotas de API e banco de dados

### O impacto no Test Runner (Jest)

O Jest interpretará nativamente as subpastas. Essa separação nos permite, no futuro, criar scripts customizados no package.json para rodar apenas os testes unitários rápidos durante o desenvolvimento diário, deixando os testes de integração para rodarem em momentos específicos do ciclo de deploy.
