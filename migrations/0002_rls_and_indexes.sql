-- ==============================================================================
-- Chronocause Database Migration 0002
-- Feature 3: Row Level Security (RLS) Policies & Database Indexes
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable and Force Row Level Security (RLS) on all 6 core tables
-- ------------------------------------------------------------------------------

ALTER TABLE researches ENABLE ROW LEVEL SECURITY;
ALTER TABLE researches FORCE ROW LEVEL SECURITY;

ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes FORCE ROW LEVEL SECURITY;

ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges FORCE ROW LEVEL SECURITY;

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources FORCE ROW LEVEL SECURITY;

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events FORCE ROW LEVEL SECURITY;

ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Drop any existing duplicate policies to ensure idempotency
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "researches_select_policy" ON researches;
DROP POLICY IF EXISTS "researches_insert_policy" ON researches;
DROP POLICY IF EXISTS "researches_update_policy" ON researches;
DROP POLICY IF EXISTS "researches_delete_policy" ON researches;

DROP POLICY IF EXISTS "nodes_select_policy" ON nodes;
DROP POLICY IF EXISTS "nodes_insert_policy" ON nodes;
DROP POLICY IF EXISTS "nodes_update_policy" ON nodes;
DROP POLICY IF EXISTS "nodes_delete_policy" ON nodes;

DROP POLICY IF EXISTS "edges_select_policy" ON edges;
DROP POLICY IF EXISTS "edges_insert_policy" ON edges;
DROP POLICY IF EXISTS "edges_update_policy" ON edges;
DROP POLICY IF EXISTS "edges_delete_policy" ON edges;

DROP POLICY IF EXISTS "sources_select_policy" ON sources;
DROP POLICY IF EXISTS "sources_insert_policy" ON sources;
DROP POLICY IF EXISTS "sources_update_policy" ON sources;
DROP POLICY IF EXISTS "sources_delete_policy" ON sources;

DROP POLICY IF EXISTS "timeline_events_select_policy" ON timeline_events;
DROP POLICY IF EXISTS "timeline_events_insert_policy" ON timeline_events;
DROP POLICY IF EXISTS "timeline_events_update_policy" ON timeline_events;
DROP POLICY IF EXISTS "timeline_events_delete_policy" ON timeline_events;

DROP POLICY IF EXISTS "telemetry_logs_select_policy" ON telemetry_logs;
DROP POLICY IF EXISTS "telemetry_logs_insert_policy" ON telemetry_logs;
DROP POLICY IF EXISTS "telemetry_logs_update_policy" ON telemetry_logs;
DROP POLICY IF EXISTS "telemetry_logs_delete_policy" ON telemetry_logs;

-- ------------------------------------------------------------------------------
-- 3. Granular RLS Policies for parent table: researches
-- Restricts access strictly to auth.uid() = user_id
-- ------------------------------------------------------------------------------

CREATE POLICY "researches_select_policy"
  ON researches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "researches_insert_policy"
  ON researches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "researches_update_policy"
  ON researches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "researches_delete_policy"
  ON researches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Granular RLS Policies for child tables
-- Child tables link via research_id to an investigation owned by auth.uid()
-- ------------------------------------------------------------------------------

-- Nodes
CREATE POLICY "nodes_select_policy"
  ON nodes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = nodes.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "nodes_insert_policy"
  ON nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = nodes.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "nodes_update_policy"
  ON nodes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = nodes.research_id
        AND researches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = nodes.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "nodes_delete_policy"
  ON nodes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = nodes.research_id
        AND researches.user_id = auth.uid()
    )
  );

-- Edges
CREATE POLICY "edges_select_policy"
  ON edges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = edges.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "edges_insert_policy"
  ON edges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = edges.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "edges_update_policy"
  ON edges
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = edges.research_id
        AND researches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = edges.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "edges_delete_policy"
  ON edges
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = edges.research_id
        AND researches.user_id = auth.uid()
    )
  );

-- Sources
CREATE POLICY "sources_select_policy"
  ON sources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = sources.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "sources_insert_policy"
  ON sources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = sources.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "sources_update_policy"
  ON sources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = sources.research_id
        AND researches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = sources.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "sources_delete_policy"
  ON sources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = sources.research_id
        AND researches.user_id = auth.uid()
    )
  );

-- Timeline Events
CREATE POLICY "timeline_events_select_policy"
  ON timeline_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = timeline_events.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "timeline_events_insert_policy"
  ON timeline_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = timeline_events.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "timeline_events_update_policy"
  ON timeline_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = timeline_events.research_id
        AND researches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = timeline_events.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "timeline_events_delete_policy"
  ON timeline_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = timeline_events.research_id
        AND researches.user_id = auth.uid()
    )
  );

-- Telemetry Logs
CREATE POLICY "telemetry_logs_select_policy"
  ON telemetry_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = telemetry_logs.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "telemetry_logs_insert_policy"
  ON telemetry_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = telemetry_logs.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "telemetry_logs_update_policy"
  ON telemetry_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = telemetry_logs.research_id
        AND researches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = telemetry_logs.research_id
        AND researches.user_id = auth.uid()
    )
  );

CREATE POLICY "telemetry_logs_delete_policy"
  ON telemetry_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM researches
      WHERE researches.id = telemetry_logs.research_id
        AND researches.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 5. Performance B-tree Indexes for foreign keys and query lookups
-- ------------------------------------------------------------------------------

-- Foreign key lookup indexes
CREATE INDEX IF NOT EXISTS idx_researches_user_id ON researches (user_id);
CREATE INDEX IF NOT EXISTS idx_nodes_research_id ON nodes (research_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_node_id ON nodes (parent_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_research_id ON edges (research_id);
CREATE INDEX IF NOT EXISTS idx_sources_research_id ON sources (research_id);
CREATE INDEX IF NOT EXISTS idx_sources_node_id ON sources (node_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_research_id ON timeline_events (research_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_research_id ON telemetry_logs (research_id);

-- Compound traversal and chronological sorting indexes
CREATE INDEX IF NOT EXISTS idx_edges_source_target ON edges (source_id, target_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_chrono ON timeline_events (research_id, parsed_timestamp);
