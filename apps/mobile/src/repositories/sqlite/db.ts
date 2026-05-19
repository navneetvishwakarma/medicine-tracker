import * as SQLite from 'expo-sqlite'

export const db = SQLite.openDatabaseSync('medicine-tracker.db')

export async function initDb(): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS medicines (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      dosage      TEXT NOT NULL,
      meal_relation TEXT NOT NULL,
      schedules   TEXT NOT NULL,
      color       TEXT NOT NULL,
      active      INTEGER NOT NULL DEFAULT 1,
      notes       TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dose_logs (
      id              TEXT PRIMARY KEY,
      medicine_id     TEXT NOT NULL,
      scheduled_date  TEXT NOT NULL,
      scheduled_time  TEXT NOT NULL,
      status          TEXT NOT NULL,
      marked_at       TEXT,
      marked_by       TEXT,
      note            TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id                   INTEGER PRIMARY KEY CHECK (id = 1),
      patient_name         TEXT NOT NULL DEFAULT 'Patient',
      reminder_morning     TEXT NOT NULL DEFAULT '08:00',
      reminder_noon        TEXT NOT NULL DEFAULT '13:00',
      reminder_evening     TEXT NOT NULL DEFAULT '18:00',
      reminder_night       TEXT NOT NULL DEFAULT '21:00',
      notifications_enabled INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `)
}
