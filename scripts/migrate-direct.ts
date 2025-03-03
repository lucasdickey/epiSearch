import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Create a new pool using the connection string from config
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/podcast",
});

async function migrateDatabase(): Promise<void> {
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

async function main() {
  console.log("Starting database migration...");

  try {
    await migrateDatabase();
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
