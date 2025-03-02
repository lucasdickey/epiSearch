import { NextRequest, NextResponse } from "next/server";
import {
  getPodcastById,
  updatePodcast,
  deletePodcast,
} from "@/lib/database/postgres";
import { deletePodcastEmbeddings } from "@/lib/pinecone/client";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/podcasts/[id] - Get podcast by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid podcast ID" },
        { status: 400 }
      );
    }

    const podcast = await getPodcastById(id);

    if (!podcast) {
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    }

    return NextResponse.json(podcast);
  } catch (error) {
    console.error("Error fetching podcast:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcast" },
      { status: 500 }
    );
  }
}

// PUT /api/podcasts/[id] - Update podcast
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid podcast ID" },
        { status: 400 }
      );
    }

    const data = await request.json();

    const podcast = await updatePodcast(id, {
      name: data.name,
      description: data.description,
      url: data.url,
    });

    if (!podcast) {
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    }

    return NextResponse.json(podcast);
  } catch (error) {
    console.error("Error updating podcast:", error);
    return NextResponse.json(
      { error: "Failed to update podcast" },
      { status: 500 }
    );
  }
}

// DELETE /api/podcasts/[id] - Delete podcast
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid podcast ID" },
        { status: 400 }
      );
    }

    // Delete podcast from database
    const deleted = await deletePodcast(id);

    if (!deleted) {
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    }

    // Delete podcast embeddings from Pinecone
    try {
      await deletePodcastEmbeddings(id);
    } catch (error) {
      console.error("Error deleting podcast embeddings:", error);
      // Continue even if embeddings deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting podcast:", error);
    return NextResponse.json(
      { error: "Failed to delete podcast" },
      { status: 500 }
    );
  }
}
