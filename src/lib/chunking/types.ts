// Define the structure of a transcript segment
export interface TranscriptSegment {
  content: string;
  speaker: string;
  speakerId?: number;
  startTime: number;
  endTime: number;
}

// Define the structure of a complete transcript
export interface Transcript {
  segments: TranscriptSegment[];
  metadata: {
    podcastId: number;
    episodeId: number;
    title: string;
    description?: string;
  };
}
