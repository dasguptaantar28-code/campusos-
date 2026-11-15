# CampusOS — PostgreSQL Database Plan

## 1. Conventions & Standards

- **Primary Keys:** `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Tenant Association:** Every tenant-scoped table includes `tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT` and composite indexes starting with `(tenant_id, ...)`.
- **Timestamps & Soft Deletion:** `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` (maintained by trigger), and `deleted_at TIMESTAMPTZ NULL` on core domain entities.
- **Row Level Security:** Enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) on **all** application tables. No permissive `USING (true)` policies on private tables.

---

## 2. Schema Domains & Table Inventory

### A. Platform & SaaS Tables (`202611120002_platform_and_saas.sql`)
1. `tenants` — Institution registry (`id`, `name`, `slug`, `code`, `institution_type`, `logo_url`, `email`, `phone`, `address`, `branding_json`, `status` [`pending`, `active`, `suspended`, `deactivated`], `subscription_plan_id`, `approved_at`, `approved_by`, `suspended_reason`, `deleted_at`)
2. `tenant_domains` — Custom subdomains/domains per tenant (`tenant_id`, `domain`, `is_primary`, `verified_at`)
3. `platform_admins` — Global SaaS Super Admins (`user_id`, `role_level`, `is_active`, `granted_by`)
4. `subscription_plans` — Configurable plans (`FREE`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`: `max_students`, `max_teachers`, `max_staff`, `max_storage_mb`, `max_admin_accounts`, `allowed_modules`, `reports_tier`, `support_level`, `monthly_price_cents`, `annual_price_cents`, `is_active`)
5. `subscriptions` — Active tenant subscription lifecycle (`tenant_id`, `plan_id`, `status` [`trial`, `active`, `past_due`, `grace_period`, `suspended`, `cancelled`, `expired`], `billing_cycle`, `current_period_start`, `current_period_end`, `grace_period_ends_at`, `auto_renew`)
6. `invoices` — SaaS subscription billing invoices (`tenant_id`, `subscription_id`, `invoice_number`, `amount_cents`, `currency`, `status`, `due_date`, `paid_at`)
7. `payments` — SaaS platform subscription payment records (`tenant_id`, `invoice_id`, `provider`, `provider_payment_id`, `amount_cents`, `currency`, `status`, `verified_webhook_payload`, `paid_at`)
8. `platform_settings` — Global key-value settings (`key`, `value_json`, `is_public`, `description`)
9. `global_features` — Global feature flags & rollout rules (`feature_key`, `name`, `is_enabled`, `rollout_rules`)
10. `global_config` — Global platform config (`maintenance_mode`, `maintenance_message`, `default_theme`, `brand_name`, `tagline`, `min_supported_app_version`, `active_version_number`)

### B. Identity & RBAC Tables (`202611120003_identity_and_rbac.sql`)
11. `profiles` — Mirrors `auth.users` (`id`, `email`, `full_name`, `phone`, `avatar_url`, `default_tenant_id`, `is_active`, `deleted_at`)
12. `roles` — Canonical & custom roles (`super_admin`, `school_admin`, `teacher`, `student`, `parent`, `accountant`, `staff`; optional `tenant_id` for custom roles)
13. `permissions` — Granular capability keys (`students.read`, `students.write`, `attendance.mark`, `results.approve`, `fees.collect`, `remote_config.manage`, etc.)
14. `role_permissions` — Role-to-permission mapping (`role_id`, `permission_id`)
15. `tenant_memberships` — Verified user-to-tenant memberships (`tenant_id`, `user_id`, `role_id`, `status` [`pending`, `active`, `suspended`, `revoked`], `is_primary`, `invited_by`, `joined_at`, `deleted_at`)
16. `user_roles` — Explicit supplemental role grants per user & tenant (`tenant_id`, `user_id`, `role_id`, `granted_by`)

