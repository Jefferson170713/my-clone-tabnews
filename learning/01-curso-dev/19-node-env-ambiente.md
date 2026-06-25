# Segurança de Rede e Ambientes de Execução: Criptografia SSL/TLS e Propagação de Erros

Este documento consolida os aprendizados das aulas 96 a 100 do curso.dev, detalhando a importância de canais seguros de transporte de dados via SSL/TLS, a alternância dinâmica de parâmetros baseada no estado do `NODE_ENV` e o comportamento de propagação de exceções na arquitetura de software.

---

## 1. O Protocolo SSL/TLS e a Segurança de Transporte

Em ambientes de produção, os servidores que hospedam a aplicação web (ex: Next.js na Vercel) e os servidores que gerenciam os bancos de dados relacionais (ex: PostgreSQL em serviços de nuvem) residem em infraestruturas físicas distintas. A comunicação entre esses nós trafega por roteadores e backbones da internet.

Sem uma camada de proteção, os dados e credenciais trafegam em formato de texto puro (_plaintext_), ficando expostos a ataques de interceptação de rede conhecidos como **Man-in-the-Middle (MitM)**.

Para mitigar esse risco de vazamento em massa, ativamos o protocolo **SSL/TLS (Secure Sockets Layer / Transport Layer Security)**. Ele estabelece uma chave de criptografia assimétrica durante o aperto de mão inicial (_handshake_), garantindo três pilares fundamentais da segurança da informação:

1. **Confidencialidade:** Ninguém no caminho consegue decifrar os pacotes de dados trafegados.
2. **Integridade:** Garante que os comandos SQL e os dados não foram modificados ou corrompidos durante o trajeto.
3. **Autenticidade:** Confirma que o servidor de banco de dados é realmente quem ele diz ser, prevenindo fraudes de DNS.

---

## 2. Adaptação Dinâmica de Contexto via Variável `NODE_ENV`

Embora o SSL seja obrigatório em produção, o nosso container local do PostgreSQL (configurado no Docker via Alpine Linux) não possui certificados digitais SSL válidos emitidos por autoridades certificadoras. Tentar forçar uma conexão criptografada localmente faria a aplicação rejeitar a conexão.

Para resolver essa divergência de ecossistemas sem a necessidade de duplicar códigos ou criar condicionais complexas, refatoramos a instanciação do cliente do driver `pg` em `infra/database.js` injetando uma avaliação condicional enxuta:

```javascript
import { Client } from "pg";

async function query(queryObject) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    // Aplicação do Operador Ternário baseando-se no ciclo de vida da aplicação
    ssl: process.env.NODE_ENV === "development" ? false : true,
  });

  try {
    await client.connect();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    console.error(error);
    throw error; // Propagação mandatória da exceção capturada
  } finally {
    await client.end(); // Fechamento garantido do socket TCP/IP
  }
}

export default {
  query: query,
};
```

### Comportamento do Runtime do Node.js:

- **Modo Desenvolvimento local (`npm run dev`):** O Next.js injeta o valor fixo `"development"` na variável de ambiente `NODE_ENV`. O operador ternário avalia a expressão como verdadeira e injeta o valor literal `false` no parâmetro `ssl`, permitindo que o projeto rode na máquina local sem empecilhos.
- **Modo Produção/Testes de Nuvem:** A variável `NODE_ENV` assume valores diferentes de `"development"` (como `"production"`). A condição resulta em falsa e injeta o valor `true`, forçando o driver a exigir criptografia máxima ao se conectar com os servidores em nuvem.

---

## 3. O Padrão de Propagação de Erros (_Rethrowing Excepetions_)

A inclusão da instrução **`throw error;`** dentro do bloco `catch` corrige uma falha clássica de design de fluxo de controle.

Na arquitetura de software baseada em separação de preocupações (SoC), o módulo `database.js` tem apenas o dever de **executar** a query e gerenciar os recursos físicos do banco. Ele não sabe o contexto do negócio e nem qual resposta deve ser dada ao usuário final.

Ao utilizar o `throw error`, o módulo realiza a auditoria do erro internamente (imprimindo-o no log do servidor com o `console.error`), mas repassa a responsabilidade do tratamento do erro para cima, ou seja, para o controlador da rota de API que realizou a chamada. Isso permite que a API capture a quebra e retorne códigos HTTP apropriados (como `500 Internal Server Error`) em vez de travar silenciosamente.
