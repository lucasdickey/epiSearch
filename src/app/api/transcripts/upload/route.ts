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
        // Validate SRT and diarized content
        if (
          typeof data.srtContent !== "string" ||
          data.srtContent.trim().length === 0
        ) {
          return NextResponse.json(
            {
              error: "Invalid SRT content",
              details: "SRT content is empty or not a string",
            },
            { status: 400 }
          );
        }

        if (
          typeof data.diarizedContent !== "string" ||
          data.diarizedContent.trim().length === 0
        ) {
          return NextResponse.json(
            {
              error: "Invalid diarized content",
              details: "Diarized content is empty or not a string",
            },
            { status: 400 }
          );
        }

        // SRT + diarized text format
        transcript = parseSRTAndDiarized(
          data.srtContent,
          data.diarizedContent,
          metadata
        );

        // Validate parsed transcript
        if (!transcript.segments || transcript.segments.length === 0) {
          return NextResponse.json(
            {
              error: "Failed to parse transcript",
              details:
                "No segments were created from the provided SRT and diarized content",
            },
            { status: 400 }
          );
        }
      } else if (data.segments) {
        // Validate segments
        if (!Array.isArray(data.segments) || data.segments.length === 0) {
          return NextResponse.json(
            {
              error: "Invalid segments",
              details: "Segments must be a non-empty array",
            },
            { status: 400 }
          );
        }

        // Legacy JSON format
        const transcriptData = {
          ...data,
          podcastId: episode.podcast_id,
          episodeId: episode.id,
          title: episode.title,
          description: episode.description,
        };
        transcript = parseTranscriptJSON(transcriptData);

        // Validate parsed transcript
        if (!transcript.segments || transcript.segments.length === 0) {
          return NextResponse.json(
            {
              error: "Failed to parse transcript",
              details: "No segments were created from the provided JSON",
            },
            { status: 400 }
          );
        }
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
      console.log(
        `Processing transcript with ${transcript.segments.length} segments for episode ${episode.id}`
      );
      const result = await processTranscript(transcript);

      if (!result.success) {
        return NextResponse.json(
          {
            error: "Failed to process transcript",
            details: `Processed ${result.chunkCount} chunks but encountered errors`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Processed ${result.chunkCount} chunks`,
        chunkCount: result.chunkCount,
        success: result.success,
      });
    } catch (error) {
      console.error("Error processing transcript:", error);
      return NextResponse.json(
        {
          error: "Failed to process transcript",
          details: String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error uploading transcript:", error);
    return NextResponse.json(
      {
        error: "Failed to upload transcript",
        details: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
