import { sql } from "@vercel/postgres";
import {
  Podcast,
  Episode,
  Speaker,
  EpisodeSpeaker,
  TranscriptChunk,
} from "./types";

// Podcast CRUD operations
export async function getPodcasts(): Promise<Podcast[]> {
  const { rows } = await sql`SELECT * FROM podcasts ORDER BY name`;
  return rows as Podcast[];
}

export async function getPodcastById(id: number): Promise<Podcast | null> {
  const { rows } = await sql`SELECT * FROM podcasts WHERE id = ${id}`;
  return rows.length > 0 ? (rows[0] as Podcast) : null;
}

export async function createPodcast(
  podcast: Omit<Podcast, "id">
): Promise<Podcast> {
  const { rows } = await sql`
    INSERT INTO podcasts (name, description, url)
    VALUES (${podcast.name}, ${podcast.description || null}, ${
    podcast.url || null
  })
    RETURNING *
  `;
  return rows[0] as Podcast;
}

export async function updatePodcast(
  id: number,
  podcast: Partial<Podcast>
): Promise<Podcast | null> {
  const { rows } = await sql`
    UPDATE podcasts
    SET 
      name = COALESCE(${podcast.name}, name),
      description = COALESCE(${podcast.description}, description),
      url = COALESCE(${podcast.url}, url)
    WHERE id = ${id}
    RETURNING *
  `;
  return rows.length > 0 ? (rows[0] as Podcast) : null;
}

export async function deletePodcast(id: number): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM podcasts WHERE id = ${id}`;
  return rowCount ? rowCount > 0 : false;
}

// Episode CRUD operations
export async function getEpisodes(podcastId?: number): Promise<Episode[]> {
  if (podcastId) {
    const { rows } = await sql`
      SELECT * FROM episodes 
      WHERE podcast_id = ${podcastId}
      ORDER BY published_date DESC
    `;
    return rows as Episode[];
  } else {
    const { rows } = await sql`
      SELECT * FROM episodes 
      ORDER BY published_date DESC
    `;
    return rows as Episode[];
  }
}

export async function getEpisodeById(id: number): Promise<Episode | null> {
  const { rows } = await sql`SELECT * FROM episodes WHERE id = ${id}`;
  return rows.length > 0 ? (rows[0] as Episode) : null;
}

export async function createEpisode(
  episode: Omit<Episode, "id">
): Promise<Episode> {
  const publishedDate = episode.published_date
    ? new Date(episode.published_date).toISOString()
    : null;

  const { rows } = await sql`
    INSERT INTO episodes (
      podcast_id, title, description, summary, 
      published_date, url, audio_file_path
    )
    VALUES (
      ${episode.podcast_id}, ${episode.title}, 
      ${episode.description || null}, ${episode.summary || null},
      ${publishedDate}, ${episode.url || null}, 
      ${episode.audio_file_path || null}
    )
    RETURNING *
  `;
  return rows[0] as Episode;
}

export async function updateEpisode(
  id: number,
  episode: Partial<Episode>
): Promise<Episode | null> {
  const publishedDate = episode.published_date
    ? new Date(episode.published_date).toISOString()
    : null;

  const { rows } = await sql`
    UPDATE episodes
    SET 
      podcast_id = COALESCE(${episode.podcast_id}, podcast_id),
      title = COALESCE(${episode.title}, title),
      description = COALESCE(${episode.description}, description),
      summary = COALESCE(${episode.summary}, summary),
      published_date = COALESCE(${publishedDate}, published_date),
      url = COALESCE(${episode.url}, url),
      audio_file_path = COALESCE(${episode.audio_file_path}, audio_file_path)
    WHERE id = ${id}
    RETURNING *
  `;
  return rows.length > 0 ? (rows[0] as Episode) : null;
}

export async function deleteEpisode(id: number): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM episodes WHERE id = ${id}`;
  return rowCount ? rowCount > 0 : false;
}

// Speaker CRUD operations
export async function getSpeakers(): Promise<Speaker[]> {
  const { rows } = await sql`SELECT * FROM speakers ORDER BY name`;
  return rows as Speaker[];
}

