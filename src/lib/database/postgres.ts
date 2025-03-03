import { Pool } from "pg";
import { config } from "../config";
import {
  Podcast,
  Episode,
  Speaker,
  EpisodeSpeaker,
  TranscriptChunk,
  SearchResult,
} from "./types";

// Create a new pool using the connection string from config
const pool = new Pool({
  connectionString: config.databaseUrl,
});

// Podcast CRUD operations
export async function getPodcasts(): Promise<Podcast[]> {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM podcasts ORDER BY name");
    return result.rows as Podcast[];
  } finally {
    client.release();
  }
}

export async function getPodcastById(id: number): Promise<Podcast | null> {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM podcasts WHERE id = $1", [
      id,
    ]);
    return result.rows.length > 0 ? (result.rows[0] as Podcast) : null;
  } finally {
    client.release();
  }
}

export async function createPodcast(
  podcast: Omit<Podcast, "id">
): Promise<Podcast> {
  const client = await pool.connect();
  try {
    const { name, description, url } = podcast;
    const result = await client.query(
      "INSERT INTO podcasts (name, description, url) VALUES ($1, $2, $3) RETURNING *",
      [name, description || null, url || null]
    );
    return result.rows[0] as Podcast;
  } finally {
    client.release();
  }
}

export async function updatePodcast(
  id: number,
  podcast: Partial<Podcast>
): Promise<Podcast | null> {
  const client = await pool.connect();
  try {
    const { name, description, url } = podcast;

    // Build the SET clause dynamically based on provided fields
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (url !== undefined) {
      setClauses.push(`url = $${paramIndex++}`);
      values.push(url);
    }

    if (setClauses.length === 0) {
      return null; // No fields to update
    }

    // Add the id as the last parameter
    values.push(id);

    const result = await client.query(
      `UPDATE podcasts SET ${setClauses.join(
        ", "
      )} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? (result.rows[0] as Podcast) : null;
  } finally {
    client.release();
  }
}

export async function deletePodcast(id: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query("DELETE FROM podcasts WHERE id = $1", [
      id,
    ]);
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

// Episode CRUD operations
export async function getEpisodes(podcastId?: number): Promise<Episode[]> {
  const client = await pool.connect();
  try {
    let query = "SELECT * FROM episodes";
    const values = [];

    if (podcastId) {
      query += " WHERE podcast_id = $1";
      values.push(podcastId);
    }

    query += " ORDER BY published_date DESC";

    const result = await client.query(query, values);
    return result.rows as Episode[];
  } finally {
    client.release();
  }
}

export async function getEpisodeById(id: number): Promise<Episode | null> {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM episodes WHERE id = $1", [
      id,
    ]);
    return result.rows.length > 0 ? (result.rows[0] as Episode) : null;
  } finally {
    client.release();
  }
}

export async function createEpisode(
  episode: Omit<Episode, "id">
): Promise<Episode> {
  const client = await pool.connect();
  try {
    const { podcast_id, title, description, summary, published_date, url } =
      episode;

    const publishedDate = published_date
      ? new Date(published_date).toISOString()
      : null;

    const result = await client.query(
      `INSERT INTO episodes (
        podcast_id,
        title,
        description,
        summary,
        published_date,
        url
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        podcast_id,
        title,
        description || null,
        summary || null,
        publishedDate,
        url || null,
      ]
    );

    return result.rows[0] as Episode;
  } finally {
    client.release();
  }
}

export async function updateEpisode(
  id: number,
  episode: Partial<Episode>
): Promise<Episode | null> {
  const client = await pool.connect();
  try {
    // Build the SET clause dynamically based on provided fields
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (episode.podcast_id !== undefined) {
      setClauses.push(`podcast_id = $${paramIndex++}`);
      values.push(episode.podcast_id);
    }

    if (episode.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`);
      values.push(episode.title);
    }

    if (episode.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(episode.description);
    }

    if (episode.summary !== undefined) {
      setClauses.push(`summary = $${paramIndex++}`);
      values.push(episode.summary);
    }

    if (episode.published_date !== undefined) {
      setClauses.push(`published_date = $${paramIndex++}`);
      values.push(
        episode.published_date ? new Date(episode.published_date) : null
      );
    }

    if (episode.url !== undefined) {
      setClauses.push(`url = $${paramIndex++}`);
      values.push(episode.url);
    }

    if (setClauses.length === 0) {
      return null; // No fields to update
    }

    // Add the id as the last parameter
    values.push(id);

    const result = await client.query(
      `UPDATE episodes SET ${setClauses.join(
        ", "
      )} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? (result.rows[0] as Episode) : null;
  } finally {
    client.release();
  }
}

export async function deleteEpisode(id: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query("DELETE FROM episodes WHERE id = $1", [
      id,
    ]);
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

// Speaker CRUD operations
export async function getSpeakers(): Promise<Speaker[]> {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM speakers ORDER BY name");
    return result.rows as Speaker[];
  } finally {
    client.release();
  }
}

export async function getSpeakerById(id: number): Promise<Speaker | null> {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM speakers WHERE id = $1", [
      id,
    ]);
    return result.rows.length > 0 ? (result.rows[0] as Speaker) : null;
  } finally {
    client.release();
  }
}

