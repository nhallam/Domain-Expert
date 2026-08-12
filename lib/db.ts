import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seed } from "./seed";
import type {
  AnswerOption,
  Attempt,
  AttemptAnswer,
  LeaderboardRow,
  Question,
  Quiz,
  QuizWithCreator,
  QuestionWithOptions,
  User,
} from "./types";

const globalForDb = globalThis as unknown as { __dx_db?: Database.Database };

export function getDb(): Database.Database {
  if (globalForDb.__dx_db) return globalForDb.__dx_db;

  // DATABASE_DIR overrides; on Vercel the project dir is read-only, so fall
  // back to /tmp — ephemeral per serverless instance, which is fine for demo
  // mode (data reseeds) but means scores don't persist. Use a host with a
  // volume (see README) for real persistence.
  const dataDir =
    process.env.DATABASE_DIR ?? (process.env.VERCEL ? "/tmp/domain-expert-data" : path.join(process.cwd(), "data"));
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "domain-expert.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      avatarUrl     TEXT,
      headline      TEXT NOT NULL DEFAULT '',
      industry      TEXT NOT NULL DEFAULT '',
      authProvider  TEXT NOT NULL DEFAULT 'mock' CHECK (authProvider IN ('mock','linkedin')),
      providerId    TEXT NOT NULL,
      createdAt     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id            TEXT PRIMARY KEY,
      slug          TEXT NOT NULL UNIQUE,
      creatorId     TEXT NOT NULL REFERENCES users(id),
      title         TEXT NOT NULL,
      description   TEXT,
      industry      TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      playCount     INTEGER NOT NULL DEFAULT 0,
      createdAt     INTEGER NOT NULL,
      publishedAt   INTEGER
    );

    CREATE TABLE IF NOT EXISTS questions (
      id            TEXT PRIMARY KEY,
      quizId        TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      ord           INTEGER NOT NULL,
      text          TEXT NOT NULL,
      explanation   TEXT
    );

    CREATE TABLE IF NOT EXISTS answer_options (
      id            TEXT PRIMARY KEY,
      questionId    TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      ord           INTEGER NOT NULL,
      text          TEXT NOT NULL,
      isCorrect     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id            TEXT PRIMARY KEY,
      quizId        TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      userId        TEXT NOT NULL REFERENCES users(id),
      score         INTEGER NOT NULL,
      maxScore      INTEGER NOT NULL,
      durationMs    INTEGER NOT NULL,
      answers       TEXT NOT NULL,
      isReplay      INTEGER NOT NULL DEFAULT 0,
      sharedAt      INTEGER,
      createdAt     INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quizId, ord);
    CREATE INDEX IF NOT EXISTS idx_options_question ON answer_options(questionId, ord);
    CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON attempts(quizId);
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(userId);
  `);

  const userCount = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (userCount === 0) seed(db);

  globalForDb.__dx_db = db;
  return db;
}

export function newId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 20);
}

function rowToAttempt(row: Record<string, unknown>): Attempt {
  return {
    ...(row as Omit<Attempt, "answers" | "isReplay">),
    answers: JSON.parse(row.answers as string) as AttemptAnswer[],
    isReplay: !!(row.isReplay as number),
  };
}

// ---------- Users ----------

export function getUserById(id: string): User | null {
  return (getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined) ?? null;
}

// ---------- Quizzes ----------

export function getQuizBySlug(slug: string): QuizWithCreator | null {
  const row = getDb()
    .prepare(
      `SELECT q.*, u.name AS creatorName, u.avatarUrl AS creatorAvatarUrl, u.headline AS creatorHeadline
       FROM quizzes q JOIN users u ON u.id = q.creatorId
       WHERE q.slug = ?`
    )
    .get(slug) as QuizWithCreator | undefined;
  return row ?? null;
}

export function getQuizById(id: string): Quiz | null {
  return (getDb().prepare("SELECT * FROM quizzes WHERE id = ?").get(id) as Quiz | undefined) ?? null;
}

export function getPublishedQuizzes(): QuizWithCreator[] {
  return getDb()
    .prepare(
      `SELECT q.*, u.name AS creatorName, u.avatarUrl AS creatorAvatarUrl, u.headline AS creatorHeadline
       FROM quizzes q JOIN users u ON u.id = q.creatorId
       WHERE q.status = 'published'
       ORDER BY q.playCount DESC, q.publishedAt DESC`
    )
    .all() as QuizWithCreator[];
}

export function getQuizzesByCreator(creatorId: string): Quiz[] {
  return getDb()
    .prepare("SELECT * FROM quizzes WHERE creatorId = ? ORDER BY createdAt DESC")
    .all(creatorId) as Quiz[];
}

export function getQuestionsWithOptions(quizId: string): QuestionWithOptions[] {
  const db = getDb();
  const questions = db
    .prepare("SELECT id, quizId, ord AS 'order', text, explanation FROM questions WHERE quizId = ? ORDER BY ord")
    .all(quizId) as Question[];
  const optionsStmt = db.prepare(
    "SELECT id, questionId, ord AS 'order', text, isCorrect FROM answer_options WHERE questionId = ? ORDER BY ord"
  );
  return questions.map((q) => ({
    ...q,
    options: (optionsStmt.all(q.id) as (Omit<AnswerOption, "isCorrect"> & { isCorrect: number })[]).map((o) => ({
      ...o,
      isCorrect: !!o.isCorrect,
    })),
  }));
}

export function questionCount(quizId: string): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM questions WHERE quizId = ?").get(quizId) as { n: number }).n;
}

// ---------- Attempts ----------

export function getAttemptById(id: string): Attempt | null {
  const row = getDb().prepare("SELECT * FROM attempts WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToAttempt(row) : null;
}

export function getCountedAttempt(quizId: string, userId: string): Attempt | null {
  const row = getDb()
    .prepare("SELECT * FROM attempts WHERE quizId = ? AND userId = ? AND isReplay = 0 ORDER BY createdAt LIMIT 1")
    .get(quizId, userId) as Record<string, unknown> | undefined;
  return row ? rowToAttempt(row) : null;
}

export function getAttemptsByUser(userId: string): (Attempt & { quizTitle: string; quizSlug: string; quizIndustry: string })[] {
  const rows = getDb()
    .prepare(
      `SELECT a.*, q.title AS quizTitle, q.slug AS quizSlug, q.industry AS quizIndustry
       FROM attempts a JOIN quizzes q ON q.id = a.quizId
       WHERE a.userId = ? ORDER BY a.createdAt DESC`
    )
    .all(userId) as Record<string, unknown>[];
  return rows.map((r) => ({
    ...rowToAttempt(r),
    quizTitle: r.quizTitle as string,
    quizSlug: r.quizSlug as string,
    quizIndustry: r.quizIndustry as string,
  }));
}

// ---------- Leaderboard ----------

// Eligible: counted (first) attempts, shared, and not by the quiz creator.
export function getLeaderboard(quizId: string): LeaderboardRow[] {
  const rows = getDb()
    .prepare(
      `SELECT a.userId, u.name, u.avatarUrl, u.headline, a.score, a.maxScore, a.durationMs, a.createdAt
       FROM attempts a
       JOIN users u ON u.id = a.userId
       JOIN quizzes q ON q.id = a.quizId
       WHERE a.quizId = ? AND a.isReplay = 0 AND a.sharedAt IS NOT NULL AND a.userId != q.creatorId
       ORDER BY a.score DESC, a.durationMs ASC, a.createdAt ASC`
    )
    .all(quizId) as Omit<LeaderboardRow, "rank">[];
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function canViewLeaderboard(quizId: string, userId: string | null): boolean {
  if (!userId) return false;
  const quiz = getQuizById(quizId);
  if (quiz?.creatorId === userId) return true;
  const attempt = getCountedAttempt(quizId, userId);
  return !!attempt?.sharedAt;
}

export function sharerCount(quizId: string): number {
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) AS n FROM attempts a JOIN quizzes q ON q.id = a.quizId
         WHERE a.quizId = ? AND a.isReplay = 0 AND a.sharedAt IS NOT NULL AND a.userId != q.creatorId`
      )
      .get(quizId) as { n: number }
  ).n;
}
