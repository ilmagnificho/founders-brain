-- ============================================================
-- FoundersBrain Knowledge Base Schema
-- Migration: 001_knowledge_base.sql
-- 
-- This schema is designed to be source-agnostic.
-- While initially used for YC Startup School content,
-- it can accommodate any video/text source (a16z, Sequoia, etc.)
-- ============================================================

-- Enable the pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Main knowledge_base table
-- Stores chunked content with embeddings for RAG retrieval
-- ============================================================
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content and embedding
  content TEXT NOT NULL,                    -- The actual text chunk
  embedding VECTOR(768),                    -- Gemini text-embedding-004 uses 768 dimensions
  
  -- Source identification (generic, not YC-specific)
  source_origin TEXT NOT NULL,              -- e.g., 'yc_startup_school', 'a16z_podcast', 'sequoia_arc'
  source_type TEXT NOT NULL DEFAULT 'youtube', -- 'youtube', 'podcast', 'article', 'pdf'
  
  -- Video/audio specific fields
  video_id TEXT,                            -- YouTube video ID or podcast episode ID
  video_title TEXT,                         -- Human-readable title
  video_url TEXT,                           -- Full URL for reference
  
  -- Timestamp fields for precise linking
  start_time FLOAT NOT NULL DEFAULT 0,      -- Start time in seconds
  end_time FLOAT,                           -- End time in seconds (nullable)
  duration FLOAT,                           -- Duration of this chunk in seconds
  
  -- Chunk metadata
  chunk_index INTEGER NOT NULL DEFAULT 0,   -- Order within the source
  total_chunks INTEGER,                     -- Total chunks from this source
  
  -- Flexible metadata (for source-specific data)
  metadata JSONB DEFAULT '{}',              -- Speaker info, topics, language, etc.
  
  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================

-- Vector similarity search index (IVFFlat for approximate nearest neighbor)
-- Adjust 'lists' parameter based on data size (sqrt(n) is a good starting point)
CREATE INDEX idx_knowledge_base_embedding 
  ON knowledge_base 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Indexes for filtering queries
CREATE INDEX idx_knowledge_base_source_origin ON knowledge_base (source_origin);
CREATE INDEX idx_knowledge_base_source_type ON knowledge_base (source_type);
CREATE INDEX idx_knowledge_base_video_id ON knowledge_base (video_id);

-- Composite index for common query patterns
CREATE INDEX idx_knowledge_base_source_video 
  ON knowledge_base (source_origin, video_id);

-- ============================================================
-- Function to update 'updated_at' timestamp automatically
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC function for similarity search
-- ============================================================
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_origin TEXT,
  video_id TEXT,
  video_title TEXT,
  start_time FLOAT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.source_origin,
    kb.video_id,
    kb.video_title,
    kb.start_time,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE 
    (filter_source IS NULL OR kb.source_origin = filter_source)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON TABLE knowledge_base IS 'Stores chunked content with vector embeddings for RAG-based retrieval. Source-agnostic design supports multiple content sources.';
COMMENT ON COLUMN knowledge_base.source_origin IS 'Identifier for the content source (e.g., yc_startup_school, a16z_podcast)';
COMMENT ON COLUMN knowledge_base.start_time IS 'Start timestamp in seconds for video/audio linking';
COMMENT ON COLUMN knowledge_base.metadata IS 'Flexible JSONB for source-specific metadata like speaker, language, topics';
