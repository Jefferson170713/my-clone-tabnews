# Automação de Scripts e Roteamento Baseado em Arquivos com Next.js

Este documento consolida os aprendizados das aulas 13 e 14 do curso.dev, focando na automação de comandos através do `package.json`, na inicialização do servidor de desenvolvimento, no conceito de File-system Routing e na governança de artefatos gerados.

---

## 1. Automatizando Comandos com NPM Scripts

No ecossistema Node.js, os binários das ferramentas que instalamos (como o Next.js) ficam armazenados dentro da pasta oculta `node_modules/.bin/`. Para evitar a necessidade de digitar caminhos complexos no terminal, utilizamos a seção `scripts` dentro do manifesto do projeto (`package.json`).

Configuramos o script de desenvolvimento da seguinte forma:

```json
"scripts": {
  "dev": "next dev"
}
```

### Como Executar:

A partir dessa configuração, para levantar o servidor de desenvolvimento do projeto, basta executar no terminal o comando:

```bash
npm run dev
```

O NPM interceptará esse comando, buscará o binário do `next dev` dentro de `node_modules` e iniciará o ambiente com recursos avançados, como o **Fast Refresh** (atualização instantânea da tela ao salvar o código, sem perder o estado da aplicação).

---

## 2. O Ciclo de Vida e o Isolamento da Pasta `.next/`

Assim que o comando `npm run dev` é executado pela primeira vez, o framework cria automaticamente uma pasta oculta na raiz do projeto chamada **`.next/`**.

### O que é a pasta `.next/`?

Ela é a pasta de artefatos de compilação e cache do framework. Dentro dela, o Next.js armazena o resultado do processamento dos seus arquivos JavaScript, a otimização de imagens, os mapas de compilação e as páginas prontas para o navegador ler.

### Por que ela DEVE estar no `.gitignore`?

1. **Volatilidade:** Os arquivos dentro de `.next/` mudam a cada linha de código que você altera e salva. Rastrear isso pelo Git geraria commits gigantescos cheios de códigos ilegíveis de cache.
2. **Ambiente Local:** O conteúdo da `.next/` é gerado sob medida para a máquina onde o comando foi rodado. Ela será recriada do zero de forma automática toda vez que o projeto for iniciado em um ambiente novo.

---

## 3. A Arquitetura de Roteamento do Next.js (File-system Routing)

Uma das maiores vantagens do Next.js é o seu sistema de **Roteamento Baseado em Arquivos**. Em frameworks tradicionais de frontend, é necessário escrever dezenas de linhas de código para dizer ao sistema qual página exibir em cada URL. No Next.js, a própria estrutura de pastas dita as URLs do site.

Ao criarmos a pasta `pages/` na raiz do projeto, o Next.js passa a monitorar todos os arquivos inseridos ali dentro.

- **O Arquivo `pages/index.js`**: O nome `index` é uma convenção histórica da internet para indicar a página principal. Portanto, o arquivo `index.js` mapeia automaticamente para a rota raiz do seu site (ex: `http://localhost:3000/`).

---

## 4. Anatomia do Primeiro Componente React

Dentro de `pages/index.js`, o código foi estruturado utilizando conceitos fundamentais do React:

```javascript
function Home() {
  return <h1>Teste Jefferson 1</h1>;
}

export default Home;
```

### Conceitos Cruciais do Código:

1. **Componente Funcional:** A função `Home()` é um componente React. No desenvolvimento moderno, componentes são funções JavaScript puras que retornam a estrutura visual que deve ser exibida na tela.
2. **JSX (JavaScript XML):** O que parece HTML dentro do `return` (`<h1>...</h1>`) é, na verdade, JSX. É uma extensão de sintaxe para JavaScript que permite escrever a estrutura da interface de forma declarativa e intuitiva.
3. **Exportação Padrão (`export default`):** O Next.js exige que cada arquivo dentro da pasta `pages/` possua uma exportação padrão. Isso diz ao framework: _"Quando o usuário acessar esta rota, pegue este componente específico e renderize-o na tela"_.
