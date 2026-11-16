import express from "express";
import cors from "cors";

import musicasRoutes from "./routes/musicas.js";
import artistasRoutes from "./routes/artistas.js";
import playlistsRoutes from "./routes/playlists.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensagem: "API NOCTURNE funcionando!",
        versao: "1.0"
    });
});

app.use("/api/musicas", musicasRoutes);
app.use("/api/artistas", artistasRoutes);
app.use("/api/playlists", playlistsRoutes);

export default app;