-- =============================================================================
-- LE VOIR BÉBÉ DE DANIEL — SUPABASE POSTGRESQL SCHEMA, RLS & STORAGE POLICIES
-- Migration: 001_initial_schema.sql
-- =============================================================================

-- Enable cryptographic functions for hashing family invite codes and tokens
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. TABLE: admin_users
-- Explicit allowlist of administrator accounts linked to Supabase Auth (auth.users).
-- Prevents free sign-up escalation: only listed UIDs have admin privileges.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own admin record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function to check if current authenticated user is a verified administrator
CREATE OR REPLACE FUNCTION public.is_event_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. TABLE: event_settings
-- Single-row configuration table storing album state, moderation preferences,
-- retention policy, and hashed family invitation code (never exposed publicly).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  gallery_open BOOLEAN NOT NULL DEFAULT FALSE,
  submissions_open BOOLEAN NOT NULL DEFAULT FALSE,
  submissions_close_at TIMESTAMPTZ NULL,
  require_family_code_for_gallery BOOLEAN NOT NULL DEFAULT FALSE,
  require_family_code_for_upload BOOLEAN NOT NULL DEFAULT TRUE,
  family_code_hash TEXT NULL,
  max_files_per_submission INTEGER NOT NULL DEFAULT 10 CHECK (max_files_per_submission BETWEEN 1 AND 30),
  max_file_size_mb INTEGER NOT NULL DEFAULT 10 CHECK (max_file_size_mb BETWEEN 1 AND 25),
  retention_days INTEGER NOT NULL DEFAULT 365 CHECK (retention_days >= 30),
  -- Optional dynamic event details configurable by parents from /admin
  parents_names TEXT[] NOT NULL DEFAULT '{}',
  event_start TIMESTAMPTZ NULL,
  event_end TIMESTAMPTZ NULL,
  time_zone TEXT NULL,
  venue_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  maps_url TEXT NOT NULL DEFAULT '',
  dress_code TEXT NOT NULL DEFAULT '',
  access_notes TEXT NOT NULL DEFAULT '',
  portrait_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can directly read or update the full event_settings row (which contains family_code_hash).
-- Public clients read sanitized public settings via the server API or get_public_event_settings() RPC.
CREATE POLICY "Admins can select event_settings"
  ON public.event_settings
  FOR SELECT
  TO authenticated
  USING (public.is_event_admin());

CREATE POLICY "Admins can update event_settings"
  ON public.event_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_event_admin())
  WITH CHECK (public.is_event_admin());

-- Insert default singleton row
INSERT INTO public.event_settings (id, gallery_open, submissions_open)
VALUES (1, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Safe public projection RPC (never returns family_code_hash)
CREATE OR REPLACE FUNCTION public.get_public_event_settings()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'galleryOpen', gallery_open,
    'submissionsOpen', submissions_open AND (submissions_close_at IS NULL OR submissions_close_at > NOW()),
    'submissionsCloseAt', submissions_close_at,
    'requireFamilyCodeForGallery', require_family_code_for_gallery,
    'requireFamilyCodeForUpload', require_family_code_for_upload,
    'maxFilesPerSubmission', max_files_per_submission,
    'maxFileSizeMb', max_file_size_mb,
    'retentionDays', retention_days,
    'parentsNames', parents_names,
    'eventStart', event_start,
    'eventEnd', event_end,
    'timeZone', time_zone,
    'venueName', venue_name,
    'address', address,
    'mapsUrl', maps_url,
    'dressCode', dress_code,
    'accessNotes', access_notes,
    'portraitUrl', portrait_url
  )
  FROM public.event_settings
  WHERE id = 1;
$$;

