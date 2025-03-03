import { NextRequest, NextResponse } from "next/server";
import { getEpisodes, createEpisode } from "@/lib/database/postgres";

// GET /api/episodes - Get all episodes or episodes by podcast ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const podcastId = searchParams.get("podcast_id");

    let episodes;
    if (podcastId) {
      episodes = await getEpisodes(parseInt(podcastId));
    } else {
      episodes = await getEpisodes();
    }

    return NextResponse.json(episodes);
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}

// POST /api/episodes - Create a new episode
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.podcast_id || !data.title) {
      return NextResponse.json(
        { error: "Podcast ID and title are required" },
        { status: 400 }
      );
    }

    const episode = await createEpisode({
      podcast_id: data.podcast_id,
      title: data.title,
      description: data.description,
      summary: data.summary,
      published_date: data.published_date
        ? new Date(data.published_date)
        : undefined,
      url: data.url,
    });

    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    console.error("Error creating episode:", error);
    return NextResponse.json(
      { error: "Failed to create episode" },
      { status: 500 }
    );
  }
}
