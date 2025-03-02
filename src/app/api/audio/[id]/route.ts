import { NextRequest, NextResponse } from "next/server";
import { getEpisodeById } from "@/lib/database/postgres";
import fs from "fs";
import path from "path";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid episode ID" },
        { status: 400 }
      );
    }

    // Get episode data
    const episode = await getEpisodeById(id);

    if (!episode || !episode.audio_file_path) {
      return NextResponse.json(
        { error: "Audio file not found" },
        { status: 404 }
      );
    }

    // Get timestamp from query params
    const searchParams = request.nextUrl.searchParams;
    const timestamp = searchParams.get("t");

    // If timestamp is provided, redirect to audio player with timestamp
    if (timestamp) {
      // Create a URL for the audio player with timestamp
      const audioUrl = `/player/${id}?t=${timestamp}`;
      return NextResponse.redirect(new URL(audioUrl, request.url));
    }

    // Otherwise, serve the audio file directly
    try {
      const audioPath = episode.audio_file_path;

      // Check if the file exists
      if (!fs.existsSync(audioPath)) {
        return NextResponse.json(
          { error: "Audio file not found on server" },
          { status: 404 }
        );
      }

      // Get file stats
      const stat = fs.statSync(audioPath);
      const fileSize = stat.size;

      // Get range from request headers
      const range = request.headers.get("range");

      if (range) {
        // Parse range
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        // Create readable stream
        const file = fs.createReadStream(audioPath, { start, end });

        // Create response headers
        const headers = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "audio/mpeg",
        };

        // Return partial content
        return new NextResponse(file as any, {
          status: 206,
          headers,
        });
      } else {
        // Return full file
        const headers = {
          "Content-Length": fileSize.toString(),
          "Content-Type": "audio/mpeg",
        };

        const file = fs.createReadStream(audioPath);
        return new NextResponse(file as any, {
          status: 200,
          headers,
        });
      }
    } catch (error) {
      console.error("Error serving audio file:", error);
      return NextResponse.json(
        { error: "Failed to serve audio file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching audio:", error);
    return NextResponse.json(
      { error: "Failed to fetch audio" },
      { status: 500 }
    );
  }
}
