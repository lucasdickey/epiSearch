import { TranscriptSegment, Transcript } from "./types";

// Parse SRT timestamp format (00:00:00,000) to seconds
function parseTimestamp(timestamp: string): number {
  try {
    const [hours, minutes, secondsMillis] = timestamp.split(":");
    if (!hours || !minutes || !secondsMillis) {
      console.warn(`Invalid timestamp format: ${timestamp}`);
      return 0;
    }

    const [seconds, milliseconds] = secondsMillis.split(",");
    if (!seconds || !milliseconds) {
      console.warn(`Invalid seconds/milliseconds format: ${secondsMillis}`);
      return 0;
    }

    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      parseInt(milliseconds) / 1000
    );
  } catch (error) {
    console.error(`Error parsing timestamp ${timestamp}:`, error);
    return 0;
  }
}

// Parse SRT file content
export function parseSRT(content: string): {
  startTimes: number[];
  endTimes: number[];
  texts: string[];
} {
  if (!content || typeof content !== "string") {
    console.error(`Invalid SRT content: ${typeof content}`);
    return { startTimes: [], endTimes: [], texts: [] };
  }

  try {
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
      if (timestamps.length !== 2) {
        console.warn(`Invalid timestamp line: ${timestampLine}`);
        continue;
      }

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

      // Only add valid entries
      if (textContent && startTime >= 0 && endTime > startTime) {
        startTimes.push(startTime);
        endTimes.push(endTime);
        texts.push(textContent);
      }
    }

    if (startTimes.length === 0) {
      console.warn("No valid entries found in SRT content");
    }

    return { startTimes, endTimes, texts };
  } catch (error) {
    console.error("Error parsing SRT content:", error);
    return { startTimes: [], endTimes: [], texts: [] };
  }
}

// Parse diarized text with speaker information
export function parseDiarizedText(content: string): {
  speakers: string[];
  texts: string[];
} {
  if (!content || typeof content !== "string") {
    console.error(`Invalid diarized text content: ${typeof content}`);
    return { speakers: [], texts: [] };
  }

  try {
    const lines = content.trim().split("\n");
    const speakers: string[] = [];
    const texts: string[] = [];

    for (const line of lines) {
      if (line.trim() === "") continue;

      // Match pattern: "Speaker Name: Text content"
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match && match[2].trim()) {
        speakers.push(match[1].trim() || "Unknown");
        texts.push(match[2].trim());
      } else {
        console.warn(`Skipping invalid diarized line: ${line}`);
      }
    }

    if (speakers.length === 0) {
      console.warn("No valid entries found in diarized text content");
    }

    return { speakers, texts };
  } catch (error) {
    console.error("Error parsing diarized text:", error);
    return { speakers: [], texts: [] };
  }
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
  if (!srtData || !diarizedData || !metadata) {
    console.error("Missing required data for combining transcripts");
    return { segments: [], metadata: { ...metadata } };
  }

  if (!srtData.texts || srtData.texts.length === 0) {
    console.error("No SRT text segments to process");
    return { segments: [], metadata: { ...metadata } };
  }

  try {
    // Create a mapping between text content to match SRT with diarized text
    const segments: TranscriptSegment[] = [];

    // First, try to match exact text content
    const textToSpeaker = new Map<string, string>();
    for (let i = 0; i < diarizedData.texts.length; i++) {
      if (diarizedData.texts[i]) {
        textToSpeaker.set(
          diarizedData.texts[i],
          diarizedData.speakers[i] || "Unknown"
        );
      }
    }

    // Create segments from SRT data
    for (let i = 0; i < srtData.texts.length; i++) {
      const text = srtData.texts[i];
      if (!text) continue;

      let speaker = textToSpeaker.get(text) || "Unknown";

      // If exact match fails, try fuzzy matching
      if (speaker === "Unknown" && diarizedData.texts.length > 0) {
        // Find the most similar text in diarized data
        let bestMatch = "";
        let bestScore = 0;

        for (const diarizedText of diarizedData.texts) {
          if (!diarizedText) continue;

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
        startTime: srtData.startTimes[i] || 0,
        endTime: srtData.endTimes[i] || 0,
      });
    }

    if (segments.length === 0) {
      console.warn("No segments created when combining transcripts");
    }

    return {
      segments,
      metadata: { ...metadata },
    };
  } catch (error) {
    console.error("Error combining transcripts:", error);
    return { segments: [], metadata: { ...metadata } };
  }
}

// Simple similarity score between two strings (0-1)
function similarityScore(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  try {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Check if one is a substring of the other
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.9;
    }

    // Count matching words
    const words1 = new Set(s1.split(/\s+/).filter((w) => w && w.length > 3));
    const words2 = new Set(s2.split(/\s+/).filter((w) => w && w.length > 3));

    if (words1.size === 0 || words2.size === 0) return 0;

    let matches = 0;
    for (const word of words1) {
      if (words2.has(word)) matches++;
    }

    const totalUniqueWords = new Set([...words1, ...words2]).size;
    return totalUniqueWords > 0 ? matches / totalUniqueWords : 0;
  } catch (error) {
    console.error("Error calculating similarity score:", error);
    return 0;
  }
}
