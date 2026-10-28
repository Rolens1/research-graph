-- 0001_init_schema.sql
-- Chronocause Relational Database Schema Initialization

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Researches (Root investigation sessions)
CREATE TABLE IF NOT EXISTS researches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  confidence_score INT NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  final_synthesis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 2. Nodes (Entities identified on the knowledge canvas)
CREATE TABLE IF NOT EXISTS nodes (
  id VARCHAR(128) PRIMARY KEY,
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  entity_type VARCHAR(32) NOT NULL CHECK (entity_type IN ('actor', 'event', 'technology', 'decision', 'dispute')),
  summary TEXT NOT NULL,
  confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  depth_level INT NOT NULL DEFAULT 0 CHECK (depth_level >= 0),
  parent_node_id VARCHAR(128) REFERENCES nodes(id) ON DELETE SET NULL,
  is_user_added BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Edges (Causal relationships between nodes)
CREATE TABLE IF NOT EXISTS edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  source_id VARCHAR(128) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_id VARCHAR(128) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  relation_type VARCHAR(32) NOT NULL CHECK (relation_type IN ('causes', 'blocks', 'finances', 'contradicts', 'leads_to')),
  label TEXT NOT NULL,
  is_disputed BOOLEAN NOT NULL DEFAULT false,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Sources (Primary web extracts and citations)
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  node_id VARCHAR(128) REFERENCES nodes(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  published_date TEXT,
  verbatim_snippet TEXT NOT NULL,
  credibility_score INT NOT NULL DEFAULT 80 CHECK (credibility_score >= 0 AND credibility_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Timeline Events (Chronological milestones)
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  node_id VARCHAR(128) REFERENCES nodes(id) ON DELETE SET NULL,
  event_date TEXT NOT NULL,
  parsed_timestamp BIGINT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Telemetry Logs (Live agent reasoning and activity stream)
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  agent_name VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
