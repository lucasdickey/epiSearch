import { NextRequest, NextResponse } from "next/server";
import {
  parseTranscriptJSON,
  processTranscript,
  parseSRTAndDiarized,
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

    // Create metadata object
    const metadata = {
      podcastId: episode.podcast_id,
      episodeId: episode.id,
      title: episode.title,
      description: episode.description,
    };

    // Process transcript based on format
    try {
      let transcript;

      // Check which format we're dealing with
      if (data.srtContent && data.diarizedContent) {
        // SRT + diarized text format
        transcript = parseSRTAndDiarized(
          data.srtContent,
          data.diarizedContent,
          metadata
        );
      } else if (data.segments) {
        // Legacy JSON format
        const transcriptData = {
          ...data,
          podcastId: episode.podcast_id,
          episodeId: episode.id,
          title: episode.title,
          description: episode.description,
        };
        transcript = parseTranscriptJSON(transcriptData);
      } else {
        return NextResponse.json(
          {
            error: "Invalid transcript format",
            details:
              "Please provide either srtContent + diarizedContent or segments",
          },
          { status: 400 }
        );
      }

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