export async function createSpeaker(
  speaker: Omit<Speaker, "id">
): Promise<Speaker> {
  const client = await pool.connect();
  try {
    const { name, bio } = speaker;
    const result = await client.query(
      "INSERT INTO speakers (name, bio) VALUES ($1, $2) RETURNING *",
      [name, bio || null]
    );
    return result.rows[0] as Speaker;
  } finally {
    client.release();
  }
}

// Episode-Speaker relations
export async function addSpeakerToEpisode(
  episodeId: number,
  speakerId: number
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query(
      "INSERT INTO episode_speakers (episode_id, speaker_id) VALUES ($1, $2) ON CONFLICT (episode_id, speaker_id) DO NOTHING",
      [episodeId, speakerId]
    );
    return true;
  } catch (error) {
    console.error("Error adding speaker to episode:", error);
    return false;
  } finally {
    client.release();
  }
}

export async function getEpisodeSpeakers(
  episodeId: number
): Promise<Speaker[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT s.* FROM speakers s
       JOIN episode_speakers es ON s.id = es.speaker_id
       WHERE es.episode_id = $1
       ORDER BY s.name`,
      [episodeId]
    );
    return result.rows as Speaker[];
  } finally {
    client.release();
  }
}

// Transcript chunk operations
export async function storeTranscriptChunk(
  chunk: Omit<TranscriptChunk, "id">
): Promise<TranscriptChunk> {
  const client = await pool.connect();
  try {
    const {
      episode_id,
      content,
      speaker_id,
      start_time,
      end_time,
      embedding_id,
    } = chunk;
    const result = await client.query(
      `INSERT INTO transcript_chunks (
        id, episode_id, content, speaker_id, start_time, end_time, embedding_id
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, $6
      ) RETURNING *`,
      [
        episode_id,
        content,
        speaker_id || null,
        start_time,
        end_time,
        embedding_id || null,
      ]
    );
    return result.rows[0] as TranscriptChunk;
  } finally {
    client.release();
  }
}

export async function getTranscriptChunks(
  episodeId: number
): Promise<TranscriptChunk[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM transcript_chunks WHERE episode_id = $1 ORDER BY start_time",
      [episodeId]
    );
    return result.rows as TranscriptChunk[];
  } finally {
    client.release();
  }
}

// Keyword search
export async function searchTranscriptsByKeyword(
  query: string,
  podcastIds?: number[]
): Promise<TranscriptChunk[]> {
  const client = await pool.connect();
  try {
    let sql = `
      SELECT tc.* 
      FROM transcript_chunks tc
      JOIN episodes e ON tc.episode_id = e.id
    `;

    const values = [];
    let paramIndex = 1;

    // Add WHERE conditions
    const conditions = [];

    // Add text search condition
    conditions.push(`tc.content ILIKE $${paramIndex++}`);
    values.push(`%${query}%`);

    // Add podcast filter if provided
    if (podcastIds && podcastIds.length > 0) {
      conditions.push(
        `e.podcast_id IN (${podcastIds
          .map((_, i) => `$${paramIndex + i}`)
          .join(", ")})`
      );
      values.push(...podcastIds);
      paramIndex += podcastIds.length;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Add ORDER BY and LIMIT
    sql += " ORDER BY tc.start_time LIMIT 50";

    const result = await client.query(sql, values);
    return result.rows as TranscriptChunk[];
  } finally {
    client.release();
  }
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query("BEGIN");

    // Create extension for UUID generation
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create podcasts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS podcasts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        url TEXT
      )
    `);

    // Create episodes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS episodes (
        id SERIAL PRIMARY KEY,
        podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        summary TEXT,
        published_date DATE,
        url TEXT
      )
    `);

    // Create speakers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS speakers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        bio TEXT
      )
    `);

    // Create episode_speakers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS episode_speakers (
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
        PRIMARY KEY (episode_id, speaker_id)
      )
    `);

    // Create transcript_chunks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transcript_chunks (
        id TEXT PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL,
        start_time FLOAT NOT NULL,
        end_time FLOAT NOT NULL,
        embedding_id TEXT
      )
    `);

    // Create indexes for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);
      CREATE INDEX IF NOT EXISTS idx_episode_speakers_episode_id ON episode_speakers(episode_id);
      CREATE INDEX IF NOT EXISTS idx_episode_speakers_speaker_id ON episode_speakers(speaker_id);
      CREATE INDEX IF NOT EXISTS idx_transcript_chunks_episode_id ON transcript_chunks(episode_id);
      CREATE INDEX IF NOT EXISTS idx_transcript_chunks_speaker_id ON transcript_chunks(speaker_id);
      CREATE INDEX IF NOT EXISTS idx_transcript_chunks_embedding_id ON transcript_chunks(embedding_id);
    `);

    // Commit transaction
    await client.query("COMMIT");

    console.log("Database schema initialized");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function migrateDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query("BEGIN");

    // Check if audio_file_path column exists in episodes table
    const { rows } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'episodes' AND column_name = 'audio_file_path'
    `);

    // If the column exists, remove it
    if (rows.length > 0) {
      console.log("Removing audio_file_path column from episodes table");
      await client.query("ALTER TABLE episodes DROP COLUMN audio_file_path");
    } else {
      console.log("audio_file_path column does not exist, no migration needed");
    }

    // Commit transaction
    await client.query("COMMIT");

    console.log("Database migration completed successfully");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Error migrating database:", error);
    throw error;
  } finally {
    client.release();
  }
}
