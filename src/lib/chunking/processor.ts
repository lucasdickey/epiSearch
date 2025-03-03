import { TranscriptChunk } from "../database/types";
import { generateEmbeddings } from "../claude/client";
import { storeEmbeddings } from "../pinecone/client";
import { storeTranscriptChunk } from "../database/postgres";
import { TranscriptSegment, Transcript } from "./types";
import { parseSRT, parseDiarizedText, combineTranscripts } from "./srt-parser";

// Create sentence-level chunks
function createSentenceChunks(transcript: Transcript): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];

  // Process each segment
  transcript.segments.forEach((segment) => {
    // Split content into sentences
    const sentences = segment.content.split(/(?<=[.!?])\s+/);

    // Create a chunk for each sentence
    sentences.forEach((sentence, index) => {
      if (sentence.trim().length === 0) return;

      // Calculate approximate time for the sentence
      const segmentDuration = segment.endTime - segment.startTime;
      const sentenceRatio = sentence.length / segment.content.length;
      const sentenceDuration = segmentDuration * sentenceRatio;

      const startTime =
        segment.startTime + segmentDuration * (index / sentences.length);
      const endTime = startTime + sentenceDuration;

      chunks.push({
        id: "", // Will be set after embedding
        episode_id: transcript.metadata.episodeId,
        content: sentence.trim(),
        speaker_id: segment.speakerId,
        start_time: startTime,
        end_time: endTime,
        embedding_id: "", // Will be set after embedding
      });
    });
  });

  return chunks;
}

// Create cross-section chunks
function createCrossSectionChunks(transcript: Transcript): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];
  const segments = transcript.segments;

  // Create chunks that span multiple segments for context
  for (let i = 0; i < segments.length; i++) {
    // Create chunks of 2-3 consecutive segments
    for (let span = 2; span <= 3; span++) {
      if (i + span <= segments.length) {
        const spanSegments = segments.slice(i, i + span);

        // Combine content from segments
        const content = spanSegments
          .map((seg) => `${seg.speaker}: ${seg.content}`)
          .join(" ");

        // Use time range from first to last segment
        const startTime = spanSegments[0].startTime;
        const endTime = spanSegments[spanSegments.length - 1].endTime;

        chunks.push({
          id: "", // Will be set after embedding
          episode_id: transcript.metadata.episodeId,
          content: content.trim(),
          speaker_id: undefined, // Multiple speakers
          start_time: startTime,
          end_time: endTime,
          embedding_id: "", // Will be set after embedding
        });
      }
    }
  }

  return chunks;
}

// Process transcript and store chunks
export async function processTranscript(transcript: Transcript): Promise<{
  chunkCount: number;
  success: boolean;
}> {
  try {
    // Create sentence-level chunks
    const sentenceChunks = createSentenceChunks(transcript);

    // Create cross-section chunks
    const crossSectionChunks = createCrossSectionChunks(transcript);

    // Combine all chunks
    const allChunks = [...sentenceChunks, ...crossSectionChunks];

    // Generate embeddings
    const contents = allChunks.map((chunk) => chunk.content);
    const embeddings = await generateEmbeddings(contents);

    // Store embeddings in Pinecone
    const speakerIds = allChunks.map((chunk) => chunk.speaker_id);
    const startTimes = allChunks.map((chunk) => chunk.start_time);
    const endTimes = allChunks.map((chunk) => chunk.end_time);

    const embeddingIds = await storeEmbeddings(
      embeddings,
      contents,
      transcript.metadata.episodeId,
      transcript.metadata.podcastId,
      speakerIds,
      startTimes,
      endTimes
    );

    // Store chunks in PostgreSQL with embedding IDs
    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i];
      chunk.embedding_id = embeddingIds[i];
      await storeTranscriptChunk(chunk);
    }

    return {
      chunkCount: allChunks.length,
      success: true,
    };
  } catch (error) {
    console.error("Error processing transcript:", error);
    return {
      chunkCount: 0,
      success: false,
    };
  }
}

// Parse JSON transcript
export function parseTranscriptJSON(transcriptJSON: any): Transcript {
  try {
    // Extract segments
    const segments = transcriptJSON.segments.map((segment: any) => ({
      content: segment.text || "",
      speaker: segment.speaker || "Unknown",
      speakerId: segment.speakerId,
      startTime: segment.start,
      endTime: segment.end,
    }));

    // Extract metadata
    const metadata = {
      podcastId: transcriptJSON.podcastId,
      episodeId: transcriptJSON.episodeId,
      title: transcriptJSON.title || "",
      description: transcriptJSON.description || "",
    };

    return {
      segments,
      metadata,
    };
  } catch (error) {
    console.error("Error parsing transcript JSON:", error);
    throw new Error("Invalid transcript JSON format");
  }
}

// Parse SRT and diarized text
export function parseSRTAndDiarized(
  srtContent: string,
  diarizedContent: string,
  metadata: {
    podcastId: number;
    episodeId: number;
    title: string;
    description?: string;
  }
): Transcript {
  // Parse SRT file
  const srtData = parseSRT(srtContent);

  // Parse diarized text
  const diarizedData = parseDiarizedText(diarizedContent);

  // Combine the two sources
  return combineTranscripts(srtData, diarizedData, metadata);
}
