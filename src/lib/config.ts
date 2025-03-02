// Load environment variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}

// Database configuration
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/podcast_rag";

// Pinecone configuration
const pineconeApiKey = process.env.PINECONE_API_KEY || "";
const pineconeEnvironment = process.env.PINECONE_ENVIRONMENT || "";
const pineconeIndex = process.env.PINECONE_INDEX || "";

// Anthropic configuration
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || "";
const anthropicModel =
  process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229";

// Audio configuration
const audioBasePath = process.env.AUDIO_BASE_PATH || "./public/audio";

// Export configuration
export const config = {
  databaseUrl,
  pinecone: {
    apiKey: pineconeApiKey,
    environment: pineconeEnvironment,
    index: pineconeIndex,
  },
  anthropic: {
    apiKey: anthropicApiKey,
    model: anthropicModel,
  },
  audio: {
    basePath: audioBasePath,
  },
};