-- -----------------------------------------------------------------------------
-- 3. TABLE: photo_submissions
-- Private record of each guest upload batch. Never exposed to public visitors.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_name TEXT NOT NULL CHECK (char_length(trim(contributor_name)) BETWEEN 1 AND 80),
  display_name_consent BOOLEAN NOT NULL DEFAULT FALSE,
  publication_consent BOOLEAN NOT NULL DEFAULT TRUE CHECK (publication_consent = TRUE),
  rights_confirmation BOOLEAN NOT NULL DEFAULT TRUE CHECK (rights_confirmation = TRUE),
  default_caption TEXT NULL CHECK (default_caption IS NULL OR char_length(default_caption) <= 300),
  client_fingerprint_hash TEXT NULL,
  files_count INTEGER NOT NULL DEFAULT 1 CHECK (files_count BETWEEN 1 AND 30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.photo_submissions ENABLE ROW LEVEL SECURITY;

-- Strictly restricted to admins
CREATE POLICY "Admins can view photo_submissions"
  ON public.photo_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_event_admin());

CREATE POLICY "Admins can delete photo_submissions"
  ON public.photo_submissions
  FOR DELETE
  TO authenticated
  USING (public.is_event_admin());

-- -----------------------------------------------------------------------------
-- 4. TABLE: photos
-- Individual photo records linked to a submission.
-- Guests never query this table directly for pending/rejected items;
-- Approved photos are served via server endpoints generating short-lived signed URLs.
-- -----------------------------------------------------------------------------
CREATE TYPE public.photo_moderation_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.photo_submissions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  thumbnail_path TEXT NOT NULL UNIQUE,
  caption TEXT NULL CHECK (caption IS NULL OR char_length(caption) <= 300),
  contributor_name TEXT NULL CHECK (contributor_name IS NULL OR char_length(contributor_name) <= 80),
  display_name_consent BOOLEAN NOT NULL DEFAULT FALSE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
  width INTEGER NULL CHECK (width IS NULL OR (width > 0 AND width <= 12000)),
  height INTEGER NULL CHECK (height IS NULL OR (height > 0 AND height <= 12000)),
  sha256_hash TEXT NULL,
  exif_stripped BOOLEAN NOT NULL DEFAULT TRUE,
  status public.photo_moderation_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at TIMESTAMPTZ NULL,
  moderated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_status_submitted_at
  ON public.photos(status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_photos_sha256_hash
  ON public.photos(sha256_hash);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Only admins have direct table access. Public access goes through server verification + signed URLs.
CREATE POLICY "Admins have full read access to photos"
  ON public.photos
  FOR SELECT
  TO authenticated
  USING (public.is_event_admin());

CREATE POLICY "Admins can update photos (approve, reject, edit caption)"
  ON public.photos
  FOR UPDATE
  TO authenticated
  USING (public.is_event_admin())
  WITH CHECK (public.is_event_admin());

CREATE POLICY "Admins can delete photos"
  ON public.photos
  FOR DELETE
  TO authenticated
  USING (public.is_event_admin());

-- -----------------------------------------------------------------------------
-- 5. TABLE: upload_rate_limits
-- Tracks upload & code verification attempts by hashed IP to prevent brute-force & spam
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.upload_rate_limits (
  ip_hash TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('verify_code', 'upload_photo', 'admin_login')),
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', NOW()),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, action_type, window_start)
);

ALTER TABLE public.upload_rate_limits ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 6. PRIVATE STORAGE BUCKET & RLS POLICIES
-- Bucket: daniel-memories-private (public = false)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daniel-memories-private',
  'daniel-memories-private',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

CREATE POLICY "Admins can read all objects in daniel-memories-private"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'daniel-memories-private' AND public.is_event_admin());

CREATE POLICY "Admins can delete objects in daniel-memories-private"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'daniel-memories-private' AND public.is_event_admin());

-- -----------------------------------------------------------------------------
-- 7. MAINTENANCE FUNCTION: Cleanup orphan submissions or expired rejected photos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_orphan_submissions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.photo_submissions s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.photos p WHERE p.submission_id = s.id
    )
    AND s.created_at < NOW() - INTERVAL '1 hour'
    RETURNING s.id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;
