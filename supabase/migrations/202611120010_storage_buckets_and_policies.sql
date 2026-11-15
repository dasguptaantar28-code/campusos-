-- ==============================================================================
-- CampusOS Migration 0010: Protected Supabase Storage Buckets & Tenant Policies
-- Folder convention: <tenant_id>/<entity>/<filename>
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      ('institution-logos', 'institution-logos', FALSE, 5242880, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']),
      ('student-photos', 'student-photos', FALSE, 5242880, ARRAY['image/png','image/jpeg','image/webp']),
      ('employee-documents', 'employee-documents', FALSE, 15728640, ARRAY['application/pdf','image/png','image/jpeg']),
      ('learning-materials', 'learning-materials', FALSE, 31457280, ARRAY['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
      ('assignment-submissions', 'assignment-submissions', FALSE, 20971520, ARRAY['application/pdf','image/png','image/jpeg','application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    ON CONFLICT (id) DO NOTHING;

    -- Read access strictly scoped by first folder segment = tenant_id
    DROP POLICY IF EXISTS "campusos_storage_tenant_read" ON storage.objects;
    CREATE POLICY "campusos_storage_tenant_read" ON storage.objects
      FOR SELECT USING (
        bucket_id IN ('institution-logos','student-photos','employee-documents','learning-materials','assignment-submissions')
        AND (
          app.is_platform_admin()
          OR app.has_tenant_membership(((storage.foldername(name))[1])::UUID)
        )
      );

    -- Write access strictly scoped by tenant membership & role
    DROP POLICY IF EXISTS "campusos_storage_tenant_write" ON storage.objects;
    CREATE POLICY "campusos_storage_tenant_write" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id IN ('institution-logos','student-photos','employee-documents','learning-materials','assignment-submissions')
        AND (
          app.is_platform_admin()
          OR (
            bucket_id = 'assignment-submissions'
            AND app.has_tenant_membership(((storage.foldername(name))[1])::UUID)
          )
          OR app.has_tenant_role(((storage.foldername(name))[1])::UUID, ARRAY['school_admin','teacher','staff'])
        )
      );

    DROP POLICY IF EXISTS "campusos_storage_tenant_delete" ON storage.objects;
    CREATE POLICY "campusos_storage_tenant_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id IN ('institution-logos','student-photos','employee-documents','learning-materials','assignment-submissions')
        AND (
          app.is_platform_admin()
          OR app.has_tenant_role(((storage.foldername(name))[1])::UUID, ARRAY['school_admin'])
        )
      );
  END IF;
END;
$$;
