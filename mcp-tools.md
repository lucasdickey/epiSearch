# MCP and Tool Use Recommendations

## Recommended Multi-Chain-of-Thought Prompting (MCP) Techniques

### 1. Context-Aware Retrieval MCP
**Purpose**: Improve the relevance of retrieved chunks by having the LLM consider multiple aspects of the query.

**Implementation**:
```typescript
const contextAwareRetrievalPrompt = `
You are analyzing a user query to improve podcast transcript retrieval.
Chain 1: What are the explicit topics and keywords in this query?
Chain 2: What are implicit topics that might be related but not directly mentioned?
Chain 3: What speaker expertise would be most relevant to answering this query?
Chain 4: What type of information would constitute a complete answer to this query?

User Query: {query}

Analyze each chain of thought, then produce:
1. An expanded query for semantic search
2. Key terms for keyword filtering
3. A list of relevant metadata filters
`;
```

### 2. Multi-Perspective Response Synthesis MCP
**Purpose**: Generate balanced responses that consider different viewpoints from podcast transcripts.

**Implementation**:
```typescript
const multiPerspectivePrompt = `
You are synthesizing information from podcast transcripts to answer a user query.
Chain 1: What are the main consensus viewpoints across these transcript chunks?
Chain 2: What are notable minority or alternative viewpoints?
Chain 3: What contextual information is needed to fully understand these perspectives?
Chain 4: What are potential limitations or caveats to consider?

User Query: {query}
Transcript Chunks: {chunks}

Based on these chains of thought, create:
1. A bulleted list of key points with balanced representation
2. A synthesis paragraph that presents multiple perspectives
3. Appropriate citations for each viewpoint
`;
```

### 3. Citation Relevance MCP
**Purpose**: Evaluate and select the most informative and authoritative citations.

**Implementation**:
```typescript
const citationRelevancePrompt = `
You are evaluating potential citations from podcast transcripts.
Chain 1: How directly does this excerpt answer the user's question?
Chain 2: How authoritative is the speaker on this specific topic?
Chain 3: How recent and still-relevant is this information?
Chain 4: How well does this citation complement other selected citations?

User Query: {query}
Potential Citations: {citations}

Based on these considerations, rank the citations by overall relevance and select the top ones that provide:
1. The most directly relevant information
2. A balance of perspectives when applicable
3. The most current and accurate information
`;
```

## Recommended Tool Use Implementations

### 1. Transcript Processing Pipeline Tool
**Purpose**: Automate the chunking, embedding, and storage of podcast transcripts.

**Implementation**:
```typescript
// lib/tools/transcriptProcessor.ts
import { createChunks, generateEmbeddings, storeToPinecone, storeToPostgres } from '../utils';

export async function processTranscript(
  transcriptJSON: any, 
  podcastId: string, 
  episodeId: string
) {
  // 1. Extract transcript text, speaker information, and timestamps
  const { transcript, metadata } = parseTranscriptJSON(transcriptJSON);
  
  // 2. Create sentence-level and cross-section chunks
  const sentenceChunks = createChunks(transcript, 'sentence');
  const crossSectionChunks = createChunks(transcript, 'cross-section');
  const finalChunks = [...sentenceChunks, ...crossSectionChunks];
  
  // 3. Generate embeddings for all chunks
  const embeddedChunks = await generateEmbeddings(finalChunks);
  
  // 4. Store embeddings in Pinecone
  await storeToPinecone(embeddedChunks, podcastId, episodeId);
  
  // 5. Store metadata in PostgreSQL
  await storeToPostgres(metadata, podcastId, episodeId);
  
  return {
    chunkCount: finalChunks.length,
    success: true
  };
}
```

### 2. Hybrid Search Orchestrator Tool
**Purpose**: Coordinate semantic and keyword search processes for optimal retrieval.

