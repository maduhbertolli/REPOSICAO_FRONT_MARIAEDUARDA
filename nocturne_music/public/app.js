const $ = (selector) => document.querySelector(selector);
const audio = $("#audio");
let songs = [],
  artists = [],
  playlists = [],
  favorites = [],
  queue = [],
  currentIndex = -1;

let isDemoMode = false;
const DEMO_STORAGE_KEY = "nocturne_demo_data_v1";

const DEFAULT_DEMO = {
  artists: [
    { id: 1, name: "The Midnight Echoes", bio: "Goth & Dark Wave", image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400", songs_count: 2 },
    { id: 2, name: "Nocturna", bio: "Dark Ambient & Ethereal", image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", songs_count: 1 }
  ],
  songs: [
    { id: 1, title: "Shadows in the Mist", artist_id: 1, artist_name: "The Midnight Echoes", album: "After Dark", duration_seconds: 372, audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", cover_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400", created_at: "2026-11-16" },
    { id: 2, title: "Midnight Sonata", artist_id: 1, artist_name: "The Midnight Echoes", album: "After Dark", duration_seconds: 423, audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", cover_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400", created_at: "2026-11-16" },
    { id: 3, title: "Echoes of the Void", artist_id: 2, artist_name: "Nocturna", album: "Dark Realm", duration_seconds: 345, audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", cover_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400", created_at: "2026-11-16" }
  ],
  playlists: [
    { id: 1, name: "Madrugada Roxa", description: "Atmosfera noturna e reflexiva", songs_count: 2 }
  ],
  playlist_songs: [
    { playlist_id: 1, song_id: 1 },
    { playlist_id: 1, song_id: 2 }
  ],
  favorites: [1]
};

function getDemoData() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO));
      return JSON.parse(JSON.stringify(DEFAULT_DEMO));
    }
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DEMO));
  }
}

function saveDemoData(data) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro salvando localStorage:", e);
  }
}

