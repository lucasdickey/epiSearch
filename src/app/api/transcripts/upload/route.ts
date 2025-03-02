import { NextRequest, NextResponse } from "next/server";
import {
  parseTranscriptJSON,
  processTranscript,
} from "@/lib/chunking/processor";
import { getEpisodeById } from "@/lib/database/postgres";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.episodeId) {
      return NextResponse.json(
        { error: "Episode ID is required" },
        { status: 400 }
      );
    }

    // Check if episode exists
    const episode = await getEpisodeById(data.episodeId);

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    // Parse and process transcript
    try {
      // Add episode and podcast IDs to transcript data
      const transcriptData = {
        ...data,
        podcastId: episode.podcast_id,
        episodeId: episode.id,
        title: episode.title,
        description: episode.description,
      };

      // Parse transcript JSON
      const transcript = parseTranscriptJSON(transcriptData);

      // Process transcript
      const result = await processTranscript(transcript);

      return NextResponse.json({
        message: `Processed ${result.chunkCount} chunks`,
        chunkCount: result.chunkCount,
        success: result.success,
      });
    } catch (error) {
      console.error("Error processing transcript:", error);
      return NextResponse.json(
        { error: "Failed to process transcript", details: String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error uploading transcript:", error);
    return NextResponse.json(
      { error: "Failed to upload transcript" },
      { status: 500 }
    );
  }
}
