# Arquitetura Interna do Git: Os 4 Estados e Gestão de Branches

Este documento detalha os fundamentos avançados do ciclo de vida de arquivos dentro do Git e explica o funcionamento mecânico de ramificações (branches) e navegação de histórico utilizando o comando `checkout`. Vai da aula 15 a 19.

---

## 1. Os 4 Estados Básicos do Git (Ciclo de Vida)

Para gerenciar o histórico com eficiência, o Git categoriza cada arquivo do projeto em um dos quatro estados fundamentais. Entender este fluxo evita commits acidentais de lixo ou perda de código.

### 1. Untracked (Não Rastreado)

O arquivo acabou de ser criado na sua máquina local, mas o Git ainda não sabe da existência dele. Ele não faz parte do controle de versão.

- _Como entra neste estado:_ Ao criar um arquivo novo na pasta.
- _Como sai dele:_ Rodando `git add <arquivo>`, o que o move para o próximo estado.

### 2. Unmodified (Não Modificado / Comitado)

O arquivo já foi rastreado, salvo no banco de dados local do Git e não sofreu nenhuma alteração desde o último commit. É o estado de estabilidade.

- _Como sai dele:_ Basta abrir o arquivo e alterar qualquer caractere para o Git detectar a mudança.

### 3. Modified (Modificado)

O arquivo que já pertencia ao Git sofreu alguma alteração local (edição, deleção de linhas, etc.), mas essas mudanças ainda não foram preparadas para serem salvas de forma definitiva.

- _Como sai dele:_ Rodando `git add <arquivo>` para preparar as alterações.

### 4. Staged (Preparado / Stage Area)

É a zona de transição (ou "sala de espera"). O arquivo foi modificado e marcado para ir no próximo commit. O Git tirou uma foto (_snapshot_) do estado atual dele e guardou na fila de envio.

- _Como sai dele:_ Rodando `git commit`, fazendo com que ele volte a ser um arquivo **Unmodified** dentro do novo bloco do histórico.

---

## 2. Governança de Linhas do Tempo com Branches

Uma **Branch** (ramificação) é uma linha de desenvolvimento independente. Na arquitetura do Git, uma branch não é uma cópia física das pastas do projeto, mas sim um **ponteiro móvel e leve** que aponta para o último commit realizado naquela trilha.

### Por que trabalhar com Branches é vital?

- **Isolamento de Erros:** Permite criar novas funcionalidades (`feat`) ou corrigir bugs (`fix`) em um ambiente isolado. Se o código quebrar, a linha principal (`main`) permanece intacta e estável.
- **Trabalho em Equipe:** Permite que múltiplos engenheiros mexam no mesmo projeto, em arquivos diferentes (ou até nos mesmos), simultaneamente sem sobrescrever o trabalho uns dos outros.

---

## 3. O Comando `git checkout`

O comando `git checkout` serve para fazer a cabeça de leitura do Git (chamada de **HEAD**) apontar para um lugar diferente, seja para uma branch paralela ou para um commit antigo do histórico.

### Principais Comandos e Casos de Uso:

#### A. Criar e entrar em uma nova Branch simultaneamente

Se você vai iniciar uma nova tarefa, nunca mexa direto na `main`. Crie uma branch de contexto:

```bash
git checkout -b nome-da-sua-branch
```

_(O parâmetro `-b` avisa ao Git: "Crie essa branch porque ela ainda não existe")._

#### B. Alternar entre Branches existentes

Para navegar de volta para uma linha do tempo que já existe (como voltar para a `main` para verificar algo):

```bash
git checkout nome-da-branch
```

_Nota de Engenharia: Certifique-se de que seu `git status` está limpo (sem arquivos no estado Modified) antes de mudar de branch, caso contrário o Git pode bloquear a troca ou tentar misturar as alterações._

#### C. Viajar no tempo (Navegar para um commit antigo)

Se o sistema quebrou e você quer ver como o código estava há 3 dias atrás, você pode passar o código identificador (HASH) do commit para o checkout:

```bash
git checkout 7a8b9c2
```

_Atenção: Isso colocará o Git no estado de "Detached HEAD" (cabeça desprendida). Serve para ler ou testar o código antigo, mas modificações feitas aqui não serão salvas a menos que você crie uma branch nova a partir daí._

---

## 4. O Fluxo de Trabalho Ideal de um Engenheiro de Elite

1. Atualize sua branch principal: `git checkout main` -> `git pull`
2. Crie uma branch para a nova tarefa: `git checkout -b feat/nova-rota-api`
3. Trabalhe no código (os arquivos vão de _Untracked/Modified_ para _Staged_ com `git add .`)
4. Faça o commit semântico local: `git commit -m "feat(api): adiciona rota de listagem"`
5. Envie a branch para o servidor: `git push origin feat/nova-rota-api`