function mockApi(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const data = getDemoData();

  if (url === "/artists" && method === "GET") {
    return data.artists.map((a) => ({
      ...a,
      songs_count: data.songs.filter((s) => s.artist_id === a.id).length,
    }));
  }
  if (url === "/artists" && method === "POST") {
    const newId = (data.artists.reduce((max, a) => Math.max(max, a.id), 0) || 0) + 1;
    const newArtist = {
      id: newId,
      name: body.name.trim(),
      bio: body.bio || "",
      image_url: body.image_url || "",
      songs_count: 0,
    };
    data.artists.push(newArtist);
    saveDemoData(data);
    return newArtist;
  }
  const matchArtistDel = url.match(/^\/artists\/(\d+)$/);
  if (matchArtistDel && method === "DELETE") {
    const artistId = Number(matchArtistDel[1]);
    data.artists = data.artists.filter((a) => a.id !== artistId);
    data.songs = data.songs.filter((s) => s.artist_id !== artistId);
    saveDemoData(data);
    return { message: "Artista removido." };
  }

  if (url === "/songs" && method === "GET") {
    return data.songs.map((s) => {
      const art = data.artists.find((a) => a.id === s.artist_id);
      return { ...s, artist_name: art ? art.name : "Artista" };
    });
  }
  if (url === "/songs" && method === "POST") {
    const newId = (data.songs.reduce((max, s) => Math.max(max, s.id), 0) || 0) + 1;
    const art = data.artists.find((a) => a.id === Number(body.artist_id));
    const newSong = {
      id: newId,
      title: body.title.trim(),
      artist_id: Number(body.artist_id),
      artist_name: art ? art.name : "Artista",
      album: body.album || "Single",
      duration_seconds: Number(body.duration_seconds) || 0,
      audio_url: body.audio_url.trim(),
      cover_url: body.cover_url || "",
      created_at: new Date().toISOString(),
    };
    data.songs.unshift(newSong);
    saveDemoData(data);
    return { id: newId, message: "Música cadastrada." };
  }
  const matchSongDel = url.match(/^\/songs\/(\d+)$/);
  if (matchSongDel && method === "DELETE") {
    const songId = Number(matchSongDel[1]);
    data.songs = data.songs.filter((s) => s.id !== songId);
    data.favorites = data.favorites.filter((id) => id !== songId);
    data.playlist_songs = data.playlist_songs.filter((ps) => ps.song_id !== songId);
    saveDemoData(data);
    return { message: "Música removida." };
  }

  if (url === "/playlists" && method === "GET") {
    return data.playlists.map((p) => ({
      ...p,
      songs_count: data.playlist_songs.filter((ps) => ps.playlist_id === p.id).length,
    }));
  }
  if (url === "/playlists" && method === "POST") {
    const newId = (data.playlists.reduce((max, p) => Math.max(max, p.id), 0) || 0) + 1;
    const newPlaylist = {
      id: newId,
      name: body.name.trim(),
      description: body.description || "",
      songs_count: 0,
    };
    data.playlists.push(newPlaylist);
    saveDemoData(data);
    return newPlaylist;
  }
  const matchPlDel = url.match(/^\/playlists\/(\d+)$/);
  if (matchPlDel && method === "DELETE") {
    const plId = Number(matchPlDel[1]);
    data.playlists = data.playlists.filter((p) => p.id !== plId);
    data.playlist_songs = data.playlist_songs.filter((ps) => ps.playlist_id !== plId);
    saveDemoData(data);
    return { message: "Playlist removida." };
  }

  const matchPlSongs = url.match(/^\/playlists\/(\d+)\/songs$/);
  if (matchPlSongs && method === "GET") {
    const plId = Number(matchPlSongs[1]);
    const songIds = data.playlist_songs
      .filter((ps) => ps.playlist_id === plId)
      .map((ps) => ps.song_id);
    return data.songs
      .filter((s) => songIds.includes(s.id))
      .map((s) => {
        const art = data.artists.find((a) => a.id === s.artist_id);
        return { ...s, artist_name: art ? art.name : "Artista" };
      });
  }
  if (matchPlSongs && method === "POST") {
    const plId = Number(matchPlSongs[1]);
    const songId = Number(body.song_id);
    if (!data.playlist_songs.some((ps) => ps.playlist_id === plId && ps.song_id === songId)) {
      data.playlist_songs.push({ playlist_id: plId, song_id: songId });
      saveDemoData(data);
    }
    return { message: "Música adicionada à playlist." };
  }
  const matchPlSongDel = url.match(/^\/playlists\/(\d+)\/songs\/(\d+)$/);
  if (matchPlSongDel && method === "DELETE") {
    const plId = Number(matchPlSongDel[1]);
    const songId = Number(matchPlSongDel[2]);
    data.playlist_songs = data.playlist_songs.filter(
      (ps) => !(ps.playlist_id === plId && ps.song_id === songId),
    );
    saveDemoData(data);
    return { message: "Música retirada da playlist." };
  }

  if (url === "/favorites" && method === "GET") {
    return data.songs
      .filter((s) => data.favorites.includes(s.id))
      .map((s) => {
        const art = data.artists.find((a) => a.id === s.artist_id);
        return { ...s, artist_name: art ? art.name : "Artista" };
      });
  }
  const matchFav = url.match(/^\/favorites\/(\d+)$/);
  if (matchFav && method === "POST") {
    const songId = Number(matchFav[1]);
    if (!data.favorites.includes(songId)) {
      data.favorites.push(songId);
      saveDemoData(data);
    }
    return { message: "Adicionada aos favoritos." };
  }
  if (matchFav && method === "DELETE") {
    const songId = Number(matchFav[1]);
    data.favorites = data.favorites.filter((id) => id !== songId);
    saveDemoData(data);
    return { message: "Removida dos favoritos." };
  }

  return null;
}

async function api(url, options = {}) {
  if (isDemoMode) {
    return mockApi(url, options);
  }
  try {
    const response = await fetch(`/api${url}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok)
      throw new Error(data?.error || "Não foi possível concluir a operação.");
    return data;
  } catch (err) {
    if (!isDemoMode) {
      console.warn("Backend indisponível, alternando para Modo Demonstração");
      isDemoMode = true;
      $("#connection-status").textContent = "Modo Demo (GitHub Pages)";
      return mockApi(url, options);
    }
    throw err;
  }
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
    if (window.location.hostname.includes("github.io")) {
      isDemoMode = true;
      $("#connection-status").textContent = "Online (GitHub Pages)";
      await refresh();
      return;
    }

    const statusCheck = await fetch("/api/status").catch(() => null);
    if (statusCheck && statusCheck.ok) {
      isDemoMode = false;
      await refresh();
      $("#connection-status").textContent = "MySQL conectado";
    } else {
      isDemoMode = true;
      $("#connection-status").textContent = "Modo Demo";
      await refresh();
    }
  } catch (e) {
    isDemoMode = true;
    $("#connection-status").textContent = "Modo Demo";
    await refresh();
    console.warn("Iniciando em modo de demonstração:", e);
  }
})();
