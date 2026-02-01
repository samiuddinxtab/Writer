-- Phase 4: Initial D1 schema (read-only)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  order_index INTEGER,
  created_at DATETIME
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  section_id INTEGER NOT NULL,
  published_at DATETIME,
  updated_at DATETIME,
  is_pinned BOOLEAN DEFAULT 0,
  created_at DATETIME,
  FOREIGN KEY (section_id) REFERENCES sections(id)
);

CREATE INDEX IF NOT EXISTS idx_articles_section_id ON articles(section_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_sections_slug ON sections(slug);
