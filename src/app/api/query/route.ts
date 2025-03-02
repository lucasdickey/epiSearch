import { NextRequest, NextResponse } from "next/server";
import { hybridSearch, formatCitations } from "@/lib/search/hybrid";
import { generateResponse } from "@/lib/claude/client";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Get podcast IDs to search in
    const podcastIds = data.podcastIds || [];

    // Get conversation history if provided
    const conversationHistory = data.conversationHistory || [];

    // Perform hybrid search
    const searchResults = await hybridSearch(data.query, podcastIds);

    if (searchResults.length === 0) {
      return NextResponse.json({
        answer:
          "I couldn't find any relevant information in the podcast transcripts for your query.",
        citations: [],
      });
    }

    // Format citations
    const citations = formatCitations(searchResults);

    // Generate response
    const response = await generateResponse(
      data.query,
      searchResults,
      conversationHistory
    );

    return NextResponse.json({
      answer: response.answer,
      citations: response.citations.length > 0 ? response.citations : citations,
    });
  } catch (error) {
    console.error("Error querying transcripts:", error);
    return NextResponse.json(
      { error: "Failed to query transcripts", details: String(error) },
      { status: 500 }
    );
  }
}
