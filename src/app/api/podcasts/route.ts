import { NextRequest, NextResponse } from "next/server";
import {
  getPodcasts,
  getPodcastById,
  createPodcast,
  updatePodcast,
  deletePodcast,
} from "@/lib/database/postgres";

// GET /api/podcasts - Get all podcasts
export async function GET() {
  try {
    const podcasts = await getPodcasts();
    return NextResponse.json(podcasts);
  } catch (error) {
    console.error("Error fetching podcasts:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcasts" },
      { status: 500 }
    );
  }
}

// POST /api/podcasts - Create a new podcast
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Podcast name is required" },
        { status: 400 }
      );
    }

    const podcast = await createPodcast({
      name: data.name,
      description: data.description,
      url: data.url,
    });

    return NextResponse.json(podcast, { status: 201 });
  } catch (error) {
    console.error("Error creating podcast:", error);
    return NextResponse.json(
      { error: "Failed to create podcast" },
      { status: 500 }
    );
  }
}
