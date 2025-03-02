import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database/postgres";

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize database",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
