// Define transcript segment interface
export interface TranscriptSegment {
  content: string;
  speaker: string;
  speakerId?: number;
  startTime: number;
  endTime: number;
}

// Define transcript interface
export interface Transcript {
  segments: TranscriptSegment[];
  metadata: {
    podcastId: number;
    episodeId: number;
    title: string;
    description?: string;
  };
}
