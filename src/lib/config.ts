/**
 * Application configuration
 * Loads environment variables and provides typed access to them
 */

// Load environment variables
const env = process.env;

export const config = {
  // Database configuration
  databaseUrl:
    env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/podcast",

  // Pinecone configuration
  pineconeApiKey: env.PINECONE_API_KEY || "",
  pineconeEnvironment: env.PINECONE_ENVIRONMENT || "",
  pineconeIndex: env.PINECONE_INDEX || "podcast-episodes",

  // OpenAI configuration
  openaiApiKey: env.OPENAI_API_KEY || "",
  openaiEmbeddingModel: env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large",
  openaiCompletionModel: env.OPENAI_COMPLETION_MODEL || "gpt-4-turbo",

  // Application configuration
  nodeEnv: env.NODE_ENV || "development",
  isDevelopment: (env.NODE_ENV || "development") === "development",
  isProduction: env.NODE_ENV === "production",
};
