import { Pinecone } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: config.pineconeApiKey,
});

// Get the index
const getIndex = () => {
  const indexName = config.pineconeIndex;
  return pinecone.index(indexName);
};

// Define metadata types for Pinecone
type PodcastMetadata = {
  content: string;
  episodeId: number;
  podcastId: number;
  speakerId?: number | null; // Using null instead of undefined for Pinecone compatibility
  startTime: number;
  endTime: number;
};

// Store embeddings in Pinecone
export async function storeEmbeddings(
  embeddings: number[][],
  contents: string[],
  episodeId: number,
  podcastId: number,
  speakerIds: (number | undefined)[],
  startTimes: number[],
  endTimes: number[]
): Promise<string[]> {
  const index = getIndex();
  const namespace = `podcast-${podcastId}`;

  // Create vectors with metadata
  const vectors = embeddings.map((embedding, i) => {
    const id = uuidv4();
    return {
      id,
      values: embedding,
      metadata: {
        content: contents[i],
        episodeId: episodeId,
        podcastId: podcastId,
        speakerId: speakerIds[i] ? speakerIds[i].toString() : "",
        startTime: startTimes[i],
        endTime: endTimes[i],
      },
    };
  });

  // Upsert vectors in batches of 100
  const batchSize = 100;
  const embeddingIds: string[] = [];

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(namespace).upsert(batch);
    embeddingIds.push(...batch.map((v) => v.id));
  }

  return embeddingIds;
}

// Search for similar vectors
export async function searchEmbeddings(
  queryEmbedding: number[],
  podcastIds: number[],
  topK: number = 30
): Promise<any[]> {
  const index = getIndex();

  // Create filter for podcast IDs
  const filter = {
    podcastId: { $in: podcastIds.map((id) => id) },
  };

  // Search for similar vectors
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter,
    includeMetadata: true,
  });

  return results.matches;
}

// Delete embeddings for an episode
export async function deleteEpisodeEmbeddings(
  episodeId: number,
  podcastId: number
): Promise<void> {
  const index = getIndex();
  const namespace = `podcast-${podcastId}`;

  // Delete vectors by filter
  await index.namespace(namespace).deleteMany({
    filter: {
      episodeId: { $eq: episodeId },
    },
  });
}

// Delete all embeddings for a podcast
export async function deletePodcastEmbeddings(
  podcastId: number
): Promise<void> {
  const index = getIndex();
  const namespace = `podcast-${podcastId}`;

  // Delete the entire namespace
  await index.namespace(namespace).deleteAll();
}
