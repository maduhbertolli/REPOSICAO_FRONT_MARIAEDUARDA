require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nocturne_music",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const requiredText = (value) => typeof value === "string" && value.trim().length > 0;
const validId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

// Health check
app.get("/api/status", asyncRoute(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, message: "API e MySQL conectados." });
}));

// Artistas
app.get("/api/artists", asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT a.*, COUNT(s.id) AS songs_count
    FROM artists a LEFT JOIN songs s ON s.artist_id = a.id
    GROUP BY a.id ORDER BY a.name
  `);
  res.json(rows);
}));

app.post("/api/artists", asyncRoute(async (req, res) => {
  const { name, bio = "", image_url = "" } = req.body;
  if (!requiredText(name)) return res.status(400).json({ error: "Informe o nome do artista." });
  const [result] = await pool.execute(
    "INSERT INTO artists (name, bio, image_url) VALUES (?, ?, ?)",
    [name.trim(), bio, image_url]
  );
  res.status(201).json({ id: result.insertId, name: name.trim(), bio, image_url });
}));

app.delete("/api/artists/:id", asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "ID inválido." });
  const [result] = await pool.execute("DELETE FROM artists WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "Artista não encontrado." });
  res.json({ message: "Artista removido." });
}));

// Músicas
app.get("/api/songs", asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT s.*, a.name AS artist_name
    FROM songs s JOIN artists a ON a.id = s.artist_id
    ORDER BY s.created_at DESC, s.id DESC
  `);
  res.json(rows);
}));

app.post("/api/songs", asyncRoute(async (req, res) => {
  const { title, artist_id, album = "", duration_seconds = 0, audio_url, cover_url = "" } = req.body;
  if (!requiredText(title) || !validId(artist_id) || !requiredText(audio_url)) {
    return res.status(400).json({ error: "Título, artista e URL do áudio são obrigatórios." });
  }
  const [artist] = await pool.execute("SELECT id FROM artists WHERE id = ?", [artist_id]);
  if (!artist.length) return res.status(400).json({ error: "Artista não encontrado." });
  const [result] = await pool.execute(
    `INSERT INTO songs (title, artist_id, album, duration_seconds, audio_url, cover_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title.trim(), Number(artist_id), album, Math.max(0, Number(duration_seconds) || 0), audio_url.trim(), cover_url]
  );
  res.status(201).json({ id: result.insertId, message: "Música cadastrada." });
}));

app.delete("/api/songs/:id", asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "ID inválido." });
  const [result] = await pool.execute("DELETE FROM songs WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "Música não encontrada." });
  res.json({ message: "Música removida." });
}));

// Playlists e faixas
app.get("/api/playlists", asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT p.*, COUNT(ps.song_id) AS songs_count
    FROM playlists p LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
    GROUP BY p.id ORDER BY p.created_at DESC
  `);
  res.json(rows);
}));

app.post("/api/playlists", asyncRoute(async (req, res) => {
  const { name, description = "" } = req.body;
  if (!requiredText(name)) return res.status(400).json({ error: "Informe o nome da playlist." });
  const [result] = await pool.execute(
    "INSERT INTO playlists (name, description) VALUES (?, ?)", [name.trim(), description]
  );
  res.status(201).json({ id: result.insertId, name: name.trim(), description });
}));

app.get("/api/playlists/:id/songs", asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "ID inválido." });
  const [rows] = await pool.execute(`
    SELECT s.*, a.name AS artist_name
    FROM playlist_songs ps
    JOIN songs s ON s.id = ps.song_id
    JOIN artists a ON a.id = s.artist_id
    WHERE ps.playlist_id = ? ORDER BY ps.added_at DESC
  `, [req.params.id]);
  res.json(rows);
}));

app.post("/api/playlists/:id/songs", asyncRoute(async (req, res) => {
  const playlistId = req.params.id;
  const { song_id } = req.body;
  if (!validId(playlistId) || !validId(song_id)) return res.status(400).json({ error: "IDs inválidos." });
  await pool.execute(
    "INSERT IGNORE INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)",
    [playlistId, song_id]
  );
  res.status(201).json({ message: "Música adicionada à playlist." });
}));

app.delete("/api/playlists/:id/songs/:songId", asyncRoute(async (req, res) => {
  await pool.execute(
    "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
    [req.params.id, req.params.songId]
  );
  res.json({ message: "Música retirada da playlist." });
}));

app.delete("/api/playlists/:id", asyncRoute(async (req, res) => {
  const [result] = await pool.execute("DELETE FROM playlists WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: "Playlist não encontrada." });
  res.json({ message: "Playlist removida." });
}));

// Favoritos
app.get("/api/favorites", asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT s.*, a.name AS artist_name
    FROM favorites f JOIN songs s ON s.id = f.song_id
    JOIN artists a ON a.id = s.artist_id
    ORDER BY f.created_at DESC
  `);
  res.json(rows);
}));

app.post("/api/favorites/:songId", asyncRoute(async (req, res) => {
  if (!validId(req.params.songId)) return res.status(400).json({ error: "ID inválido." });
  await pool.execute("INSERT IGNORE INTO favorites (song_id) VALUES (?)", [req.params.songId]);
  res.json({ message: "Adicionada aos favoritos." });
}));

app.delete("/api/favorites/:songId", asyncRoute(async (req, res) => {
  await pool.execute("DELETE FROM favorites WHERE song_id = ?", [req.params.songId]);
  res.json({ message: "Removida dos favoritos." });
}));

app.use("/api", (_req, res) => res.status(404).json({ error: "Rota não encontrada." }));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Esse registro já existe." });
  if (err.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "Registro relacionado não encontrado." });
  res.status(500).json({ error: "Erro interno. Confira o terminal do servidor e a conexão MySQL." });
});

app.listen(PORT, () => console.log(`Nocturne Music rodando em http://localhost:${PORT}`));
