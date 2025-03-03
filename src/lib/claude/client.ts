import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Generate embeddings using Claude
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  // Process in batches to avoid rate limits
  const batchSize = 10;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const promises = batch.map(async (text, index) => {
      try {
        // Skip empty text
        if (!text || text.trim().length === 0) {
          console.warn(
            `Empty text at index ${i + index}, returning zero vector`
          );
          return new Array(3072).fill(0);
        }

        // Using a separate API call for embeddings since it's not in the main SDK
        const response = await fetch(
          "https://api.anthropic.com/v1/embeddings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.ANTHROPIC_API_KEY || "",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-3-sonnet-20240229",
              input: text,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Embedding API error (${response.status}):`, errorData);
          return new Array(3072).fill(0);
        }

        const data = await response.json();

        // Validate the embedding data
        if (
          !data.embedding ||
          !Array.isArray(data.embedding) ||
          data.embedding.length === 0
        ) {
          console.error("Invalid embedding response:", data);
          return new Array(3072).fill(0);
        }

        return data.embedding;
      } catch (error) {
        console.error("Error generating embedding:", error);
        // Return a zero vector as fallback (3072 dimensions for Claude)
        return new Array(3072).fill(0);
      }
    });

    try {
      const batchEmbeddings = await Promise.all(promises);
      embeddings.push(...batchEmbeddings);
    } catch (error) {
      console.error("Error processing batch embeddings:", error);
      // Add zero vectors for the entire batch as fallback
      embeddings.push(...Array(batch.length).fill(new Array(3072).fill(0)));
    }
  }

  return embeddings;
}

// Rewrite query for better retrieval
export async function rewriteQuery(query: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are analyzing a user query to improve podcast transcript retrieval.
          
Chain 1: What are the explicit topics and keywords in this query?
Chain 2: What are implicit topics that might be related but not directly mentioned?
Chain 3: What speaker expertise would be most relevant to answering this query?
Chain 4: What type of information would constitute a complete answer to this query?

User Query: ${query}

Analyze each chain of thought, then produce:
1. An expanded query for semantic search that includes both explicit and implicit topics
2. Keep it concise and focused on retrieving relevant information
3. Do not add unnecessary details or explanations

Output only the expanded query text with no additional formatting or explanation.`,
        },
      ],
    });

    // Extract text from the response
    const content = response.content[0];
    if (content.type === "text") {
      return content.text;
    }
    return query; // Return original query if response format is unexpected
  } catch (error) {
    console.error("Error rewriting query:", error);
    return query; // Return original query if rewriting fails
  }
}

// Rerank search results
export async function rerankResults(
  query: string,
  results: any[],
  topK: number = 20
): Promise<any[]> {
  try {
    // Format results for the prompt
    const formattedResults = results
      .map((result, index) => {
        return `[${index + 1}] ${result.metadata.content} (Speaker: ${
          result.metadata.speakerId
        }, Time: ${result.metadata.startTime}-${result.metadata.endTime})`;
      })
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are evaluating potential citations from podcast transcripts.

Chain 1: How directly does each excerpt answer the user's question?
Chain 2: How authoritative is the speaker on this specific topic?
Chain 3: How recent and still-relevant is this information?
Chain 4: How well does each citation complement other selected citations?

User Query: ${query}

Potential Citations:
${formattedResults}

Based on these considerations, rank the citations by overall relevance. Return only the numbers of the top ${topK} most relevant citations in order of relevance, separated by commas. For example: "3, 7, 1, 12, 5"

Output only the comma-separated list of numbers with no additional text.`,
        },
      ],
    });

    // Extract text from the response
    const content = response.content[0];
    if (content.type !== "text") {
      return results.slice(0, topK);
    }

    // Parse the response to get the reranked indices
    const rerankedIndices = content.text
      .split(",")
      .map((s: string) => parseInt(s.trim()) - 1) // Convert to 0-indexed
      .filter((i: number) => !isNaN(i) && i >= 0 && i < results.length);

    // Return reranked results
    return rerankedIndices.map((i: number) => results[i]);
  } catch (error) {
    console.error("Error reranking results:", error);
    return results.slice(0, topK); // Return original results if reranking fails
  }
}

// Generate response with citations
export async function generateResponse(
  query: string,
  chunks: any[],
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ answer: string; citations: any[] }> {
  try {
    // Format chunks for the prompt
    const contextText = chunks
      .map((chunk, index) => {
        return `[${index + 1}] ${chunk.metadata.content} (Speaker: ${
          chunk.metadata.speakerId
        }, Episode: ${chunk.metadata.episodeId}, Time: ${
          chunk.metadata.startTime
        }-${chunk.metadata.endTime})`;
      })
      .join("\n\n");

    // Format conversation history
    const historyText = conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      system: `You are synthesizing information from podcast transcripts to answer a user query.
          
Your task is to create a comprehensive, accurate response based on the provided transcript chunks.

Guidelines:
1. Provide a bulleted list of key points with citation numbers in [brackets]
2. Follow with 1-2 paragraphs expanding on these points
3. Show multiple viewpoints when present, indicating consensus vs minority positions
4. Include numbered citations at the end with speaker and episode information
5. Only use information from the provided chunks
6. If the chunks don't contain relevant information, say so clearly
7. Use citation numbers consistently throughout your response`,
      messages: [
        ...conversationHistory,
        {
          role: "user",
          content: `Query: ${query}

${historyText ? `Conversation History:\n${historyText}\n\n` : ""}

Relevant Transcript Chunks:
${contextText}

Please provide a comprehensive answer to my query based on these transcript chunks.`,
        },
      ],
    });

    // Extract text from the response
    const content = response.content[0];
    if (content.type !== "text") {
      return {
        answer:
          "I'm sorry, I encountered an error while generating a response. Please try again.",
        citations: [],
      };
    }

    // Extract citations from the response
    const answerText = content.text;
    const citations = extractCitations(answerText, chunks);

    return {
      answer: answerText,
      citations,
    };
  } catch (error) {
    console.error("Error generating response:", error);
    return {
      answer:
        "I'm sorry, I encountered an error while generating a response. Please try again.",
      citations: [],
    };
  }
}

// Helper function to extract citations from the response
function extractCitations(text: string, chunks: any[]): any[] {
  const citationRegex = /\[(\d+)\]/g;
  const citationMatches = [...text.matchAll(citationRegex)];

  const uniqueCitationIndices = [
    ...new Set(citationMatches.map((match) => parseInt(match[1]) - 1)),
  ].filter((i) => i >= 0 && i < chunks.length);

  return uniqueCitationIndices.map((index) => {
    const chunk = chunks[index];
    return {
      id: chunk.id,
      chunk_id: chunk.id,
      episode_id: chunk.metadata.episodeId,
      podcast_id: chunk.metadata.podcastId,
      speaker_id: chunk.metadata.speakerId,
      start_time: chunk.metadata.startTime,
      end_time: chunk.metadata.endTime,
      content: chunk.metadata.content,
      // These fields would be populated later with actual data
      episode_title: "",
      podcast_name: "",
      speaker_name: "",
      url: "",
      audio_url: "",
    };
  });
}
