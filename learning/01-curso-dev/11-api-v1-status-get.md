# Testes de Integração HTTP e Versionamento de Endpoints (API v1)

Este documento consolida os aprendizados das aulas 70 e 71 do curso.dev, detalhando a reestruturação das rotas backend para introdução de versionamento de API, o uso de arquivos indexadores para escalabilidade de rotas e a implementação do primeiro teste de integração HTTP assíncrono.

---

## 1. Governança e Versionamento de APIs (/v1/)

Na engenharia de software, os contratos de uma API devem ser previsíveis e estáveis. Para evitar que futuras atualização no Clone do TabNews quebrem sistemas integrados ou clientes legados, foi introduzida a convenção de versionamento na estrutura de diretórios:

Caminho do arquivo: pages/api/v1/status/index.js

### O impacto de renomear para index.js:

No roteador baseado em arquivos do Next.js, apontar para um arquivo chamado index.js dentro de um diretório faz com que o nome do arquivo seja omitido da URL final. Portanto, o endpoint responde na URL limpa: /api/v1/status.

Essa abordagem encapsula a rota em um diretório próprio. Se no futuro for necessário criar ramificações para o status (como /api/v1/status/health ou /api/v1/status/metrics), novos arquivos podem ser criados dentro da mesma pasta status/, mantendo a coesão arquitetural do módulo.

---

## 2. Implementação do Primeiro Teste de Integração HTTP

Diferente dos testes unitários (que avaliam funções isoladas em memória), os Testes de Integração validam se múltiplos componentes da aplicação funcionam corretamente de forma combinada (Roteador do Next.js + Manipulador da Rota + Resposta HTTP).

Criamos a estrutura física de testes espelhando a arquitetura da aplicação:
Caminho do teste: test/integration/api/v1/status/get.test.js

O prefixo get no nome do arquivo serve para documentar que este arquivo de teste valida especificamente o comportamento do método HTTP GET naquele endpoint.

### Código da Especificação do Teste:

```javascript
test("GET to api/v1/status should return status 200", async () => {
  // Dispara uma requisição HTTP real contra o servidor local em execução
  const response = await fetch("http://localhost:3000/api/v1/status");

  // Asserção: Verifica se o servidor respondeu com o código de sucesso 200 OK
  expect(response.status).toBe(200);
});
```

### Detalhes Técnicos da Execução Assíncrona:

- **async / await**: Operações de rede (I/O) são não-bloqueantes no Node.js. A palavra-chave async sinaliza ao Jest que o teste lida com uma Promessa (Promise). O operador await pausa a execução do teste até que o pacote HTTP de resposta seja totalmente recebido, permitindo que a asserção ocorra com os dados reais em mãos.
- **fetch()**: API nativa do ambiente de execução utilizada para disparar a requisição de leitura contra o servidor local ativado via npm run dev.

---

## 3. O Fluxo de Feedback com o Test Runner

Com o Jest rodando continuamente através do script customizado:

```bash
npm run test:watch
```

Toda vez que o código do handler em pages/api/v1/status/index.js ou a asserção em get.test.js forem salvos, o ciclo de integração é disparado automaticamente. Isso garante feedback instantâneo sobre a integridade da API, blindando o fluxo de desenvolvimento contra regressões de código.
