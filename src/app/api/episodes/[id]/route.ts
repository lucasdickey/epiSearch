import { NextRequest, NextResponse } from "next/server";
import {
  getEpisodeById,
  updateEpisode,
  deleteEpisode,
} from "@/lib/database/postgres";
import { deleteEpisodeEmbeddings } from "@/lib/pinecone/client";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/episodes/[id] - Get episode by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid episode ID" },
        { status: 400 }
      );
    }

    const episode = await getEpisodeById(id);

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error("Error fetching episode:", error);
    return NextResponse.json(
      { error: "Failed to fetch episode" },
      { status: 500 }
    );
  }
}

// PUT /api/episodes/[id] - Update episode
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid episode ID" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Convert published_date to Date object if provided
    const publishedDate = data.published_date
      ? new Date(data.published_date)
      : undefined;

    const episode = await updateEpisode(id, {
      podcast_id: data.podcast_id,
      title: data.title,
      description: data.description,
      summary: data.summary,
      published_date: publishedDate,
      url: data.url,
      audio_file_path: data.audio_file_path,
    });

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error("Error updating episode:", error);
    return NextResponse.json(
      { error: "Failed to update episode" },
      { status: 500 }
    );
  }
}

// DELETE /api/episodes/[id] - Delete episode
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid episode ID" },
        { status: 400 }
      );
    }

    // Get episode to get podcast ID for deleting embeddings
    const episode = await getEpisodeById(id);

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    // Delete episode from database
    const deleted = await deleteEpisode(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete episode" },
        { status: 500 }
      );
    }

    // Delete episode embeddings from Pinecone
    try {
      await deleteEpisodeEmbeddings(id, episode.podcast_id);
    } catch (error) {
      console.error("Error deleting episode embeddings:", error);
      // Continue even if embeddings deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting episode:", error);
    return NextResponse.json(
      { error: "Failed to delete episode" },
      { status: 500 }
    );
  }
}
