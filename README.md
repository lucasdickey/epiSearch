# Podcast Episode Answer Bot

A Retrieval-Augmented Generation (RAG) system for querying podcast transcripts using Next.js, TypeScript, Pinecone, PostgreSQL, and Claude 3.7 Sonnet.

## Features

- **Podcast Management**: Create, read, update, and delete podcasts and episodes
- **Transcript Processing**: Upload and process JSON-formatted podcast transcripts
- **Semantic Search**: Query podcast transcripts using natural language
- **Audio Playback**: Listen to specific segments of podcast episodes
- **Admin Interface**: Manage podcasts, episodes, and transcripts
- **Chat Interface**: Ask questions about podcast content and receive answers with citations

## Tech Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Databases**:
  - Pinecone for vector embeddings
  - PostgreSQL for metadata and keyword search
- **LLM**: Claude 3.7 Sonnet for query processing, reranking, and response generation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Pinecone account and index
- Anthropic API key for Claude 3.7 Sonnet

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/podcast_rag

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
PINECONE_INDEX=your-pinecone-index

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/podcast-rag.git
cd podcast-rag
```

2. Install dependencies:

```bash
npm install
```

3. Initialize the database:

```bash
npm run init-db
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Admin Interface

1. Navigate to [http://localhost:3000/admin](http://localhost:3000/admin)
2. Create a podcast by providing a name, description, and URL
3. Create episodes for the podcast with title, description, and other metadata
4. Upload JSON-formatted transcripts for episodes

### Chat Interface

1. Navigate to [http://localhost:3000/chat](http://localhost:3000/chat)
2. Select one or more podcasts to query
3. Ask questions about the podcast content
4. View answers with citations and links to audio segments

## Transcript Format

Transcripts should be uploaded in the following JSON format:

```json
{
  "segments": [
    {
      "text": "Hello and welcome to the podcast.",
      "speaker": "Host",
      "speakerId": 1,
      "start": 0.0,
      "end": 3.5
    },
    {
      "text": "Thanks for having me.",
      "speaker": "Guest",
      "speakerId": 2,
      "start": 3.6,
      "end": 5.2
    }
  ]
}
```

## API Endpoints

### Podcasts

- `GET /api/podcasts` - Get all podcasts
- `POST /api/podcasts` - Create a new podcast
- `GET /api/podcasts/:id` - Get a podcast by ID
- `PUT /api/podcasts/:id` - Update a podcast
- `DELETE /api/podcasts/:id` - Delete a podcast

### Episodes

- `GET /api/episodes` - Get all episodes (optionally filtered by podcast_id)
- `POST /api/episodes` - Create a new episode
- `GET /api/episodes/:id` - Get an episode by ID
- `PUT /api/episodes/:id` - Update an episode
- `DELETE /api/episodes/:id` - Delete an episode

### Transcripts

- `POST /api/transcripts/upload` - Upload and process a transcript

### Query

- `POST /api/query` - Query podcast transcripts

### Audio

- `GET /api/audio/:id` - Get audio for an episode (with optional timestamp)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Pinecone](https://www.pinecone.io/)
- [Anthropic Claude](https://www.anthropic.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Tailwind CSS](https://tailwindcss.com/)
