# Conteinerização de Infraestrutura e Orquestração com Docker Compose

Este documento consolida os aprendizados das aulas 72 a 75 do curso.dev, detalhando os fundamentos de isolamento de processos, a criação do arquivo de especificação do Docker Compose, a resolução de variáveis de ambiente obrigatórias e o acesso cliente/servidor via rede local.

---

## 1. O que é o Docker e o ecossistema Docker Hub

O **Docker** é uma plataforma open-source de virtualização a nível de sistema operacional (compartilhando o mesmo Kernel da máquina hospedeira). Ele permite encapsular a aplicação e suas dependências (como o banco de dados) em uma unidade isolada e leve chamada **Container**, garantindo que o comportamento seja idêntico em ambiente local, homologação e produção.

### Conceitos Fundamentais:

- **Imagem:** Um pacote estático, imutável e de leitura que contém todo o sistema operacional básico, binários e bibliotecas necessárias para executar um software.
- **Docker Hub:** O registro público oficial de imagens Docker na nuvem. Delá, extraímos a imagem oficial do **PostgreSQL** na sua variante **Alpine**. A distribuição Alpine Linux é altamente recomendada na engenharia de software por ser extremamente minimalista, ocupando poucos megabytes em disco e reduzindo a superfície de vulnerabilidades de segurança.

---

## 2. Orquestração Declarativa com `compose.yaml`

Em vez de gerenciar containers digitando comandos gigantescos e manuais no terminal, utilizamos o **Docker Compose** para definir a infraestrutura de forma declarativa usando a nova convenção de nomenclatura da especificação: `compose.yaml`.

Configuramos o arquivo e o alocamos dentro do diretório especializado de infraestrutura: `infra/compose.yaml`.

### Código de Configuração Estruturado:

```yaml
services:
  database:
    image: "postgres:19beta1-alpine3.22"
    environment:
      POSTGRES_PASSWORD: "local_password"
```

### Explicação Técnica dos Parâmetros:

- **`services`**: Define o bloco inicial de serviços que compõem a arquitetura do nosso sistema.
- **`database`**: O nome lógico do container dentro da rede interna criada pelo Docker.
- **`image`**: Especifica a tag exata da imagem do PostgreSQL baseada em Alpine Linux que deve ser baixada do Docker Hub.
- **`environment`**: Injeta variáveis de ambiente dentro do container. A chave `POSTGRES_PASSWORD` é uma exigência de segurança estrita da imagem oficial do Postgres; sem ela, o processo de inicialização do banco (_initdb_) falha e derruba o container.

---

## 3. Gerenciamento do Ciclo de Vida e Conectividade via Terminal

### Comandos de Controle de Infraestrutura:

Para gerenciar os containers apontando para o arquivo que foi encapsulado no diretório de infraestrutura, utilizamos a flag `-f` (file):

- **Subir em segundo plano (Modo Detached):**

```bash
docker compose -f infra/compose.yaml up -d
```

- **Listar o estado de todos os containers (ativos ou caídos):**

```bash
docker ps --all
```

- **Derrubar e limpar os recursos criados:**

```bash
docker compose -f infra/compose.yaml down
```

### Conexão Física via Cliente CLI (`psql`)

Instalamos o utilitário nativo de conexão via gerenciador de pacotes da distribuição linux do Codespaces (`sudo apt install postgresql-client`).

Como o servidor PostgreSQL está isolado dentro do container e não na máquina local, a conexão direta falha. Devemos instruir o cliente a trafegar pela ponte de rede TCP/IP mapeada:

```bash
psql --host=localhost --username=postgres port=5432
```

Após informar a senha configurada no arquivo de ambiente (`local_password`), o terminal estabelece uma sessão interativa de SQL direto com a engine interna do banco de dados rodando no container, validando a integridade do isolamento com o comando de teste:

```sql
SELECT 1 + 1; -- Retorna 2 confirmando o processamento do motor do banco
\q            -- Comando nativo do psql para encerrar a sessão
```
