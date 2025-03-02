# Third-Party Services Setup Plan

## Required Services

### 1. Pinecone Vector Database
**Purpose**: Stores transcript embeddings for semantic search

**Setup Steps**:
1. Create a Pinecone account at [pinecone.io](https://www.pinecone.io/)
2. Create a new index with dimensions matching Claude's embedding model (typically 1536 or 3072 dimensions)
3. Select the "cosine" similarity metric for the index
4. Choose a cloud provider and region close to your primary user base
5. Save the API key and environment details for integration

**Configuration Notes**:
- Use namespaces to separate different podcasts if needed
- Consider the "starter" plan for this proof of concept, as it provides sufficient scale
- Set up index with appropriate dimension size based on embedding model

### 2. PostgreSQL Database
**Purpose**: Stores podcast metadata, episode information, and enables keyword search

**Setup Options**:
1. **Vercel Postgres**:
   - Connect through Vercel dashboard when deploying the Next.js app
   - Simplest integration with automatic environment variable configuration
   - Limited to 256MB in the hobby plan

2. **Supabase PostgreSQL**:
   - Create account at [supabase.com](https://supabase.com/)
   - Set up a new project and database
   - Provides additional features like authentication if needed later
   - 500MB in free tier

3. **Neon.tech**:
   - Serverless PostgreSQL option
   - Create account at [neon.tech](https://neon.tech/)
   - 3GB storage in free tier
   - Autoscaling capabilities

**Setup Steps** (for any provider):
1. Create database instance
2. Save connection string and credentials
3. Run the schema migration scripts to create required tables
4. Test connection from local development

### 3. Anthropic API (Claude 3.7 Sonnet)
**Purpose**: Powers query rewriting, reranking, and response generation

**Setup Steps**:
1. Create an Anthropic account at [anthropic.com](https://www.anthropic.com/)
2. Generate an API key for Claude 3.7 Sonnet access
3. Save the API key securely for integration
4. Determine your usage limits and set up billing

**Configuration Notes**:
- Consider implementing rate limiting based on Anthropic's quotas
- Implement prompt caching to reduce API costs
- Use environment variables to store API keys securely

### 4. Vercel (Deployment)
**Purpose**: Hosts the Next.js application

**Setup Steps**:
1. Create a Vercel account if you don't have one at [vercel.com](https://vercel.com/)
2. Connect your GitHub repository to Vercel
3. Configure environment variables for all API keys and connection strings
4. Set up the Vercel Postgres integration if using that option

### 5. File Storage for Audio Files (Optional)
**Purpose**: Stores podcast audio files for playback

**Options**:
1. **Vercel Blob Storage**:
   - Simple integration with Next.js
   - Setup through Vercel dashboard
   - 1GB storage in hobby tier

2. **Supabase Storage**:
   - If already using Supabase for PostgreSQL
   - 1GB included in free tier

3. **AWS S3** or **Google Cloud Storage**:
   - More scalable for larger files
   - Requires additional setup

**Setup Steps**:
1. Choose a storage solution
2. Create storage buckets/containers
3. Set up appropriate access policies
4. Save access credentials for integration

## Integration Timeline

1. **Day 1**: Create accounts and set up all third-party services
2. **Day 2**: Verify connections from local development environment
3. **Day 3**: Set up CI/CD with Vercel for automatic deployments
4. **Day 4**: Test end-to-end data flow with sample podcast

## Security Considerations

- Store all API keys and connection strings as environment variables
- Implement rate limiting to prevent API abuse
- For a production version, add authentication to admin interface
- Consider implementing CORS policies for API endpoints

## Cost Estimation (Monthly)

- **Pinecone**: Free tier for proof of concept (1 index, limited scale)
- **PostgreSQL**: Free tier with any provider mentioned
- **Anthropic API**: Pay-per-use, estimate ~$20-50 for development testing
- **Vercel**: Free hobby tier
- **Storage**: Free tier with any provider mentioned

Total estimated monthly cost: **$20-50** (primarily for Claude API usage)
