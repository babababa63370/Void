-- Initialisation automatique de la base de données VOID Esport
-- Ce fichier est exécuté par PostgreSQL au premier démarrage du container

CREATE TABLE IF NOT EXISTS player_logins (
  id               SERIAL PRIMARY KEY,
  discord_id       TEXT        NOT NULL,
  username         TEXT        NOT NULL,
  discriminator    TEXT        DEFAULT '',
  avatar           TEXT,
  roles            TEXT[]      NOT NULL DEFAULT '{}',
  custom_avatar    TEXT,
  banner           TEXT,
  background       TEXT,
  font             TEXT,
  music            TEXT,
  links            TEXT,
  brawl_tag        TEXT,
  background_video TEXT,
  card_background  TEXT,
  last_login_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matcherino_events (
  id         SERIAL PRIMARY KEY,
  event_id   TEXT NOT NULL,
  slug       TEXT NOT NULL,
  data       JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
