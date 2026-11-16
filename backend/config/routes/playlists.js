import express from "express";
import db from "../config/database.js";

const router = express.Router();

// Listar playlists
router.get("/", async (req, res) => {
    try {
        const [playlists] = await db.query(
            "SELECT * FROM playlists ORDER BY id DESC"
        );

        res.json(playlists);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Criar playlist
router.post("/", async (req, res) => {
    try {
        const { nome, descricao, capa } = req.body;

        if (!nome) {
            return res.status(400).json({
                mensagem: "Nome da playlist obrigatório"
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO playlists (nome, descricao, capa)
             VALUES (?, ?, ?)`,
            [nome, descricao || null, capa || null]
        );

        res.status(201).json({
            mensagem: "Playlist criada!",
            id: resultado.insertId
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Adicionar música à playlist
router.post("/:id/musicas", async (req, res) => {
    try {
        const { musica_id } = req.body;

        await db.query(
            `INSERT INTO playlist_musicas
             (playlist_id, musica_id)
             VALUES (?, ?)`,
            [req.params.id, musica_id]
        );

        res.status(201).json({
            mensagem: "Música adicionada à playlist!"
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Listar músicas de uma playlist
router.get("/:id/musicas", async (req, res) => {
    try {
        const [musicas] = await db.query(
            `SELECT m.*, a.nome AS artista
             FROM playlist_musicas pm
             JOIN musicas m ON m.id = pm.musica_id
             JOIN artistas a ON a.id = m.artista_id
             WHERE pm.playlist_id = ?`,
            [req.params.id]
        );

        res.json(musicas);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Excluir playlist
router.delete("/:id", async (req, res) => {
    try {
        await db.query(
            "DELETE FROM playlists WHERE id = ?",
            [req.params.id]
        );

        res.json({ mensagem: "Playlist excluída!" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

export default router;