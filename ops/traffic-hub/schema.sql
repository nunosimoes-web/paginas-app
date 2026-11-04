CREATE TABLE IF NOT EXISTS daily (
  day TEXT NOT NULL, site TEXT NOT NULL, source TEXT NOT NULL,
  visitors INTEGER NOT NULL DEFAULT 0, views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, site, source)
);
CREATE TABLE IF NOT EXISTS runs (at TEXT PRIMARY KEY, ok INTEGER NOT NULL, note TEXT);
-- Cloudflare edge request mix per zone: cls in 2xx/3xx/4xx/5xx (requests) or 'html' (200 HTML eyeball visits).
CREATE TABLE IF NOT EXISTS zone_daily (
  day TEXT NOT NULL, zone TEXT NOT NULL, cls TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0, visits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, zone, cls)
);
-- Top paths: cls 'page' (200 HTML, last 7 days) or an error status like '404' (last 2 days).
CREATE TABLE IF NOT EXISTS path_daily (
  day TEXT NOT NULL, zone TEXT NOT NULL, host TEXT NOT NULL, path TEXT NOT NULL, cls TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0, visits INTEGER NOT NULL DEFAULT 0, country TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (day, zone, host, path, cls, country)
);
