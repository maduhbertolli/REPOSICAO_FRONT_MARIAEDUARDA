# Nocturne Music

Aplicação web de música com visual roxo e preto, fontes góticas, frontend em HTML/CSS/JavaScript, backend Node.js + Express e banco de dados MySQL.

## Funcionalidades

- Cadastro e listagem de artistas.
- Cadastro, busca e exclusão de músicas.
- Playlists: criar, adicionar músicas, visualizar faixas e excluir.
- Favoritos: adicionar e remover.
- Player com play/pause, faixa anterior/próxima, barra de progresso e volume.
- Interface responsiva para computador e celular.

> O player reproduz arquivos de áudio acessíveis por uma URL pública (por exemplo, um arquivo MP3 hospedado). O projeto não hospeda nem distribui músicas.

## Requisitos

- Node.js 18 ou superior.
- MySQL 8 (ou versão compatível).
- Visual Studio Code.

## 1. Abrir o projeto

1. Extraia a pasta `nocturne_music`.
2. Abra o VS Code.
3. Vá em **File > Open Folder** e selecione a pasta `nocturne_music`.

## 2. Criar o banco de dados

1. Inicie o serviço do MySQL.
2. Abra o MySQL Workbench (ou outro cliente MySQL).
3. Abra o arquivo `database/schema.sql`.
4. Execute todo o script. Ele cria o banco `nocturne_music`, as tabelas e alguns dados de demonstração.

Tabelas criadas: `artists`, `songs`, `playlists`, `playlist_songs` e `favorites`.

## 3. Configurar a conexão

Na raiz do projeto, crie um arquivo chamado `.env` (na mesma pasta de `server.js`).

Copie o conteúdo de `.env.example` para `.env` e ajuste os dados para a sua instalação do MySQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=nocturne_music
```

Substitua `sua_senha_mysql` pela senha configurada no seu MySQL. Se o usuário não tiver senha, deixe `DB_PASSWORD=`.

## 4. Instalar dependências

No terminal integrado do VS Code (**Terminal > New Terminal**), execute:

```bash
npm install
```

## 5. Iniciar o sistema

Para iniciar normalmente:

```bash
npm start
```

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

Acesse no navegador:

**http://localhost:3000**

Mantenha o terminal aberto enquanto estiver usando o sistema.

## 6. Como usar

1. Entre em **Artistas** e cadastre um artista.
2. Volte ao **Início** e clique em **Cadastrar música**.
3. Informe título, artista e uma URL direta de áudio `.mp3` ou outro formato suportado pelo navegador.
4. Clique no botão ▶ para tocar a música.
5. Use ♡ para adicionar/remover dos favoritos.
6. Em **Playlists**, crie uma coleção e adicione faixas usando o ID exibido na lista de músicas.

A URL do áudio precisa permitir acesso direto ao arquivo e reprodução pelo navegador. Links de páginas de streaming (como páginas de vídeo ou playlists) normalmente não funcionam como URL de áudio.

## Solução de problemas

- **`npm` não é reconhecido:** instale o Node.js LTS pelo site oficial `https://nodejs.org/`, feche e abra o VS Code novamente e confira `node -v` e `npm -v`.
- **Erro de conexão MySQL:** confira se o MySQL está iniciado e se host, porta, usuário, senha e nome do banco no `.env` estão corretos.
- **Erro `Unknown database`:** execute novamente `database/schema.sql` no MySQL Workbench.
- **Porta 3000 ocupada:** altere `PORT` no `.env`, por exemplo para `3001`, e acesse a nova porta.
- **Música não toca:** confirme se a URL é pública, aponta diretamente para um arquivo de áudio e permite reprodução pelo navegador.

## Estrutura de pastas

```text
nocturne_music/
├── database/
│   └── schema.sql
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Rotas principais da API

| Método | Rota | Função |
|---|---|---|
| GET | `/api/status` | Verifica API e MySQL |
| GET / POST | `/api/artists` | Listar / cadastrar artistas |
| DELETE | `/api/artists/:id` | Excluir artista |
| GET / POST | `/api/songs` | Listar / cadastrar músicas |
| DELETE | `/api/songs/:id` | Excluir música |
| GET / POST | `/api/playlists` | Listar / criar playlists |
| GET / POST | `/api/playlists/:id/songs` | Listar / adicionar faixas |
| DELETE | `/api/playlists/:id/songs/:songId` | Remover faixa da playlist |
| DELETE | `/api/playlists/:id` | Excluir playlist |
| GET | `/api/favorites` | Listar favoritos |
| POST / DELETE | `/api/favorites/:songId` | Adicionar / remover favorito |

## Observações

Este é um projeto funcional de demonstração para execução local. Não inclui autenticação ou separação de biblioteca por usuário. Antes de publicar na internet, adicione autenticação, validação mais rígida, proteção contra abuso e hospedagem segura para os arquivos de áudio.
