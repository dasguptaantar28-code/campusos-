-- ==============================================================================
-- CampusOS Migration 0001: Extensions, App Schema & Timestamp Helpers
-- ==============================================================================

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

CREATE SCHEMA IF NOT EXISTS app;

-- Keep updated_at consistent on every row modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Helper for safe slug normalization
CREATE OR REPLACE FUNCTION app.normalize_slug(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' FROM regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;
