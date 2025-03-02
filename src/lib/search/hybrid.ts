import {
  generateEmbeddings,
  rewriteQuery,
  rerankResults,
} from "../claude/client";
import { searchEmbeddings } from "../pinecone/client";
import {
  searchTranscriptsByKeyword,
  getEpisodeById,
  getPodcastById,
  getSpeakerById,
} from "../database/postgres";
import { SearchResult, Citation } from "../database/types";

// Hybrid search function
export async function hybridSearch(
  query: string,
  podcastIds: number[],
  limit: number = 30
): Promise<SearchResult[]> {
  try {
    // 1. Rewrite query for better retrieval
    const enhancedQuery = await rewriteQuery(query);
    console.log("Enhanced query:", enhancedQuery);

    // 2. Generate embedding for the query
    const [queryEmbedding] = await generateEmbeddings([enhancedQuery]);

    // 3. Perform semantic search in Pinecone
    const semanticResults = await searchEmbeddings(queryEmbedding, podcastIds);

    // 4. Extract keywords for filtering
    const keywords = extractKeywords(enhancedQuery);

    // 5. Perform keyword search in PostgreSQL
    const keywordResults = await Promise.all(
      keywords.map((keyword) => searchTranscriptsByKeyword(keyword, podcastIds))
    );

    // Flatten keyword results
    const flattenedKeywordResults = keywordResults.flat();

    // 6. Combine and deduplicate results
    const combinedResults = mergeAndDeduplicate(
      semanticResults,
      flattenedKeywordResults
    );

    // 7. Rerank results using Claude
    const rerankedResults = await rerankResults(query, combinedResults, limit);

    // 8. Enrich results with metadata
    const enrichedResults = await enrichResults(rerankedResults);

    return enrichedResults.slice(0, limit);
  } catch (error) {
    console.error("Error in hybrid search:", error);
    return [];
  }
}

// Extract keywords from query
function extractKeywords(query: string): string[] {
  // Remove common stop words
  const stopWords = [
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "about",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "of",
    "by",
    "from",
    "that",
    "this",
    "these",
    "those",
    "it",
    "its",
    "what",
    "which",
    "who",
    "whom",
    "whose",
    "when",
    "where",
    "why",
    "how",
  ];

  // Split query into words, convert to lowercase, and filter out stop words
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  // Return unique keywords
  return [...new Set(words)];
}

// Merge and deduplicate results
function mergeAndDeduplicate(
  semanticResults: any[],
  keywordResults: any[]
): any[] {
  // Create a map to track unique results by ID
  const uniqueResults = new Map();

  // Add semantic results to the map
  semanticResults.forEach((result) => {
    uniqueResults.set(result.id, {
      ...result,
      score: result.score || 0,
      source: "semantic",
    });
  });

  // Add keyword results to the map, boosting score if already present
  keywordResults.forEach((result) => {
    const id = result.id || `${result.episode_id}-${result.start_time}`;

    if (uniqueResults.has(id)) {
      // Boost score for results found by both methods
      const existingResult = uniqueResults.get(id);
      existingResult.score += 0.2; // Boost score
      existingResult.source = "both";
      uniqueResults.set(id, existingResult);
    } else {
      // Add new result
      uniqueResults.set(id, {
        id,
        metadata: {
          content: result.content,
          episodeId: result.episode_id,
          speakerId: result.speaker_id,
          startTime: result.start_time,
          endTime: result.end_time,
        },
        score: 0.5, // Base score for keyword results
        source: "keyword",
      });
    }
  });

  // Convert map to array and sort by score
  return Array.from(uniqueResults.values()).sort((a, b) => b.score - a.score);
}

// Enrich results with metadata
async function enrichResults(results: any[]): Promise<SearchResult[]> {
  const enrichedResults: SearchResult[] = [];

  for (const result of results) {
    try {
      // Get episode data
      const episode = await getEpisodeById(result.metadata.episodeId);
      if (!episode) continue;

      // Get podcast data
      const podcast = await getPodcastById(episode.podcast_id);
      if (!podcast) continue;

      // Get speaker data if available
      let speaker = undefined;
      if (result.metadata.speakerId) {
        const speakerData = await getSpeakerById(
          parseInt(result.metadata.speakerId)
        );
        // Only assign if not null
        if (speakerData) {
          speaker = speakerData;
        }
      }

      // Create enriched result
      enrichedResults.push({
        chunk: {
          id: result.id,
          episode_id: result.metadata.episodeId,
          content: result.metadata.content,
          speaker_id: result.metadata.speakerId
            ? parseInt(result.metadata.speakerId)
            : undefined,
          start_time: result.metadata.startTime,
          end_time: result.metadata.endTime,
          embedding_id: result.id,
        },
        score: result.score,
        episode,
        podcast,
        speaker,
      });
    } catch (error) {
      console.error("Error enriching result:", error);
      // Skip this result if there's an error
      continue;
    }
  }

  return enrichedResults;
}

// Format citations from search results
export function formatCitations(results: SearchResult[]): Citation[] {
  return results.map((result, index) => ({
    id: `citation-${index}`,
    chunk_id: result.chunk.id,
    episode_id: result.episode.id,
    podcast_id: result.podcast.id,
    speaker_id: result.chunk.speaker_id,
    start_time: result.chunk.start_time,
    end_time: result.chunk.end_time,
    content: result.chunk.content,
    episode_title: result.episode.title,
    podcast_name: result.podcast.name,
    speaker_name: result.speaker?.name || "Unknown Speaker",
    url: result.episode.url,
    audio_url: `/api/audio/${result.episode.id}?t=${result.chunk.start_time}`,
  }));
}
