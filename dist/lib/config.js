"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// Load environment variables
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ path: ".env.local" });
}
// Database configuration
var databaseUrl = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/podcast_rag";
// Pinecone configuration
var pineconeApiKey = process.env.PINECONE_API_KEY || "";
var pineconeEnvironment = process.env.PINECONE_ENVIRONMENT || "";
var pineconeIndex = process.env.PINECONE_INDEX || "";
// Anthropic configuration
var anthropicApiKey = process.env.ANTHROPIC_API_KEY || "";
var anthropicModel = process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229";
// Audio configuration
var audioBasePath = process.env.AUDIO_BASE_PATH || "./public/audio";
// Export configuration
exports.config = {
    databaseUrl: databaseUrl,
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