### C. Academic Core Tables (`202611120004_academic_core.sql`)
17. `academic_sessions` — Academic years/terms (`tenant_id`, `name`, `start_date`, `end_date`, `is_current`)
18. `classes` — Grade/Class definitions (`tenant_id`, `name`, `code`, `numeric_level`, `capacity`)
19. `sections` — Class divisions (`tenant_id`, `class_id`, `name`, `room_number`, `class_teacher_id`)
20. `subjects` — Course catalog (`tenant_id`, `name`, `code`, `subject_type`, `default_max_marks`, `default_pass_marks`)
21. `students` — Student master records (`tenant_id`, `user_id`, `student_code`, `admission_number`, `first_name`, `last_name`, `date_of_birth`, `gender`, `blood_group`, `photo_url`, `session_id`, `class_id`, `section_id`, `roll_number`, `admission_date`, `status` [`applicant`, `active`, `promoted`, `transferred`, `graduated`, `withdrawn`], `emergency_contact_name`, `emergency_contact_phone`, `address`, `transfer_certificate_no`, `deleted_at`)
22. `student_guardians` — Explicit Parent-to-Student link (`tenant_id`, `student_id`, `guardian_user_id`, `guardian_name`, `relationship`, `phone`, `email`, `is_primary`, `can_pickup`)
23. `teachers` — Faculty profiles (`tenant_id`, `user_id`, `employee_code`, `full_name`, `department`, `designation`, `qualification`, `joining_date`, `phone`, `email`, `base_salary_cents`, `status`, `deleted_at`)
24. `staff` — Non-teaching staff profiles (`tenant_id`, `user_id`, `employee_code`, `full_name`, `department`, `designation`, `joining_date`, `phone`, `email`, `base_salary_cents`, `status`, `deleted_at`)
25. `class_subjects` — Teacher assignments to Class/Section/Subject (`tenant_id`, `session_id`, `class_id`, `section_id`, `subject_id`, `teacher_id`)

### D. Academic Operations Tables (`202611120005_academic_operations.sql`)
26. `attendance` — Daily student attendance (`tenant_id`, `session_id`, `student_id`, `class_id`, `section_id`, `attendance_date`, `status` [`present`, `absent`, `late`, `excused`], `marked_by`, `remarks`; `UNIQUE(tenant_id, student_id, attendance_date)`)
27. `teacher_attendance` — Daily teacher/staff attendance (`tenant_id`, `teacher_id`, `attendance_date`, `status`, `check_in_at`, `check_out_at`, `marked_by`; `UNIQUE(tenant_id, teacher_id, attendance_date)`)
28. `exams` — Examination definitions (`tenant_id`, `session_id`, `name`, `category`, `start_date`, `end_date`, `status` [`draft`, `scheduled`, `marks_entry`, `pending_approval`, `published`], `approved_by`, `approved_at`)
29. `exam_subjects` — Subject papers & max marks per exam (`tenant_id`, `exam_id`, `class_id`, `subject_id`, `exam_date`, `max_marks`, `pass_marks`)
30. `marks` — Student subject marks (`tenant_id`, `exam_id`, `exam_subject_id`, `student_id`, `marks_obtained`, `is_absent`, `entered_by`, `remarks`; `CHECK (marks_obtained >= 0)`)
31. `grading_rules` — Institution-configurable GPA/grade boundaries (`tenant_id`, `grade_label`, `min_percentage`, `max_percentage`, `gpa_point`, `remarks`)
32. `results` — Calculated & approved exam results (`tenant_id`, `exam_id`, `student_id`, `total_marks`, `max_total_marks`, `percentage`, `gpa`, `grade`, `rank_position`, `is_passed`, `is_published`, `published_by`, `published_at`)
33. `report_cards` — Issued transcript/report card snapshots (`tenant_id`, `result_id`, `student_id`, `exam_id`, `card_number`, `snapshot_json`, `issued_at`)
34. `timetables` — Weekly class routines (`tenant_id`, `session_id`, `class_id`, `section_id`, `subject_id`, `teacher_id`, `day_of_week`, `start_time`, `end_time`, `room_number`)
35. `homework` — Daily homework tasks (`tenant_id`, `class_id`, `section_id`, `subject_id`, `teacher_id`, `title`, `description`, `due_date`, `attachment_url`)
36. `assignments` — Graded assignments (`tenant_id`, `class_id`, `section_id`, `subject_id`, `teacher_id`, `title`, `description`, `max_score`, `due_at`, `attachment_url`)
37. `assignment_submissions` — Student assignment submissions & grading (`tenant_id`, `assignment_id`, `student_id`, `submission_url`, `submitted_at`, `score`, `feedback`, `graded_by`)
38. `learning_materials` — Notes, PDFs, resources (`tenant_id`, `class_id`, `subject_id`, `uploaded_by`, `title`, `file_url`, `material_type`)

