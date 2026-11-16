import express from "express";
import db from "../config/database.js";

const router = express.Router();

// Listar músicas
router.get("/", async (req, res) => {
    try {
        const [musicas] = await db.query(`
            SELECT m.*, a.nome AS artista
            FROM musicas m
            JOIN artistas a ON a.id = m.artista_id
            ORDER BY m.id DESC
        `);

        res.json(musicas);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Buscar música por ID
router.get("/:id", async (req, res) => {
    try {
        const [musicas] = await db.query(
            "SELECT * FROM musicas WHERE id = ?",
            [req.params.id]
        );

        if (!musicas.length) {
            return res.status(404).json({
                mensagem: "Música não encontrada"
            });
        }

        res.json(musicas[0]);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Cadastrar música
router.post("/", async (req, res) => {
    try {
        const {
            titulo,
            artista_id,
            album_id,
            audio_url,
            duracao
        } = req.body;

        if (!titulo || !artista_id) {
            return res.status(400).json({
                mensagem: "Título e artista são obrigatórios"
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO musicas
            (titulo, artista_id, album_id, audio_url, duracao)
            VALUES (?, ?, ?, ?, ?)`,
            [
                titulo,
                artista_id,
                album_id || null,
                audio_url || null,
                duracao || null
            ]
        );

        res.status(201).json({
            mensagem: "Música cadastrada!",
            id: resultado.insertId
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Atualizar música
router.put("/:id", async (req, res) => {
    try {
        const {
            titulo,
            artista_id,
            album_id,
            audio_url,
            duracao
        } = req.body;

        const [resultado] = await db.query(
            `UPDATE musicas SET
                titulo = ?,
                artista_id = ?,
                album_id = ?,
                audio_url = ?,
                duracao = ?
             WHERE id = ?`,
            [
                titulo,
                artista_id,
                album_id || null,
                audio_url || null,
                duracao || null,
                req.params.id
            ]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({
                mensagem: "Música não encontrada"
            });
        }

        res.json({ mensagem: "Música atualizada!" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Excluir música
router.delete("/:id", async (req, res) => {
    try {
        const [resultado] = await db.query(
            "DELETE FROM musicas WHERE id = ?",
            [req.params.id]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({
                mensagem: "Música não encontrada"
            });
        }

        res.json({ mensagem: "Música excluída!" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

export default router;