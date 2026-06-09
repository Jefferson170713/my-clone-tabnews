# Configurações de Ambiente, Segurança de Credenciais e Injeção Dinâmica

Este documento consolida e aprofunda os conceitos aprendizados nas aulas 79 a 81 do curso.dev, abordando a arquitetura de injeção de dependências por meio de variáveis de ambiente, o comportamento de runtime do objeto global `process.env` no ecossistema Node.js/Next.js e as boas práticas de governança de código para prevenção de vazamento de credenciais secretas.

---

## 1. Fundamentos Arquiteturais de Variáveis de Ambiente

Na engenharia de software baseada nas melhores práticas de mercado (como as diretrizes estabelecidas no manifesto *The Twelve-Factor App*), as configurações de um sistema devem ser completamente isoladas do código-fonte. Configurações são tudo aquilo que pode mudar entre diferentes implantações de deploy (Ambiente Local de Desenvolvimento, Servidores de Homologação, Instâncias de Produção).



### O Objeto Global `process.env`:
No ambiente de execução Node.js, `process` é um objeto global que fornece informações sobre o processo de runtime em execução. A propriedade `process.env` expõe um objeto contendo o estado das variáveis de ambiente do sistema operacional no momento em que o processo foi iniciado.

### Suporte Nativo do Next.js (Dotenv Embutido):
O Next.js encapsula nativamente a lógica de carregamento do ecossistema `dotenv`. Durante a inicialização do servidor de desenvolvimento (`npm run dev`) ou da suite de testes (`npm run test:watch`), o framework localiza os arquivos de ambiente na raiz do projeto, faz o parsing das strings de chave-valor e as injeta diretamente no objeto `process.env`. Isso impede a exposição de dados sensíveis diretamente nos arquivos JavaScript.

---

## 2. Implementação e Parametrização Customizada

Para o ecossistema do Clone do TabNews, abandonamos os parâmetros padrões e genéricos de banco de dados, adotando credenciais customizadas exclusivas para o escopo local através do arquivo **`.env`** criado na raiz do projeto:

```text
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=local_user
POSTGRES_DB=local_db
POSTGRES_PASSWORD=local_password
```

### Refatoração da Camada de Infraestrutura (`infra/database.js`):
A camada de persistência foi completamente desacoplada de strings estáticas (*hardcoded*). O cliente de conexão do driver `pg` agora lê dinamicamente as variáveis de ambiente injetadas no ciclo de execução do Node.js:

```javascript
import { Client } from "pg";

async function query(queryObject) {
  // Instanciação dinâmica mapeando o dicionário de variáveis do sistema
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB, // Associa a chave customizada à propriedade exigida pelo driver
    password: process.env.POSTGRES_PASSWORD,
  });

  // Gerenciamento do ciclo de vida da conexão TCP/IP
  await client.connect();
  const result = await client.query(queryObject);
  await client.end(); // Liberação mandatória do socket de rede
  
  return result;
}

export default {
  query: query,
};
```

---

## 3. Governança, Ciclo de Testes e Segurança da Informação

### Proteção Perimetral via `.gitignore`:
Arquivos contendo segredos, senhas e chaves privadas nunca devem ser indexados ou versionados em repositórios remotos como o GitHub. Para impor essa restrição de segurança, adicionamos uma diretiva explícita no arquivo `.gitignore` localizado na raiz do projeto:

```text
# Segurança da Informação: Bloqueio estrito de arquivos de credenciais locais
*.env
```

Com essa regra ativa, o motor do Git ignora completamente qualquer arquivo com a extensão `.env`, mitigando riscos de vazamentos acidentais que possam comprometer a integridade da infraestrutura.

### Orquestração de Terminais para Validação:
Para validar a coesão da refatoração, o ecossistema exige a execução paralela de três processos distribuídos:
1. **Terminal de Infraestrutura:** `docker compose -f infra/compose.yaml up -d` (Garante a disponibilidade do motor do banco).
2. **Terminal de Aplicação:** `npm run dev` (Inicia o servidor web Next.js injetando as variáveis do `.env`).
3. **Terminal de Automação:** `npm run test:watch` (Executa continuamente as asserções de integração HTTP coletando os segredos de ambiente).