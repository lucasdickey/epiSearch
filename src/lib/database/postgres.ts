import { Pool } from "pg";
import { config } from "../config";
import {
  Podcast,
  Episode,
  Speaker,
  EpisodeSpeaker,
  TranscriptChunk,
} from "./types";

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
      [name, description, url]
    );
    return result.rows[0];
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
    const result = await client.query(
      "UPDATE podcasts SET name = COALESCE($1, name), description = COALESCE($2, description), url = COALESCE($3, url) WHERE id = $4 RETURNING *",
      [name, description, url, id]
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
    if (podcastId) {
      const result = await client.query(
        "SELECT * FROM episodes WHERE podcast_id = $1 ORDER BY published_date DESC",
        [podcastId]
      );
      return result.rows as Episode[];
    } else {
      const result = await client.query(
        "SELECT * FROM episodes ORDER BY published_date DESC"
      );
      return result.rows as Episode[];
    }
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
    const publishedDate = episode.published_date
      ? new Date(episode.published_date).toISOString()
      : null;

    const result = await client.query(
      "INSERT INTO episodes (podcast_id, title, description, summary, published_date, url, audio_file_path) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        episode.podcast_id,
        episode.title,
        episode.description || null,
        episode.summary || null,
        publishedDate,
        episode.url || null,
        episode.audio_file_path || null,
      ]
    );
    return result.rows[0];
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
    const publishedDate = episode.published_date
      ? new Date(episode.published_date).toISOString()
      : null;

    const result = await client.query(
      "UPDATE episodes SET podcast_id = COALESCE($1, podcast_id), title = COALESCE($2, title), description = COALESCE($3, description), summary = COALESCE($4, summary), published_date = COALESCE($5, published_date), url = COALESCE($6, url), audio_file_path = COALESCE($7, audio_file_path) WHERE id = $8 RETURNING *",
      [
        episode.podcast_id,
        episode.title,
        episode.description,
        episode.summary,
        publishedDate,
        episode.url,
        episode.audio_file_path,
        id,
      ]
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
    const result = await client.query(
      "INSERT INTO speakers (name, bio) VALUES ($1, $2) RETURNING *",
      [speaker.name, speaker.bio || null]
    );
    return result.rows[0];
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
    const result = await client.query(
      "INSERT INTO episode_speakers (episode_id, speaker_id) VALUES ($1, $2) ON CONFLICT (episode_id, speaker_id) DO NOTHING",
      [episodeId, speakerId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
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
      "SELECT s.* FROM speakers s JOIN episode_speakers es ON s.id = es.speaker_id WHERE es.episode_id = $1 ORDER BY s.name",
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
    const result = await client.query(
      "INSERT INTO transcript_chunks (episode_id, content, speaker_id, start_time, end_time, embedding_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        chunk.episode_id,
        chunk.content,
        chunk.speaker_id || null,
        chunk.start_time,
        chunk.end_time,
        chunk.embedding_id || null,
      ]
    );
    return result.rows[0];
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
    if (podcastIds && podcastIds.length > 0) {
      // Convert the array to a string representation that PostgreSQL can understand
      const podcastIdsString = `{${podcastIds.join(",")}}`;

      const result = await client.query(
        "SELECT tc.* FROM transcript_chunks tc JOIN episodes e ON tc.episode_id = e.id WHERE e.podcast_id = ANY($1::int[]) AND tc.content ILIKE $2 ORDER BY tc.start_time LIMIT 50",
        [podcastIdsString, `%${query}%`]
      );
      return result.rows as TranscriptChunk[];
    } else {
      const result = await client.query(
        "SELECT * FROM transcript_chunks WHERE content ILIKE $1 ORDER BY start_time LIMIT 50",
        [`%${query}%`]
      );
      return result.rows as TranscriptChunk[];
    }
  } finally {
    client.release();
  }
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
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
        url TEXT,
        audio_file_path TEXT
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
        id SERIAL PRIMARY KEY,
        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL,
        start_time FLOAT NOT NULL,
        end_time FLOAT NOT NULL,
        embedding_id TEXT
      )
    `);

    console.log("Database schema initialized");
  } finally {
    client.release();
  }
}
