# Fundamentos de APIs, Protocolo HTTP e Next.js API Routes

Este documento consolida os aprendizados da aula 69 do curso.dev, detalhando o funcionamento conceitual de uma API, o sistema de roteamento backend do Next.js e a anatomia de uma requisição/resposta HTTP inspecionada via terminal com cURL.

---

## 1. O que é uma API e o conceito de Serverless do Next.js

Uma **API (Application Programming Interface)** é um conjunto de definições e protocolos que permite que diferentes aplicações de software se comuniquem entre si por meio de regras padronizadas. No desenvolvimento web, uma API geralmente recebe dados através de uma requisição na internet e devolve uma resposta estruturada (geralmente em formato JSON).

### API Routes no Next.js:

O Next.js adota o conceito de **File-system Routing** tanto para páginas frontend quanto para endpoints backend. Ao criarmos a pasta `pages/api/`, qualquer arquivo JavaScript colocado ali dentro se transforma automaticamente em um endpoint de API REST executado no lado do servidor (Node.js).

- O arquivo `pages/api/status.js` é mapeado de forma nativa para a URL: `http://localhost:3000/api/status`

Diferente de servidores tradicionais que ficam rodando o backend inteiro continuamente alocando memória, as rotas de API do Next.js funcionam sob demanda. Elas são isoladas e podem ser implantadas como funções assíncronas (_Serverless Functions_), escalando de forma independente.

---

## 2. Anatomia do Manipulador de Rota (API Handler)

A implementação da nossa primeira API foi codificada da seguinte forma dentro de `pages/api/status.js`:

```javascript
function status(request, response) {
  response.status(200).json({
    "teste de api funcionando": "ok",
  });
}

export default status;
```

### Componentes do Handler:

- **`request` (Mensagem de Entrada):** Objeto que encapsula todos os dados vindos do cliente (parâmetros de URL, corpo da requisição, cabeçalhos, cookies).
- **`response` (Mensagem de Saída):** Objeto fornecido pelo framework que expõe métodos para estruturar a resposta.
- **`response.status(200)`**: Define o código de status HTTP da resposta. O código `200` é o padrão de mercado para indicar sucesso (_OK_).
- **`.json(...)`**: Converte automaticamente o objeto literal do JavaScript em uma string JSON e configura o cabeçalho de rede apropriado para que o cliente saiba como ler o dado.

---

## 3. Inspeção de Baixo Nível com cURL

O **cURL** (Client URL) é uma ferramenta de linha de comando utilizada para transferir dados de ou para um servidor usando diversos protocolos de rede. Usamos a flag `-v` (_verbose_) para inspecionar o fluxo de dados da nossa API:

```bash
curl http://localhost:3000/api/status -v
```

### Análise do Fluxo de Rede Tráfego (Headers HTTP):

As linhas iniciadas com `>` indicam os dados de **Envio (Request)** do cliente para o servidor:

- `GET /api/status HTTP/1.1`: Solicitação utilizando o método HTTP **GET** (leitura) na versão 1.1 do protocolo.
- `User-Agent: curl/8.5.0`: Identifica a ferramenta de origem que disparou a chamada.

As linhas iniciadas com `<` indicam metadados da **Resposta (Response)** retornados pelo Next.js:

- `HTTP/1.1 200 OK`: O servidor confirma que processou a requisição com sucesso.
- `Content-Type: application/json; charset=utf-8`: Especifica que o corpo da resposta é um JSON codificado em UTF-8, permitindo que navegadores e aplicativos leiam caracteres especiais sem corromper os dados.
- `Content-Length: 33`: Informa o tamanho exato do pacote de dados em bytes enviado no corpo da resposta.

Ao final do cabeçalho, o corpo de dados bruto (_payload_) é impresso na tela:

```json
{ "teste de api funcionando": "ok" }
```
