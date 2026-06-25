# Evolução de Banco de Dados: Migrations e Controle de Versão Estruturado com Node-PG-Migrate

Este documento consolida os aprendizados sobre o conceito de Migrations para gerenciamento de esquemas de bancos de dados relacionais, a parametrização de URIs de conexão (`DATABASE_URL`) e a automação de scripts via CLI com suporte do ecossistema Dotenv.

---

## 1. O Conceito de Migrations na Engenharia de Software

Em sistemas comerciais e escaláveis, o esquema de um banco de dados relacional (tabelas, colunas, chaves estrangeiras, índices) nunca deve ser modificado de forma manual ou direta. Alterações manuais quebram a consistência entre os ambientes de desenvolvimento dos engenheiros e os servidores de produção.

Para resolver este problema, implementamos o conceito de **Migrations (Migrações)**. Uma migração é um arquivo de script versionado que funciona como um "commit de Git" exclusivo para o banco de dados.



### A Simetria do `up` e `down`:
Todo arquivo de migração gerado de forma declarativa expõe duas funções fundamentais baseadas em promessas:

- **`up`**: Define as instruções necessárias para evoluir e aplicar novas estruturas ao banco de dados (ex: criar uma tabela ou adicionar restrições).
- **`down`**: Define as instruções exatas para reverter e desfazer as alterações aplicadas pela função `up`, permitindo que a infraestrutura realize *rollbacks* seguros em caso de falhas catastróficas em produção.

### A Importância do Prefixo Timestamp:
Ao criar uma migração, a ferramenta gera um prefixo numérico baseado no **Unix Timestamp** (representação do tempo em milissegundos). Essa convenção de nomenclatura garante a ordem cronológica imutável de execução das instruções, impedindo conflitos de precedência quando múltiplos desenvolvedores criam tabelas de forma simultânea no mesmo repositório.

---

## 2. Instalação e Orquestração de Ferramentas de Linha de Comando (CLI)

Para acoplar o sistema de controle de versão ao PostgreSQL Alpine, instalamos duas novas ferramentas como dependências de desenvolvimento (`-D`):

```bash
npm install node-pg-migrate@8.0.4
npm install dotenv@17.4.1
```

- **`node-pg-migrate`**: Framework agnóstico e otimizado para o PostgreSQL responsável por gerar e executar as migrações.
- **`dotenv`**: Necessário para fazer o parsing do arquivo de ambiente diretamente no terminal Bash, uma vez que a execução das migrações via CLI ocorre fora do ciclo de vida nativo do Next.js.

---

## 3. Padronização de Credenciais via Connection String (`DATABASE_URL`)

Evoluímos o nosso dicionário de variáveis de ambiente no arquivo **`.env.development`** para unificar os dados de acesso em uma única URI de conexão padronizada pelo mercado internacional:

```text
DATABASE_URL=postgres://local_user:local_password@localhost:5432/local_db
```

### Anatomia da URI de Conexão:
- `postgres://`: Protocolo de rede de comunicação do banco de dados.
- `local_user:local_password`: Credenciais de autenticação (Usuário e Senha).
- `@localhost:5432`: Endereço IP do host e a porta de escuta TCP mapeada no container Docker.
- `/local_db`: O nome da base de dados alvo para aplicação do esquema.

---

## 4. Automatização de Scripts no `package.json`

Mapeamos novos gatilhos operacionais na seção de `scripts` para simplificar a Experiência do Desenvolvedor (DX):

```json
"scripts": {
  "migration:create": "node-pg-migrate -m infra/migrations create",
  "migration:up": "node-pg-migrate -m infra/migrations --envPath .env.development up"
}
```

### Explicação Técnica das Flags:
- **`-m infra/migrations`**: Altera o diretório padrão da ferramenta, instruindo o core do pacote a salvar e buscar os arquivos de migração dentro da nossa pasta especializada de arquitetura.
- **`create`**: Comando gerador que constrói o esqueleto boilerplate com os blocos `up` e `down`.
- **`--envPath .env.development`**: Injeta de forma explícita o arquivo contendo a nossa `DATABASE_URL` secreta para que o executor de migrações consiga autenticar e abrir o canal de rede com o banco de dados.
- **`up`**: Executa sequencialmente todas as migrações da linha do tempo que ainda não foram aplicadas no banco de dados.