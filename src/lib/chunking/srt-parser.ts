import { TranscriptSegment, Transcript } from "./types";

// Parse SRT timestamp format (00:00:00,000) to seconds
function parseTimestamp(timestamp: string): number {
  const [hours, minutes, secondsMillis] = timestamp.split(":");
  const [seconds, milliseconds] = secondsMillis.split(",");

  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds) +
    parseInt(milliseconds) / 1000
  );
}

// Parse SRT file content
export function parseSRT(content: string): {
  startTimes: number[];
  endTimes: number[];
  texts: string[];
} {
  const lines = content.trim().split("\n");
  const startTimes: number[] = [];
  const endTimes: number[] = [];
  const texts: string[] = [];

  let i = 0;
  while (i < lines.length) {
    // Skip index number
    i++;

    if (i >= lines.length) break;

    // Parse timestamp line
    const timestampLine = lines[i++];
    if (!timestampLine) continue;

    const timestamps = timestampLine.split(" --> ");
    if (timestamps.length !== 2) continue;

    const startTime = parseTimestamp(timestamps[0]);
    const endTime = parseTimestamp(timestamps[1]);

    // Collect text lines until empty line or end of file
    let textContent = "";
    while (i < lines.length && lines[i].trim() !== "") {
      textContent += (textContent ? " " : "") + lines[i].trim();
      i++;
    }

    // Skip empty line
    i++;

    startTimes.push(startTime);
    endTimes.push(endTime);
    texts.push(textContent);
  }

  return { startTimes, endTimes, texts };
}

// Parse diarized text with speaker information
export function parseDiarizedText(content: string): {
  speakers: string[];
  texts: string[];
} {
  const lines = content.trim().split("\n");
  const speakers: string[] = [];
  const texts: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") continue;

    // Match pattern: "Speaker Name: Text content"
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      speakers.push(match[1].trim());
      texts.push(match[2].trim());
    }
  }

  return { speakers, texts };
}

// Combine SRT and diarized text into a transcript
export function combineTranscripts(
  srtData: { startTimes: number[]; endTimes: number[]; texts: string[] },
  diarizedData: { speakers: string[]; texts: string[] },
  metadata: {
    podcastId: number;
    episodeId: number;
    title: string;
    description?: string;
  }
): Transcript {
  // Create a mapping between text content to match SRT with diarized text
  const segments: TranscriptSegment[] = [];

  // First, try to match exact text content
  const textToSpeaker = new Map<string, string>();
  for (let i = 0; i < diarizedData.texts.length; i++) {
    textToSpeaker.set(diarizedData.texts[i], diarizedData.speakers[i]);
  }

  // Create segments from SRT data
  for (let i = 0; i < srtData.texts.length; i++) {
    const text = srtData.texts[i];
    let speaker = textToSpeaker.get(text) || "Unknown";

    // If exact match fails, try fuzzy matching
    if (speaker === "Unknown") {
      // Find the most similar text in diarized data
      let bestMatch = "";
      let bestScore = 0;

      for (const diarizedText of diarizedData.texts) {
        const score = similarityScore(text, diarizedText);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = diarizedText;
        }
      }

      // Use the speaker if similarity is above threshold
      if (bestScore > 0.7 && bestMatch) {
        speaker = textToSpeaker.get(bestMatch) || "Unknown";
      }
    }

    segments.push({
      content: text,
      speaker,
      speakerId: undefined, // Will be resolved later
      startTime: srtData.startTimes[i],
      endTime: srtData.endTimes[i],
    });
  }

  return {
    segments,
    metadata,
  };
}

// Simple similarity score between two strings (0-1)
function similarityScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Check if one is a substring of the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Count matching words
  const words1 = new Set(s1.split(/\s+/).filter((w) => w.length > 3));
  const words2 = new Set(s2.split(/\s+/).filter((w) => w.length > 3));

  let matches = 0;
  for (const word of words1) {
    if (words2.has(word)) matches++;
  }

  const totalUniqueWords = new Set([...words1, ...words2]).size;
  return totalUniqueWords > 0 ? matches / totalUniqueWords : 0;
}