### E. Financial & Campus Operations Tables (`202611120006_financial_and_campus_ops.sql`)
39. `fee_categories` — Admission, Tuition, Monthly, Exam, Transport, Other (`tenant_id`, `name`, `code`, `default_amount_cents`, `frequency`)
40. `discounts` — Fee discount rules (`tenant_id`, `name`, `discount_type`, `value`, `is_active`)
41. `scholarships` — Student scholarships (`tenant_id`, `student_id`, `name`, `percentage`, `fixed_amount_cents`, `session_id`, `approved_by`)
42. `student_fees` — Student fee ledger items (`tenant_id`, `student_id`, `session_id`, `fee_category_id`, `title`, `gross_amount_cents`, `discount_amount_cents`, `net_amount_cents`, `paid_amount_cents`, `due_date`, `status` [`unpaid`, `partial`, `paid`, `waived`, `overdue`])
43. `fee_payments` — Verified payment receipts & ledger entries (`tenant_id`, `student_fee_id`, `student_id`, `receipt_number`, `amount_cents`, `payment_method`, `payment_status`, `gateway_reference`, `collected_by`, `paid_at`)
44. `expenses` — Institutional expenses (`tenant_id`, `category`, `title`, `amount_cents`, `expense_date`, `vendor_name`, `recorded_by`, `receipt_url`)
45. `library_books` — Book catalog (`tenant_id`, `isbn`, `title`, `author`, `category`, `total_copies`, `available_copies`)
46. `book_issues` — Circulation ledger (`tenant_id`, `book_id`, `borrower_user_id`, `issued_at`, `due_at`, `returned_at`, `fine_cents`, `status`)
47. `vehicles` — School buses/fleet (`tenant_id`, `vehicle_number`, `driver_name`, `driver_phone`, `capacity`, `status`)
48. `transport_routes` — Routes & monthly transport fee (`tenant_id`, `route_name`, `vehicle_id`, `stops_json`, `monthly_fee_cents`)
49. `payroll` — Monthly teacher/staff salary runs (`tenant_id`, `employee_type`, `employee_id`, `month_year`, `basic_cents`, `allowances_cents`, `deductions_cents`, `net_pay_cents`, `status`, `paid_at`)
50. `leave_requests` — Teacher/staff/student leave requests (`tenant_id`, `requester_user_id`, `leave_type`, `start_date`, `end_date`, `reason`, `status`, `reviewed_by`)
51. `notices` — School announcements (`tenant_id`, `title`, `body`, `target_roles`, `is_pinned`, `published_at`, `created_by`)
52. `events` — Academic & campus calendar (`tenant_id`, `title`, `description`, `event_type`, `start_at`, `end_at`, `location`)
53. `notifications` — Tenant-scoped in-app & push records (`tenant_id`, `recipient_user_id`, `title`, `body`, `category`, `resource_type`, `resource_id`, `is_read`, `push_sent_at`)
54. `communication_threads` & `communication_messages` — Parent-teacher messaging scoped strictly to linked guardians & teachers
55. `support_tickets` — Tenant & platform support requests (`tenant_id`, `created_by`, `subject`, `description`, `priority`, `status`, `assigned_to`)

