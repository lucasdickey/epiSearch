import { Pool } from "pg";
import { config } from "../config";

const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query("BEGIN");

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

    console.log("Database initialized successfully");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Database initialization failed:", error);
      process.exit(1);
    });
}
