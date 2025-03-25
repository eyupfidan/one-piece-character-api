-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  letter CHAR(1),
  name VARCHAR(255) NOT NULL UNIQUE,
  chapter VARCHAR(50),
  episode VARCHAR(50),
  year VARCHAR(50),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Character details table
CREATE TABLE IF NOT EXISTS character_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  japaneseName VARCHAR(255),
  romanizedName VARCHAR(255),
  officialEnglishName VARCHAR(255),
  debut VARCHAR(255),
  affiliations TEXT,
  occupations TEXT,
  origin VARCHAR(255),
  residence VARCHAR(255),
  alias TEXT,
  epithet VARCHAR(255),
  status VARCHAR(100),
  age VARCHAR(50),
  birthday VARCHAR(100),
  height VARCHAR(50),
  bloodType VARCHAR(10),
  bounty VARCHAR(100),
  japaneseVoice VARCHAR(255),
  englishVoice VARCHAR(255),
  liveActionPortrayal VARCHAR(255),
  devilFruitJapaneseName VARCHAR(255),
  devilFruitEnglishName VARCHAR(255),
  devilFruitMeaning TEXT,
  devilFruitType VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (name) REFERENCES characters(name) ON DELETE CASCADE
);

-- Crews table
CREATE TABLE IF NOT EXISTS crews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  letter CHAR(1),
  name VARCHAR(255) NOT NULL UNIQUE,
  numberOfMembers VARCHAR(50),
  chapter VARCHAR(50),
  episode VARCHAR(50),
  year VARCHAR(50),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 