import express from "express";
import db from "../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [artistas] = await db.query(
            "SELECT * FROM artistas ORDER BY nome"
        );

        res.json(artistas);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { nome, imagem, descricao } = req.body;

        if (!nome) {
            return res.status(400).json({
                mensagem: "Nome do artista obrigatório"
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO artistas (nome, imagem, descricao)
             VALUES (?, ?, ?)`,
            [nome, imagem || null, descricao || null]
        );

        res.status(201).json({
            mensagem: "Artista cadastrado!",
            id: resultado.insertId
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const [resultado] = await db.query(
            "DELETE FROM artistas WHERE id = ?",
            [req.params.id]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({
                mensagem: "Artista não encontrado"
            });
        }

        res.json({ mensagem: "Artista excluído!" });
    } catch (error) {
        res.status(500).json({
            erro: "Não foi possível excluir. Verifique se existem músicas vinculadas."
        });
    }
});

export default router;