export async function getSpeakerById(id: number): Promise<Speaker | null> {
  const { rows } = await sql`SELECT * FROM speakers WHERE id = ${id}`;
  return rows.length > 0 ? (rows[0] as Speaker) : null;
}

export async function createSpeaker(
  speaker: Omit<Speaker, "id">
): Promise<Speaker> {
  const { rows } = await sql`
    INSERT INTO speakers (name, bio)
    VALUES (${speaker.name}, ${speaker.bio || null})
    RETURNING *
  `;
  return rows[0] as Speaker;
}

// Episode-Speaker relations
export async function addSpeakerToEpisode(
  episodeId: number,
  speakerId: number
): Promise<boolean> {
  const { rowCount } = await sql`
    INSERT INTO episode_speakers (episode_id, speaker_id)
    VALUES (${episodeId}, ${speakerId})
    ON CONFLICT (episode_id, speaker_id) DO NOTHING
  `;
  return rowCount ? rowCount > 0 : false;
}

export async function getEpisodeSpeakers(
  episodeId: number
): Promise<Speaker[]> {
  const { rows } = await sql`
    SELECT s.* FROM speakers s
    JOIN episode_speakers es ON s.id = es.speaker_id
    WHERE es.episode_id = ${episodeId}
    ORDER BY s.name
  `;
  return rows as Speaker[];
}

// Transcript chunk operations
export async function storeTranscriptChunk(
  chunk: Omit<TranscriptChunk, "id">
): Promise<TranscriptChunk> {
  const { rows } = await sql`
    INSERT INTO transcript_chunks (
      episode_id, content, speaker_id, start_time, end_time, embedding_id
    )
    VALUES (
      ${chunk.episode_id}, ${chunk.content}, 
      ${chunk.speaker_id || null}, ${chunk.start_time}, 
      ${chunk.end_time}, ${chunk.embedding_id || null}
    )
    RETURNING *
  `;
  return rows[0] as TranscriptChunk;
}

export async function getTranscriptChunks(
  episodeId: number
): Promise<TranscriptChunk[]> {
  const { rows } = await sql`
    SELECT * FROM transcript_chunks
    WHERE episode_id = ${episodeId}
    ORDER BY start_time
  `;
  return rows as TranscriptChunk[];
}

// Keyword search
export async function searchTranscriptsByKeyword(
  query: string,
  podcastIds?: number[]
): Promise<TranscriptChunk[]> {
  if (podcastIds && podcastIds.length > 0) {
    // Convert the array to a string representation that PostgreSQL can understand
    const podcastIdsString = `{${podcastIds.join(",")}}`;

    const { rows } = await sql`
      SELECT tc.* FROM transcript_chunks tc
      JOIN episodes e ON tc.episode_id = e.id
      WHERE 
        e.podcast_id = ANY(${podcastIdsString}::int[])
        AND tc.content ILIKE ${`%${query}%`}
      ORDER BY tc.start_time
      LIMIT 50
    `;
    return rows as TranscriptChunk[];
  } else {
    const { rows } = await sql`
      SELECT * FROM transcript_chunks
      WHERE content ILIKE ${`%${query}%`}
      ORDER BY start_time
      LIMIT 50
    `;
    return rows as TranscriptChunk[];
  }
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  // Create podcasts table
  await sql`
    CREATE TABLE IF NOT EXISTS podcasts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      url TEXT
    )
  `;

  // Create episodes table
  await sql`
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
  `;

  // Create speakers table
  await sql`
    CREATE TABLE IF NOT EXISTS speakers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT
    )
  `;

  // Create episode_speakers table
  await sql`
    CREATE TABLE IF NOT EXISTS episode_speakers (
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
      PRIMARY KEY (episode_id, speaker_id)
    )
  `;

  // Create transcript_chunks table
  await sql`
    CREATE TABLE IF NOT EXISTS transcript_chunks (
      id SERIAL PRIMARY KEY,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL,
      start_time FLOAT NOT NULL,
      end_time FLOAT NOT NULL,
      embedding_id TEXT
    )
  `;

  console.log("Database schema initialized");
}
