# Arquitetura Defensiva: Padrão Early Return, Fail Fast e Blocos Try/Catch/Finally

Este documento analisa a refatoração crítica de segurança e estabilidade (Leak Prevention) implementada no endpoint de migrações da API, focada em validação semântica de métodos HTTP e blindagem de conexões TCP.

---

## 1. Padrão de Arquitetura: Fail Fast (Early Return)

### O Problema (Conexões Desperdiçadas e Vazamento em Métodos não suportados):

No design original do endpoint de migrações, a abertura da conexão com o banco de dados era incondicional, ocorrendo na primeira linha do controlador:

```javascript
export default async function migrations(request, response) {
  // Abertura incondicional: Se for um método não suportado (ex: PUT), a conexão abre e NUNCA fecha.
  const dbClient = await database.getNewClient();
  // ... ifs de GET e POST ...
  return response.status(405).end();
}
```

Isso criava uma vulnerabilidade catastrófica de _Connection Leak_ (vazamento de conexões) caso clientes fizessem requisições com métodos diferentes de GET ou POST.

### A Solução (Fail Fast e Validação de Contrato):

Implementamos o conceito de **Retorno Antecipado (Early Return)**. Validamos o método HTTP recebido contra uma _Allowlist_ (lista de permissões) antes de executar qualquer lógica de negócio cara (como alocar conexões de rede).

```javascript
const allowedMethods = ["GET", "POST"];
if (!allowedMethods.includes(request.method)) {
  // Falha rápido, sem encostar no banco de dados, protegendo a infraestrutura.
  return response.status(405).json({
    error: `Method ${request.method} Not Allowed`,
  });
}
```

---

## 2. Blindagem de Infraestrutura com `try/catch/finally`

Ainda que o erro do método HTTP tenha sido resolvido, o fluxo interno do `migrationRunner` lida com arquivos de sistema e comandos SQL complexos que podem lançar Exceções Críticas (_Exceptions_) em tempo de execução.

Se o pacote de migração falhar (ex: erro de sintaxe SQL no arquivo da migration), a execução é paralisada na hora. Qualquer chamada manual para fechar o cliente (`dbClient.end()`) posicionada abaixo do erro seria ignorada.

Para garantir a higienização da memória do servidor, encapsulamos o motor de migrações em uma estrutura de proteção absoluta:

```javascript
let dbClient;
try {
  dbClient = await database.getNewClient();

  // Executa lógicas pesadas e passíveis de falha (I/O, rede, disco)
  // ...
} catch (error) {
  // Intercepta e loga a falha, sem derrubar silenciosamente a aplicação
  console.error("Error running migrations:", error);
  throw error;
} finally {
  // Bloco de execução GARANTIDA. Ocorre após o sucesso (try) ou após a falha (catch).
  // Garante que o recurso externo TCP seja devolvido ao sistema operacional.
  await dbClient.end();
}
```

Essa técnica isola a regra de negócios dos vazamentos de infraestrutura, alinhando a aplicação às diretrizes de sistemas altamente disponíveis (High Availability).
