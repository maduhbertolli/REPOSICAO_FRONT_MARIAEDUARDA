const $ = (selector) => document.querySelector(selector);
const audio = $("#audio");
let songs = [],
  artists = [],
  playlists = [],
  favorites = [],
  queue = [],
  currentIndex = -1;

async function api(url, options = {}) {
  const response = await fetch(`/api${url}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(data?.error || "Não foi possível concluir a operação.");
  return data;
}
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}
function escapeText(value = "") {
  return String(value);
}
function safeImage(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}
function showEmpty(target, message) {
  target.innerHTML = "";
  const p = document.createElement("div");
  p.className = "empty-state";
  p.textContent = message;
  target.append(p);
}
function makeSongRow(song, withDelete = false) {
  const row = document.createElement("div");
  row.className = "song-row";
  const cover = document.createElement(
    song.cover_url && safeImage(song.cover_url) ? "img" : "div",
  );
  cover.className = "song-cover";
  if (cover.tagName === "IMG") {
    cover.src = safeImage(song.cover_url);
    cover.alt = "";
  } else cover.textContent = "♫";
  const meta = document.createElement("div");
  meta.className = "song-meta";
  const title = document.createElement("strong");
  title.textContent = song.title;
  const artist = document.createElement("small");
  artist.textContent = song.artist_name || "Artista";
  meta.append(title, artist);
  const album = document.createElement("span");
  album.className = "song-album";
  album.textContent = song.album || "Single";
  const actions = document.createElement("div");
  actions.className = "song-actions";
  const play = document.createElement("button");
  play.className = "icon-btn";
  play.textContent = "▶";
  play.title = "Tocar";
  play.addEventListener("click", () => playSong(song));
  const like = document.createElement("button");
  like.className = `icon-btn ${favorites.some((f) => f.id === song.id) ? "liked" : ""}`;
  like.textContent = favorites.some((f) => f.id === song.id) ? "♥" : "♡";
  like.title = "Favoritar";
  like.addEventListener("click", () => toggleFavorite(song));
  actions.append(play, like);
  if (withDelete) {
    const del = document.createElement("button");
    del.className = "icon-btn delete-song";
    del.textContent = "×";
    del.title = "Excluir";
    del.addEventListener("click", async () => {
      if (confirm(`Excluir "${song.title}"?`)) {
        try {
          await api(`/songs/${song.id}`, { method: "DELETE" });
          await refresh();
          toast("Música removida.");
        } catch (e) {
          toast(e.message);
        }
      }
    });
    actions.append(del);
  }
  row.append(cover, meta, album, actions);
  return row;
}
function renderSongs(
  list = songs,
  target = $("#songs-list"),
  withDelete = true,
) {
  target.innerHTML = "";
  if (!list.length)
    return showEmpty(
      target,
      "Nenhuma música por aqui ainda. Cadastre uma faixa para começar.",
    );
  list.forEach((song) => target.append(makeSongRow(song, withDelete)));
}
function renderFavorites() {
  renderSongs(favorites, $("#favorites-list"), false);
}
function renderArtists() {
  const target = $("#artists-list");
  target.innerHTML = "";
  if (!artists.length) return showEmpty(target, "Nenhum artista cadastrado.");
  artists.forEach((a) => {
    const card = document.createElement("article");
    card.className = "artist-card";
    const img = document.createElement(
      a.image_url && safeImage(a.image_url) ? "img" : "div",
    );
    img.className = "artist-image";
    if (img.tagName === "IMG") {
      img.src = safeImage(a.image_url);
      img.alt = "";
    } else img.textContent = "♟";
    const name = document.createElement("h3");
    name.textContent = a.name;
    const bio = document.createElement("p");
    bio.textContent = a.bio || `${a.songs_count} música(s) cadastrada(s)`;
    const del = document.createElement("button");
    del.className = "outline-btn";
    del.textContent = "EXCLUIR";
    del.addEventListener("click", async () => {
      if (confirm(`Excluir ${a.name} e as músicas relacionadas?`)) {
        try {
          await api(`/artists/${a.id}`, { method: "DELETE" });
          await refresh();
          toast("Artista removido.");
        } catch (e) {
          toast(e.message);
        }
      }
    });
    card.append(img, name, bio, del);
    target.append(card);
  });
}
function renderPlaylists() {
  const target = $("#playlists-list");
  target.innerHTML = "";
  if (!playlists.length)
    return showEmpty(target, "Crie sua primeira playlist.");
  playlists.forEach((p) => {
    const card = document.createElement("article");
    card.className = "playlist-card";
    const symbol = document.createElement("div");
    symbol.className = "card-symbol";
    symbol.textContent = "▤";
    const name = document.createElement("h3");
    name.textContent = p.name;
    const desc = document.createElement("p");
    desc.textContent = p.description || `${p.songs_count} faixa(s)`;
    const add = document.createElement("button");
    add.className = "outline-btn";
    add.textContent = "＋ ADICIONAR FAIXA";
    add.addEventListener("click", async () => {
      if (!songs.length) return toast("Cadastre uma música primeiro.");
      const chosen = prompt(
        `Digite o ID da música que deseja adicionar:\n${songs.map((s) => `${s.id} — ${s.title}`).join("\n")}`,
      );
      if (!chosen) return;
      try {
        await api(`/playlists/${p.id}/songs`, {
          method: "POST",
          body: JSON.stringify({ song_id: Number(chosen) }),
        });
        await loadPlaylists();
        toast("Faixa adicionada!");
      } catch (e) {
        toast(e.message);
      }
    });
    const view = document.createElement("button");
    view.className = "outline-btn";
    view.textContent = "VER FAIXAS";
    view.addEventListener("click", async () => {
      try {
        const tracks = await api(`/playlists/${p.id}/songs`);
        const names =
          tracks.map((s) => `${s.id} — ${s.title}`).join("\n") ||
          "Playlist vazia.";
        alert(`${p.name}\n\n${names}`);
      } catch (e) {
        toast(e.message);
      }
    });
    const del = document.createElement("button");
    del.className = "icon-btn";
    del.textContent = "×";
    del.title = "Excluir playlist";
    del.addEventListener("click", async () => {
      if (confirm(`Excluir playlist "${p.name}"?`)) {
        try {
          await api(`/playlists/${p.id}`, { method: "DELETE" });
          await loadPlaylists();
          toast("Playlist excluída.");
        } catch (e) {
          toast(e.message);
        }
      }
    });
    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(add, view, del);
    card.append(symbol, name, desc, actions);
    target.append(card);
  });
}
async function loadPlaylists() {
  playlists = await api("/playlists");
  renderPlaylists();
}
async function refresh() {
  [songs, artists, favorites] = await Promise.all([
    api("/songs"),
    api("/artists"),
    api("/favorites"),
  ]);
  await loadPlaylists();
  renderSongs();
  renderFavorites();
  renderArtists();
  updateArtistSelect();
  $("#song-count").textContent =
    `${songs.length} ${songs.length === 1 ? "faixa" : "faixas"}`;
}
function updateArtistSelect() {
  const select = $("#song-artist");
  select.innerHTML = "";
  artists.forEach((a) => {
    const option = document.createElement("option");
    option.value = a.id;
    option.textContent = a.name;
    select.append(option);
  });
}
async function toggleFavorite(song) {
  try {
    const isFavorite = favorites.some((f) => f.id === song.id);
    await api(`/favorites/${song.id}`, {
      method: isFavorite ? "DELETE" : "POST",
    });
    favorites = await api("/favorites");
    renderSongs();
    renderFavorites();
    toast(isFavorite ? "Removida dos favoritos." : "Adicionada aos favoritos.");
  } catch (e) {
    toast(e.message);
  }
}
function playSong(song) {
  queue = songs.slice();
  currentIndex = queue.findIndex((s) => s.id === song.id);
  if (currentIndex < 0) {
    queue = [song];
    currentIndex = 0;
  }
  audio.src = song.audio_url;
  audio
    .play()
    .then(() => updatePlayer(song))
    .catch(() => {
      updatePlayer(song);
      toast(
        "Não foi possível tocar. Confira se a URL do áudio é pública e válida.",
      );
    });
}
function updatePlayer(song) {
  $("#player-title").textContent = song.title;
  $("#player-artist").textContent = song.artist_name || "Artista";
  const cover = $("#player-cover");
  cover.innerHTML = "";
  const src = safeImage(song.cover_url);
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.style.cssText =
      "width:100%;height:100%;object-fit:cover;border-radius:5px";
    cover.append(img);
  } else cover.textContent = "♫";
}
function nextSong() {
  if (!queue.length) return;
  currentIndex = (currentIndex + 1) % queue.length;
  playSong(queue[currentIndex]);
}
function previousSong() {
  if (!queue.length) return;
  currentIndex = (currentIndex - 1 + queue.length) % queue.length;
  playSong(queue[currentIndex]);
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

document.querySelectorAll(".nav-item").forEach((btn) =>
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.add("hidden"));
    $(`#${btn.dataset.view}-view`).classList.remove("hidden");
    $("#page-title").textContent = {
      home: "Entre na sua noite.",
      favorites: "Suas faixas favoritas.",
      playlists: "Suas coleções.",
      artists: "Quem faz o som.",
    }[btn.dataset.view];
  }),
);
$("#scroll-library").addEventListener("click", () =>
  $("#library").scrollIntoView({ behavior: "smooth" }),
);
$("#search-input").addEventListener("input", (e) => {
  const term = e.target.value.toLocaleLowerCase("pt-BR");
  renderSongs(
    songs.filter((s) =>
      `${s.title} ${s.artist_name} ${s.album || ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    ),
  );
});
function openDialog(id) {
  $(id).showModal();
}
document
  .querySelectorAll("[data-close]")
  .forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()),
  );
$("#open-song-form").addEventListener("click", () => {
  if (!artists.length)
    return toast("Cadastre um artista antes de cadastrar uma música.");
  openDialog("#song-dialog");
});
$("#open-artist-form").addEventListener("click", () =>
  openDialog("#artist-dialog"),
);
$("#open-playlist-form").addEventListener("click", () =>
  openDialog("#playlist-dialog"),
);

$("#artist-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  try {
    await api("/artists", { method: "POST", body: JSON.stringify(data) });
    e.currentTarget.reset();
    $("#artist-dialog").close();
    await refresh();
    toast("Artista cadastrado!");
  } catch (err) {
    toast(err.message);
  }
});
$("#song-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  data.artist_id = Number(data.artist_id);
  data.duration_seconds = Number(data.duration_seconds);
  try {
    await api("/songs", { method: "POST", body: JSON.stringify(data) });
    e.currentTarget.reset();
    $("#song-dialog").close();
    await refresh();
    toast("Música cadastrada!");
  } catch (err) {
    toast(err.message);
  }
});
$("#playlist-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  try {
    await api("/playlists", { method: "POST", body: JSON.stringify(data) });
    e.currentTarget.reset();
    $("#playlist-dialog").close();
    await loadPlaylists();
    toast("Playlist criada!");
  } catch (err) {
    toast(err.message);
  }
});
$("#play-btn").addEventListener("click", () => {
  if (!audio.src) return toast("Escolha uma música primeiro.");
  if (audio.paused)
    audio.play().catch(() => toast("Não foi possível reproduzir."));
  else audio.pause();
});
$("#next-btn").addEventListener("click", nextSong);
$("#prev-btn").addEventListener("click", previousSong);
audio.addEventListener("play", () => ($("#play-btn").textContent = "Ⅱ"));
audio.addEventListener("pause", () => ($("#play-btn").textContent = "▶"));
audio.addEventListener("ended", nextSong);
audio.addEventListener("timeupdate", () => {
  $("#current-time").textContent = formatTime(audio.currentTime);
  $("#seek-bar").value = audio.duration
    ? (audio.currentTime / audio.duration) * 100
    : 0;
});
audio.addEventListener(
  "loadedmetadata",
  () => ($("#duration").textContent = formatTime(audio.duration)),
);
$("#seek-bar").addEventListener("input", (e) => {
  if (audio.duration)
    audio.currentTime = (Number(e.target.value) / 100) * audio.duration;
});
$("#volume").addEventListener(
  "input",
  (e) => (audio.volume = Number(e.target.value)),
);

(async function init() {
  try {
    await refresh();
    $("#connection-status").textContent = "MySQL conectado";
  } catch (e) {
    $("#connection-status").textContent = "Sem conexão";
    toast("Não foi possível carregar. Verifique MySQL e o arquivo .env.");
    console.error(e);
  }
})();
