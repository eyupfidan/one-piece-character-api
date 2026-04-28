CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letter TEXT,
  name TEXT NOT NULL UNIQUE,
  chapter TEXT,
  episode TEXT,
  year TEXT,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS character_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  japaneseName TEXT,
  romanizedName TEXT,
  officialEnglishName TEXT,
  debut TEXT,
  affiliations TEXT,
  occupations TEXT,
  origin TEXT,
  residence TEXT,
  alias TEXT,
  epithet TEXT,
  status TEXT,
  age TEXT,
  birthday TEXT,
  height TEXT,
  bloodType TEXT,
  bounty TEXT,
  japaneseVoice TEXT,
  englishVoice TEXT,
  liveActionPortrayal TEXT,
  devilFruitJapaneseName TEXT,
  devilFruitEnglishName TEXT,
  devilFruitMeaning TEXT,
  devilFruitType TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (name) REFERENCES characters(name) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letter TEXT,
  name TEXT NOT NULL UNIQUE,
  numberOfMembers TEXT,
  chapter TEXT,
  episode TEXT,
  year TEXT,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_letter ON characters(letter);
CREATE INDEX IF NOT EXISTS idx_character_details_name ON character_details(name);
CREATE INDEX IF NOT EXISTS idx_crews_name ON crews(name);
CREATE INDEX IF NOT EXISTS idx_crews_letter ON crews(letter);