**Implementation**:
```typescript
// lib/tools/hybridSearch.ts
import { searchPinecone, searchPostgres, rerank } from '../utils';

export async function hybridSearch(
  query: string,
  podcastIds: string[],
  limit: number = 50
) {
  // 1. Rewrite query for better retrieval
  const enhancedQuery = await rewriteQuery(query);
  
  // 2. Extract keywords for filtering
  const keywords = extractKeywords(enhancedQuery);
  
  // 3. Perform semantic search in Pinecone
  const semanticResults = await searchPinecone(enhancedQuery, podcastIds, limit);
  
  // 4. Perform keyword search in PostgreSQL
  const keywordResults = await searchPostgres(keywords, podcastIds, limit);
  
  // 5. Combine and deduplicate results
  const combinedResults = mergeAndDeduplicate(semanticResults, keywordResults);
  
  // 6. Rerank results using Claude
  const rerankedResults = await rerank(combinedResults, query);
  
  return rerankedResults.slice(0, limit);
}
```

### 3. Response Generator Tool
**Purpose**: Create well-structured responses with citations based on retrieved chunks.

**Implementation**:
```typescript
// lib/tools/responseGenerator.ts
import { callClaude } from '../utils';

export async function generateResponse(
  query: string,
  chunks: any[],
  conversationHistory: any[]
) {
  // 1. Prepare chunks for context
  const contextText = prepareContextFromChunks(chunks);
  
  // 2. Format conversation history
  const historyText = formatConversationHistory(conversationHistory);
  
  // 3. Generate response using Claude with MCP
  const prompt = `
    You are answering questions about podcasts based on transcript chunks.
    
    User Query: ${query}
    
    Conversation History:
    ${historyText}
    
    Relevant Transcript Chunks:
    ${contextText}
    
    Generate a response that:
    1. Provides a bulleted list of key points with citation numbers
    2. Follows with 1-2 paragraphs expanding on these points
    3. Shows multiple viewpoints when present, indicating consensus vs minority positions
    4. Includes numbered citations at the end with speaker and episode title
    
    Your response should be well-structured, informative, and directly address the query.
  `;
  
  const response = await callClaude(prompt);
  
  // 4. Extract and format citations
  const formattedResponse = formatResponseWithCitations(response, chunks);
  
  return formattedResponse;
}
```

### 4. Audio Synchronization Tool
**Purpose**: Allow precise navigation to specific timestamps in podcast audio.

**Implementation**:
```typescript
// lib/tools/audioSync.ts
export function createAudioTimestampLinks(
  citations: any[],
  episodeData: any[]
) {
  return citations.map(citation => {
    const episode = episodeData.find(ep => ep.id === citation.episodeId);
    
    if (!episode || !episode.audioFilePath) {
      return citation;
    }
    
    // Create audio player URL with timestamp
    const audioUrl = `/player/${episode.id}?t=${citation.timestamp}`;
    
    return {
      ...citation,
      audioUrl,
      hasAudio: true
    };
  });
}

export function generateSRTSegment(transcript: any, timestamp: number) {
  // Find the transcript segments that correspond to the timestamp
  const relevantSegments = transcript.filter(segment => 
    segment.startTime <= timestamp && segment.endTime >= timestamp
  );
  
  // Format segments as SRT for display during playback
  return formatSRTSegments(relevantSegments);
}
```

## Integration Considerations

1. **Modular Architecture**: Implement these tools as standalone modules that can be composed together.

2. **API Endpoints**: Create dedicated API routes for each tool functionality:
   - `/api/process-transcript` - Upload and process transcripts
   - `/api/search` - Perform hybrid search
   - `/api/generate-response` - Generate responses with citations
   - `/api/audio-sync` - Get audio playback information

3. **Graceful Degradation**: Ensure the system works even if certain components fail:
   - Fall back to keyword search if semantic search fails
   - Provide text-only responses if audio synchronization isn't available

4. **Monitoring and Feedback**: Implement simple analytics to track:
   - Query success rates
   - Citation clickthrough rates
   - Audio playback engagement

## Future Extensions

1. **Specialized MCP for Different Query Types**:
   - Factual queries vs. opinion-seeking queries
   - Comparison queries vs. explanation queries

2. **Interactive Exploration Tools**:
   - Allow users to explore related topics based on transcript analysis
   - Enable "drill-down" into specific viewpoints or themes

3. **Multi-Modal Retrieval**:
   - Extend the system to retrieve both transcript text and audio segments
   - Implement audio feature extraction for better audio segment retrieval
