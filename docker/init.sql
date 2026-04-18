-- Initialisation automatique de la base de données VOID Esport
-- Ce fichier est exécuté par PostgreSQL au premier démarrage du container

CREATE TABLE IF NOT EXISTS player_logins (
  id              SERIAL PRIMARY KEY,
  discord_id      TEXT      NOT NULL,
  username        TEXT      NOT NULL,
  discriminator   TEXT      DEFAULT '',
  avatar          TEXT,
  role            TEXT      DEFAULT 'none',
  country         TEXT      DEFAULT '',
  brawl_tag       TEXT      DEFAULT '',
  bio             TEXT      DEFAULT '',
  favorite_modes  TEXT      DEFAULT '',
  last_login_at   TIMESTAMP DEFAULT NOW() NOT NULL
);