### F. Remote Control, Security & Audit Tables (`202611120007_remote_config_and_security.sql`)
56. `modules` — Canonical dynamic modules (`key`, `name`, `description`, `icon`, `default_route`, `nav_order`, `is_globally_enabled`, `required_permission`, `min_plan_tier`)
57. `features` — Granular feature toggles per module (`module_id`, `feature_key`, `name`, `is_enabled_by_default`)
58. `tenant_features` — Tenant-level module & feature overrides (`tenant_id`, `module_key`, `feature_key`, `is_enabled`, `updated_by`)
59. `navigation_items` — Server-driven navigation items (`id`, `scope` [`global`, `tenant`], `tenant_id`, `module_key`, `label`, `icon`, `route_path`, `target_type` [`native`, `web`, `custom_screen`], `target_roles`, `platforms` [`web`, `mobile`], `sort_order`, `is_visible`, `is_custom`)
60. `dashboard_widgets` — Server-driven dashboard widgets (`id`, `scope`, `tenant_id`, `widget_key`, `title`, `widget_type`, `target_roles`, `platforms`, `sort_order`, `is_visible`, `config_json`)
61. `app_config` — Global/Tenant/Role config entries (`id`, `scope` [`global`, `tenant`, `role`], `tenant_id`, `role_key`, `theme_tokens`, `branding`, `settings_json`, `maintenance_mode`, `version_number`, `updated_by`)
62. `configuration_versions` — Immutable snapshot history (`id`, `version_number`, `scope`, `tenant_id`, `snapshot_json`, `change_summary`, `restored_from_version_id`, `created_by`, `created_at`)
63. `user_settings` — Per-user theme/notification preferences (`user_id`, `theme_mode`, `notification_prefs`, `locale`)
64. `device_registrations` — Registered Android/Web devices & FCM tokens (`user_id`, `tenant_id`, `device_id`, `platform`, `device_name`, `app_version`, `fcm_token`, `is_active`, `last_seen_at`)
65. `user_sessions` — Tracked active sessions for remote revocation (`user_id`, `tenant_id`, `device_id`, `session_token_hash`, `ip_address`, `user_agent`, `expires_at`, `revoked_at`, `revoked_by`)
66. `activity_logs` & `audit_logs` — Immutable security, remote config, and financial audit trail (`tenant_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `ip_address`, `created_at`)
67. `backups_metadata` — Backup schedule & export job tracking (`scope`, `tenant_id`, `status`, `storage_path`, `triggered_by`)

---

## 3. Core Database Functions & RLS Enforcement (`202611120008` & `202611120009`)

- `app.is_platform_admin()` -> `BOOLEAN`
- `app.is_tenant_active(p_tenant_id UUID)` -> `BOOLEAN` (checks `status = 'active' AND deleted_at IS NULL`)
- `app.has_tenant_membership(p_tenant_id UUID)` -> `BOOLEAN` (checks active membership + active tenant + non-revoked session if session header/claim present)
- `app.has_tenant_permission(p_tenant_id UUID, p_permission_key TEXT)` -> `BOOLEAN`
- `app.is_module_enabled_for_tenant(p_tenant_id UUID, p_module_key TEXT)` -> `BOOLEAN` (checks Global Module flag -> Plan Entitlement -> `tenant_features` override)
- `app.is_guardian_of_student(p_tenant_id UUID, p_student_id UUID)` -> `BOOLEAN`
- `app.is_teacher_assigned(p_tenant_id UUID, p_class_id UUID, p_subject_id UUID DEFAULT NULL)` -> `BOOLEAN`
- `public.resolve_effective_config(p_tenant_id UUID, p_platform TEXT DEFAULT 'web')` -> `JSONB`
- `public.publish_remote_config_version(...)` -> `UUID` (version snapshot ID)
- `public.rollback_remote_config_version(p_version_id UUID)` -> `UUID`
- `public.calculate_exam_results(p_tenant_id UUID, p_exam_id UUID)` -> `INTEGER`
- `public.approve_and_publish_exam_results(p_tenant_id UUID, p_exam_id UUID)` -> `VOID`
