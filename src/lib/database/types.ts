export interface Podcast {
  id: number;
  name: string;
  description?: string;
  url?: string;
}

export interface Episode {
  id: number;
  podcast_id: number;
  title: string;
  description?: string;
  summary?: string;
  published_date?: Date;
  url?: string;
  audio_file_path?: string;
}

export interface Speaker {
  id: number;
  name: string;
  bio?: string;
}

export interface EpisodeSpeaker {
  episode_id: number;
  speaker_id: number;
}

export interface TranscriptChunk {
  id: string;
  episode_id: number;
  content: string;
  speaker_id?: number;
  start_time: number;
  end_time: number;
  embedding_id?: string;
}

export interface SearchResult {
  chunk: TranscriptChunk;
  score: number;
  episode: Episode;
  podcast: Podcast;
  speaker?: Speaker;
}

export interface Citation {
  id: string;
  chunk_id: string;
  episode_id: number;
  podcast_id: number;
  speaker_id?: number;
  start_time: number;
  end_time: number;
  content: string;
  episode_title: string;
  podcast_name: string;
  speaker_name?: string;
  url?: string;
  audio_url?: string;
}

export interface QueryResponse {
  answer: string;
  citations: Citation[];
}
