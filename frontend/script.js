
const API = "http://localhost:3000/api";

const musicGrid = document.getElementById("musicGrid");
const artistGrid = document.getElementById("artistGrid");
const playlistGrid = document.getElementById("playlistGrid");
const favoriteGrid = document.getElementById("favoriteGrid");

const audioPlayer = document.getElementById("audioPlayer");

let musicas = [];
let artistas = [];
let favoritos = JSON.parse(localStorage.getItem("nocturne-favoritos")) || [];

// Buscar dados da API
async function buscar(endpoint) {
    const resposta = await fetch(`${API}/${endpoint}`);

    if (!resposta.ok) {
        throw new Error("Erro ao buscar dados");
    }

    return resposta.json();
}

// Inicialização
async function carregarSite() {
    try {
        musicas = await buscar("musicas");
        artistas = await buscar("artistas");

        const playlists = await buscar("playlists");

        renderizarMusicas();
        renderizarArtistas();
        renderizarPlaylists(playlists);
        renderizarFavoritos();
        preencherSelectArtistas();

    } catch (erro) {
        musicGrid.innerHTML = `
            <p>Não foi possível conectar ao servidor.
            Verifique se o backend está funcionando.</p>
        `;
    }
}

// Músicas
function renderizarMusicas() {
    if (!musicas.length) {
        musicGrid.innerHTML = "<p>Nenhuma música cadastrada.</p>";
        return;
    }

    musicGrid.innerHTML = musicas.map(musica => `
        <article class="music-card">

            <img
                class="album-cover"
                src="${musica.capa || imagemPadrao()}"
                alt="Capa da música"
            >

            <h3>${escapar(musica.titulo)}</h3>

            <p>${escapar(musica.artista)}</p>

            <div class="card-actions">
                <button class="play-button"
                    onclick="tocarMusica(${musica.id})">
                    ▶
                </button>

                <button class="favorite-button ${
                    favoritos.includes(musica.id) ? "liked" : ""
                }"
                    onclick="alternarFavorito(${musica.id})">
                    ${favoritos.includes(musica.id) ? "♥" : "♡"}
                </button>
            </div>

        </article>
    `).join("");
}

// Artistas
function renderizarArtistas() {
    if (!artistas.length) {
        artistGrid.innerHTML = "<p>Nenhum artista cadastrado.</p>";
        return;
    }

    artistGrid.innerHTML = artistas.map(artista => `
        <article class="artist-card">

            <img
                class="artist-image"
                src="${artista.imagem || imagemPadrao()}"
                alt="${escapar(artista.nome)}"
            >

            <h3>${escapar(artista.nome)}</h3>

            <p>${escapar(artista.descricao || "Artista musical")}</p>

        </article>
    `).join("");
}

// Playlists
function renderizarPlaylists(playlists) {
    if (!playlists.length) {
        playlistGrid.innerHTML = "<p>Nenhuma playlist criada.</p>";
        return;
    }

    playlistGrid.innerHTML = playlists.map(playlist => `
        <article class="playlist-card">

            <div class="playlist-icon">♫</div>

            <h3>${escapar(playlist.nome)}</h3>

            <p>${escapar(playlist.descricao || "Sua coleção musical")}</p>

            <button class="outline-button"
                onclick="adicionarMusicaPlaylist(${playlist.id})">
                + Música
            </button>

        </article>
    `).join("");
}

// Player
function tocarMusica(id) {
    const musica = musicas.find(item => item.id === id);

    if (!musica) return;

    if (!musica.audio_url) {
        alert("Esta música ainda não possui áudio cadastrado.");
        return;
    }

    document.getElementById("playerTitle").textContent = musica.titulo;
    document.getElementById("playerArtist").textContent = musica.artista;

    audioPlayer.src = musica.audio_url;
    audioPlayer.play().catch(() => {
        alert("Não foi possível reproduzir este áudio.");
    });
}

// Favoritos
function alternarFavorito(id) {
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(item => item !== id);
    } else {
        favoritos.push(id);
    }

    localStorage.setItem(
        "nocturne-favoritos",
        JSON.stringify(favoritos)
    );

    renderizarMusicas();
    renderizarFavoritos();
}

function renderizarFavoritos() {
    const lista = musicas.filter(musica =>
        favoritos.includes(musica.id)
    );

    if (!lista.length) {
        favoriteGrid.innerHTML = "<p>Seus favoritos aparecerão aqui.</p>";
        return;
    }

    favoriteGrid.innerHTML = lista.map(musica => `
        <article class="music-card">

            <img class="album-cover"
                src="${musica.capa || imagemPadrao()}">

            <h3>${escapar(musica.titulo)}</h3>

            <p>${escapar(musica.artista)}</p>

            <div class="card-actions">
                <button class="play-button"
                    onclick="tocarMusica(${musica.id})">
                    ▶
                </button>

                <button class="favorite-button liked"
                    onclick="alternarFavorito(${musica.id})">
                    ♥
                </button>
            </div>

        </article>
    `).join("");
}

// Modal
function abrirCadastro() {
    document.getElementById("musicModal").classList.add("show");
}

function fecharCadastro() {
    document.getElementById("musicModal").classList.remove("show");
}

// Select de artistas
function preencherSelectArtistas() {
    const select = document.getElementById("artistSelect");

    select.innerHTML = `
        <option value="">Selecione um artista</option>
    `;

    artistas.forEach(artista => {
        select.innerHTML += `
            <option value="${artista.id}">
                ${escapar(artista.nome)}
            </option>
        `;
    });
}

// Cadastrar música
document.getElementById("musicForm").addEventListener("submit", async event => {
    event.preventDefault();

    const formulario = new FormData(event.target);

    const dados = Object.fromEntries(formulario.entries());

    dados.artista_id = Number(dados.artista_id);

    try {
        const resposta = await fetch(`${API}/musicas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem || "Erro ao cadastrar");
        }

        alert("Música cadastrada com sucesso!");

        event.target.reset();
        fecharCadastro();
        carregarSite();

    } catch (erro) {
        alert(erro.message);
    }
});

// Criar playlist
async function criarPlaylist() {
    const nome = prompt("Nome da playlist:");

    if (!nome || !nome.trim()) return;

    const descricao = prompt("Descrição da playlist:") || "";

    try {
        const resposta = await fetch(`${API}/playlists`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, descricao })
        });

        if (!resposta.ok) {
            throw new Error("Erro ao criar playlist");
        }

        alert("Playlist criada!");
        carregarSite();

    } catch (erro) {
        alert(erro.message);
    }
}

// Adicionar música à playlist
async function adicionarMusicaPlaylist(idPlaylist) {
    if (!musicas.length) {
        alert("Cadastre músicas primeiro.");
        return;
    }

    const escolha = prompt(
        musicas.map(m => `${m.id} - ${m.titulo}`).join("\n")
        + "\n\nDigite o ID da música:"
    );

    if (!escolha) return;

    const musicaId = Number(escolha);

    if (!musicas.some(m => m.id === musicaId)) {
        alert("ID de música inválido.");
        return;
    }

    try {
        const resposta = await fetch(
            `${API}/playlists/${idPlaylist}/musicas`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ musica_id: musicaId })
            }
        );

        if (!resposta.ok) {
            throw new Error("Erro ao adicionar música");
        }

        alert("Música adicionada à playlist!");

    } catch (erro) {
        alert(erro.message);
    }
}

// Utilidades
function imagemPadrao() {
    return "https://placehold.co/400x400/170c22/c49aff?text=NOCTURNE";
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

// Executar
carregarSite();
