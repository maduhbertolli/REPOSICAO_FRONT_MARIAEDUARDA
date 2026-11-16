CREATE DATABASE IF NOT EXISTS nocturne_music
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nocturne_music;

CREATE TABLE IF NOT EXISTS artists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  bio TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS songs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  artist_id INT NOT NULL,
  album VARCHAR(160),
  duration_seconds INT DEFAULT 0,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_song_artist FOREIGN KEY (artist_id)
    REFERENCES artists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Dados de demonstração (opcionais)
INSERT INTO artists (name, bio)
SELECT 'Artista de exemplo', 'Você pode editar ou apagar este artista.'
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE name = 'Artista de exemplo');

INSERT INTO songs (title, artist_id, album, duration_seconds, audio_url)
SELECT 'Faixa de demonstração', id, 'Primeiros passos', 0,
       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
FROM artists WHERE name = 'Artista de exemplo'
AND NOT EXISTS (SELECT 1 FROM songs WHERE title = 'Faixa de demonstração');
