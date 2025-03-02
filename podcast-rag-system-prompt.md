# Podcast RAG System Development Prompt

## Project Overview

Create a Retrieval-Augmented Generation (RAG) proof of concept system using Next.js with TypeScript for querying podcast transcripts. The system will use hybrid search combining Pinecone vector database with PostgreSQL for keyword filtering, and implement LLM reranking for optimal results.

## Core Requirements

### Data Management
- Manual upload of JSON-formatted podcast transcripts with speaker labels, timestamps, and content
- Store transcript embeddings in Pinecone with diarized speaker information
- Store metadata (podcast name, episode titles, dates, episode links) and episode summaries in PostgreSQL
- Support uploading audio files that correspond with transcript timestamps

### Search & Retrieval
- Implement hybrid search using both Pinecone (semantic) and PostgreSQL (keyword)
- Use two-level chunking: sentence-level chunks with cross-section chunking for context
- Rerank search results using a secondary LLM pass for improved relevance
- Retrieve a larger initial set (30-50 chunks) for comprehensive coverage

### Query Processing
- Use LLM query rewriting to improve retrieval effectiveness
- Maintain conversation context from previous 10 questions
- Implement prompt caching when possible for cost efficiency with Claude 3.7 Sonnet

### Response Generation
- Format responses with concise bullet points followed by 1-2 explanatory paragraphs
- Show multiple viewpoints and indicate consensus vs. minority positions
- Use numbered inline citations that reference full citations below the response
- Include speaker information and episode title in citations with links to episode URL

### User Interface
- Allow filtering by podcast (and optionally by specific episodes within podcasts)
- Implement a media player that supports timestamp-based navigation to specific citations
- Display transcript text during audio playback
- Clean, minimalist design focused on content discovery

### Admin Interface
- Simple CRUD operations for podcast and episode management
- Support for complete deletion and re-uploading of episodes/transcripts when needed
- No authentication required for this proof of concept

## Technical Implementation Details

### Database Schema

**PostgreSQL Tables:**
```
podcasts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT
)

episodes (
  id SERIAL PRIMARY KEY,
  podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  published_date DATE,
  url TEXT,
  audio_file_path TEXT
)

speakers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT
)

episode_speakers (
  episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
  PRIMARY KEY (episode_id, speaker_id)
)
```

### Chunking & Embedding Strategy
- Create sentence-level chunks from transcript
- Generate overlapping cross-section chunks to maintain broader context
- Attach metadata to each chunk: speaker, timestamp, episode_id
- Use Claude 3.7 Sonnet compatible embeddings

### Retrieval Process
1. User selects podcasts to query from
2. LLM rewrites user query for optimal retrieval
3. Perform hybrid search: semantic via Pinecone + keyword filtering via PostgreSQL
4. Fetch top 30-50 chunks
5. Use Claude to rerank results based on relevance to query
6. Generate comprehensive response with citations

### Response Structure
- Bulleted list of key points with citation numbers
- 1-2 paragraph detailed explanation
- Presentation of multiple viewpoints when available
- Numbered citations below with speaker, episode title, and links

### Audio Integration
- Store audio files with ability to play specific segments
- Support SRT format for synchronized transcript display
- Allow jumping to specific timestamp from citations

## Technology Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Databases**: 
  - Pinecone for vector embeddings
  - PostgreSQL for metadata and keyword search
- **LLM**: Claude 3.7 Sonnet for query processing, reranking, and response generation
- **Deployment**: Vercel

## Architecture

```
/app
  /api
    /podcasts
    /episodes
    /query
    /chat
  /components
    /Admin
    /Chat
    /AudioPlayer
    /PodcastSelection
  /lib
    /database
    /embeddings
    /pinecone
    /claude
    /chunking
  /pages
    /admin
    /chat
  /public
    /audio
```

## Prioritized Development Roadmap

1. Set up project structure and database connections
2. Implement transcript processing pipeline (chunking & embedding)
3. Create basic query capabilities with hybrid search
4. Develop chat interface with citation display
5. Add audio playback functionality
6. Implement admin interface for podcast management
7. Integrate Claude 3.7 Sonnet for response generation
8. Add conversation history support
9. Test and optimize retrieval accuracy
