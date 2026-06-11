# Automação de DX (Developer Experience), Precedência de Ambientes e Caminhos Absolutos

Este documento consolida e aprofunda os aprendizados das aulas 82 a 85 do curso.dev, detalhando a orquestração sequencial de processos via CLI, a governança de arquivos de ambiente específicos do Next.js e o mapeamento de caminhos absolutos (_Absolute Imports_) via `jsconfig.json`.

---

## 1. Orquestração de Processos Sequenciais com Operadores CLI

Para otimizar a Experiência do Desenvolvedor (DX), consolidamos o fluxo de inicialização da aplicação em um único comando automatizado na seção de `scripts` do `package.json`:

```json
"scripts": {
  "dev": "docker compose -f infra/compose.yaml up -d && next dev"
}
```

### Mecânica do Operador Chaining `&&`:

No interpretador de comandos de sistemas baseados em Unix (como a engine Linux por trás do GitHub Codespaces), o operador lógico `&&` realiza uma execução condicional sequencial à esquerda. O terminal executa o comando de inicialização do banco de dados no Docker em modo destacado (_detached_).

A aplicação backend do Next.js (`next dev`) só será instanciada se, e somente se, o processo do Docker Compose retornar um código de encerramento bem-sucedido (`exit code 0`). Isso impede falhas de runtime onde a aplicação tenta subir sem a infraestrutura de dados estar pronta na rede.

---

## 2. Matriz de Precedência de Ambientes no Next.js

A alteração do arquivo genérico `.env` para **`.env.development`** introduz o conceito de isolamento de contextos de execução. O Next.js possui um algoritmo nativo de detecção que injeta variáveis baseado no valor da variável interna `NODE_ENV`:

Quando executamos o script `npm run dev`, o framework assume o modo de desenvolvimento e carrega os arquivos seguindo uma ordem estrita de prioridade decrescente:

1. `.env.development.local` (Configurações locais de desenvolvimento que anulam as demais)
2. `.env.local` (Configurações locais globais)
3. **`.env.development`** (Valores padrões de desenvolvimento que são commitados no repositório)
4. `.env` (Valores globais genéricos)

Essa separação é vital para a arquitetura, pois permite mapear credenciais de bancos de dados limpos para a suíte de testes (via `.env.test`) sem corromper ou misturar os registros gerados durante o desenvolvimento manual na interface.

---

## 3. Resolução de Caminhos Absolutos via `jsconfig.json`

O uso de caminhos relativos extensos (`../../../../infra/database.js`) eleva a carga cognitiva, dificulta refatorações automáticas e introduz fragilidade à árvore de diretórios. Para resolver esse gargalo de arquitetura, criamos o arquivo de governança do compilador **`jsconfig.json`** na raiz do projeto:

```json
{
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

### Explicação Técnica:

O parâmetro `"baseUrl": "."` instrui o mecanismo de resolução de módulos do Node.js e a IDE (VS Code) a tratarem a raiz do repositório (onde o arquivo está alocado) como o ponto zero para buscas de caminhos de arquivos.

Com essa regra aplicada, refatoramos o controlador em `pages/api/v1/status/index.js` para realizar imports limpos e absolutos diretamente da raiz do projeto:

```javascript
// Importação absoluta protegida contra mudanças de níveis de diretórios
import database from "infra/database.js";

async function status(request, response) {
  const result = await database.query("SELECT 1 + 1 as sum;");
  console.log(result.rows[0]);
  response.status(200).json({
    "teste de api funcionando": "ok",
  });
}

export default status;
```
