-- Smart Campus API - Admin schema
-- Run this on your MySQL database (e.g., smart_campus)

CREATE DATABASE IF NOT EXISTS smart_campus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_campus;

-- -------------------------
-- Core auth tables
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('STUDENT','FACULTY','ADMIN') NOT NULL,
  admin_scope ENUM('GENERAL','EXAM','FINANCE','PLACEMENT') NULL DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  reg_no VARCHAR(32) NULL,
  department VARCHAR(64) NULL,
  program VARCHAR(64) NULL,
  semester INT NULL,
  year_of_study VARCHAR(16) NULL,
  cgpa DECIMAL(4,2) NULL,
  arrears INT NULL DEFAULT 0,
  fee_clear TINYINT(1) NOT NULL DEFAULT 1,
  attendance_pct INT NULL DEFAULT 0,
  dob DATE NULL,
  mobile VARCHAR(32) NULL,
  resume_url VARCHAR(255) NULL,
  resume_name VARCHAR(255) NULL,
  resume_mime VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_profiles_reg_no (reg_no),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_otps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL UNIQUE,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  last_sent_at DATETIME NOT NULL,
  send_count INT NOT NULL DEFAULT 1,
  verified_at DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_pr_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_auth_tokens_user (user_id),
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Classrooms + allocations
-- -------------------------
CREATE TABLE IF NOT EXISTS classrooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_code VARCHAR(32) NOT NULL,
  room_name VARCHAR(128) NOT NULL,
  building VARCHAR(64) NOT NULL,
  floor INT NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 0,
  room_type ENUM('LECTURE','LAB','SEMINAR','AUDITORIUM') NOT NULL DEFAULT 'LECTURE',
  status ENUM('OK','MAINTENANCE','INACTIVE') NOT NULL DEFAULT 'OK',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  has_projector TINYINT(1) NOT NULL DEFAULT 0,
  has_ac TINYINT(1) NOT NULL DEFAULT 0,
  equipment_json TEXT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_classrooms_code (room_code),
  KEY idx_classrooms_building (building)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS room_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_user_id BIGINT UNSIGNED NULL,
  requester_ref VARCHAR(64) NULL,
  request_type VARCHAR(24) NOT NULL,
  title VARCHAR(255) NOT NULL,
  request_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  strength INT NOT NULL DEFAULT 0,
  room_type VARCHAR(24) NULL,
  needs_projector TINYINT(1) NOT NULL DEFAULT 0,
  needs_ac TINYINT(1) NOT NULL DEFAULT 0,
  required_equipment_json TEXT NULL,
  preferred_building VARCHAR(64) NULL,
  status ENUM('PENDING','ALLOCATED','REJECTED','CANCELLED','FAILED') NOT NULL DEFAULT 'PENDING',
  exam_session_id BIGINT UNSIGNED NULL,
  exam_subject_id BIGINT UNSIGNED NULL,
  allocation_id BIGINT UNSIGNED NULL,
  classroom_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_room_requests_date (request_date),
  KEY idx_room_requests_status (status),
  CONSTRAINT fk_room_requests_user FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS room_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  classroom_id BIGINT UNSIGNED NOT NULL,
  alloc_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_room_allocations_date (alloc_date),
  CONSTRAINT fk_room_allocations_request FOREIGN KEY (request_id) REFERENCES room_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_room_allocations_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Exams
-- -------------------------
CREATE TABLE IF NOT EXISTS exam_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  term VARCHAR(128) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('DRAFT','SCHEDULED','RUNNING','COMPLETED') NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_subjects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  batch VARCHAR(64) NOT NULL,
  semester VARCHAR(32) NOT NULL,
  status ENUM('PLANNED','PUBLISHED') NOT NULL DEFAULT 'PLANNED',
  PRIMARY KEY (id),
  KEY idx_exam_subjects_session (session_id),
  CONSTRAINT fk_exam_subjects_session FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_eligibility (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  reg_no VARCHAR(32) NOT NULL,
  student_name VARCHAR(120) NOT NULL,
  attendance_pct INT NOT NULL DEFAULT 0,
  fee_status ENUM('CLEAR','PENDING') NOT NULL DEFAULT 'PENDING',
  eligible TINYINT(1) NOT NULL DEFAULT 0,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_exam_eligibility_session (session_id),
  CONSTRAINT fk_exam_eligibility_session FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_hall_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  reg_no VARCHAR(32) NOT NULL,
  student_name VARCHAR(120) NOT NULL,
  issued_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_exam_hall_tickets_session (session_id),
  CONSTRAINT fk_exam_hall_tickets_session FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_hall_ticket_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  room VARCHAR(64) NOT NULL DEFAULT 'PENDING',
  seat VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (id),
  KEY idx_exam_ticket_items_ticket (ticket_id),
  CONSTRAINT fk_exam_ticket_items_ticket FOREIGN KEY (ticket_id) REFERENCES exam_hall_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_agent_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  requested_at DATETIME NOT NULL,
  status ENUM('SUCCESS','FAILED') NOT NULL DEFAULT 'SUCCESS',
  message VARCHAR(255) NOT NULL,
  agent VARCHAR(64) NULL,
  PRIMARY KEY (id),
  KEY idx_exam_runs_session (session_id),
  CONSTRAINT fk_exam_runs_session FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Fees
-- -------------------------
CREATE TABLE IF NOT EXISTS fee_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_structures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  program VARCHAR(64) NOT NULL,
  year VARCHAR(16) NOT NULL,
  semester VARCHAR(16) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  fine_per_day DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fee_structures_category (category_id),
  CONSTRAINT fk_fee_structures_category FOREIGN KEY (category_id) REFERENCES fee_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_fee_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reg_no VARCHAR(32) NOT NULL,
  student_name VARCHAR(120) NOT NULL,
  program VARCHAR(64) NOT NULL,
  year VARCHAR(16) NOT NULL,
  total_payable DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  due DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('CLEAR','DUE','OVERDUE') NOT NULL DEFAULT 'DUE',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fee_accounts_regno (reg_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reg_no VARCHAR(32) NOT NULL,
  student_name VARCHAR(120) NOT NULL,
  fee_type VARCHAR(128) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  method ENUM('ONLINE','CASH','BANK') NOT NULL DEFAULT 'ONLINE',
  ref_no VARCHAR(64) NOT NULL,
  status ENUM('SUCCESS','PENDING','FAILED') NOT NULL DEFAULT 'SUCCESS',
  paid_on DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_fee_payments_regno (reg_no),
  KEY idx_fee_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_agent_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ran_at DATETIME NOT NULL,
  status ENUM('COMPLETED','RUNNING','FAILED') NOT NULL DEFAULT 'COMPLETED',
  title VARCHAR(128) NOT NULL,
  details VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Placements
-- -------------------------
CREATE TABLE IF NOT EXISTS placement_companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  industry VARCHAR(128) NULL,
  contact_email VARCHAR(190) NULL,
  contact_phone VARCHAR(32) NULL,
  notes VARCHAR(255) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_criteria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  min_cgpa DECIMAL(4,2) NOT NULL DEFAULT 0,
  max_arrears INT NOT NULL DEFAULT 0,
  require_fee_clearance TINYINT(1) NOT NULL DEFAULT 1,
  allowed_programs_json TEXT NULL,
  allowed_semesters_json TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_placement_criteria_company (company_id),
  CONSTRAINT fk_placement_criteria_company FOREIGN KEY (company_id) REFERENCES placement_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_drives (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  drive_title VARCHAR(255) NOT NULL,
  drive_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  stage ENUM('ANNOUNCED','APPLICATIONS','SHORTLISTED','TEST','INTERVIEWS','RESULTS','CLOSED') NOT NULL DEFAULT 'ANNOUNCED',
  PRIMARY KEY (id),
  KEY idx_placement_drives_company (company_id),
  CONSTRAINT fk_placement_drives_company FOREIGN KEY (company_id) REFERENCES placement_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  reg_no VARCHAR(32) NOT NULL,
  program VARCHAR(64) NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  cgpa DECIMAL(4,2) NOT NULL DEFAULT 0,
  arrears INT NOT NULL DEFAULT 0,
  fee_clear TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_placement_students_regno (reg_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drive_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('APPLIED','INELIGIBLE','SHORTLISTED','REJECTED','TESTED','INTERVIEWED','SELECTED','JOINED') NOT NULL DEFAULT 'APPLIED',
  PRIMARY KEY (id),
  UNIQUE KEY uq_placement_app (drive_id, student_user_id),
  KEY idx_placement_app_drive (drive_id),
  CONSTRAINT fk_placement_app_drive FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE,
  CONSTRAINT fk_placement_app_student FOREIGN KEY (student_user_id) REFERENCES placement_students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_slots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drive_id BIGINT UNSIGNED NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  room_request_id BIGINT UNSIGNED NULL,
  room_allocation_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_placement_slots_drive (drive_id),
  CONSTRAINT fk_placement_slots_drive FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_slot_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slot_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('ASSIGNED','COMPLETED','NO_SHOW','RESCHEDULED') NOT NULL DEFAULT 'ASSIGNED',
  PRIMARY KEY (id),
  UNIQUE KEY uq_slot_assignment (slot_id, student_user_id),
  CONSTRAINT fk_slot_assignment_slot FOREIGN KEY (slot_id) REFERENCES placement_slots(id) ON DELETE CASCADE,
  CONSTRAINT fk_slot_assignment_student FOREIGN KEY (student_user_id) REFERENCES placement_students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_offers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drive_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  offer_status ENUM('OFFERED','ACCEPTED','DECLINED','JOINED') NOT NULL DEFAULT 'OFFERED',
  offer_letter_url VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offer (drive_id, student_user_id),
  CONSTRAINT fk_offer_drive FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE,
  CONSTRAINT fk_offer_student FOREIGN KEY (student_user_id) REFERENCES placement_students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_agent_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drive_id BIGINT UNSIGNED NOT NULL,
  agent_name VARCHAR(64) NOT NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  status ENUM('RUNNING','DONE','FAILED') NOT NULL DEFAULT 'DONE',
  summary_json TEXT NULL,
  error_text VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_placement_runs_drive (drive_id),
  CONSTRAINT fk_placement_runs_drive FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Notifications
-- -------------------------
CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at DATETIME NOT NULL,
  severity ENUM('INFO','SUCCESS','WARNING','DANGER') NOT NULL DEFAULT 'INFO',
  channel ENUM('IN_APP','EMAIL','SMS','WHATSAPP') NOT NULL DEFAULT 'IN_APP',
  status ENUM('UNREAD','READ','ARCHIVED') NOT NULL DEFAULT 'UNREAD',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(64) NULL,
  entity_id VARCHAR(64) NULL,
  actor VARCHAR(64) NULL,
  PRIMARY KEY (id),
  KEY idx_admin_notifications_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Faculty profiles (extends user_profiles for faculty-specific data)
-- -------------------------
CREATE TABLE IF NOT EXISTS faculty_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  speciality VARCHAR(100) NULL,
  ug_university VARCHAR(255) NULL,
  pg_university VARCHAR(255) NULL,
  appointment_date DATE NULL,
  designation VARCHAR(100) NULL,
  ug_year VARCHAR(16) NULL,
  pg_year VARCHAR(16) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_faculty_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Teacher notifications
-- -------------------------
CREATE TABLE IF NOT EXISTS teacher_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  teacher_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender VARCHAR(128) NULL,
  has_download TINYINT(1) NOT NULL DEFAULT 0,
  download_url VARCHAR(255) NULL,
  status ENUM('UNREAD','READ','ARCHIVED') NOT NULL DEFAULT 'UNREAD',
  PRIMARY KEY (id),
  KEY idx_teacher_notifications_teacher (teacher_user_id),
  CONSTRAINT fk_teacher_notifications_teacher FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Student notifications + dashboard
-- -------------------------
CREATE TABLE IF NOT EXISTS student_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender VARCHAR(128) NULL,
  has_download TINYINT(1) NOT NULL DEFAULT 0,
  download_url VARCHAR(255) NULL,
  status ENUM('UNREAD','READ','ARCHIVED') NOT NULL DEFAULT 'UNREAD',
  PRIMARY KEY (id),
  KEY idx_student_notifications_student (student_user_id),
  KEY idx_student_notifications_status (status),
  CONSTRAINT fk_student_notifications_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Student academics
-- -------------------------
CREATE TABLE IF NOT EXISTS course_catalog (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  faculty VARCHAR(120) NULL,
  program VARCHAR(64) NULL,
  semester VARCHAR(16) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_catalog_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_attendance_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  class_attended INT NOT NULL DEFAULT 0,
  attended_hours INT NOT NULL DEFAULT 0,
  total_class INT NOT NULL DEFAULT 0,
  total_hours INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_attendance_student (student_user_id),
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_od_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  faculty_status ENUM('APPROVED','PENDING','REJECTED') NOT NULL DEFAULT 'PENDING',
  principal_status ENUM('APPROVED','PENDING','REJECTED') NOT NULL DEFAULT 'PENDING',
  requested_on DATE NOT NULL,
  content TEXT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_od_student (student_user_id),
  CONSTRAINT fk_od_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('UPCOMING','SUBMITTED','EVALUATED','MISSING') NOT NULL DEFAULT 'UPCOMING',
  faculty VARCHAR(120) NULL,
  max_marks INT NULL,
  PRIMARY KEY (id),
  KEY idx_assignments_student (student_user_id),
  CONSTRAINT fk_assignments_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_course_content (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  kind ENUM('PDF','PPT','LINK','VIDEO') NOT NULL DEFAULT 'PDF',
  posted_on DATE NOT NULL,
  url VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_content_student (student_user_id),
  CONSTRAINT fk_content_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_exam_schedule (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  exam_name VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  mode ENUM('ONLINE','OFFLINE') NOT NULL DEFAULT 'OFFLINE',
  status ENUM('SCHEDULED','COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
  PRIMARY KEY (id),
  KEY idx_exam_schedule_student (student_user_id),
  CONSTRAINT fk_exam_schedule_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_enrollment_courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slot VARCHAR(32) NOT NULL,
  code VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  faculty VARCHAR(120) NULL,
  seats INT NOT NULL DEFAULT 0,
  registered INT NOT NULL DEFAULT 0,
  type VARCHAR(50) DEFAULT 'CONTACT',
  subject_category VARCHAR(100),
  course_category VARCHAR(100),
  prerequisite VARCHAR(255),
  approval_status ENUM('APPROVED','PENDING','REJECTED') NOT NULL DEFAULT 'APPROVED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_enrollment_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  slot VARCHAR(32) NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  requested_on DATE NOT NULL,
  PRIMARY KEY (id),
  KEY idx_enrollment_student (student_user_id),
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES student_enrollment_courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_disciplinary_cases (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  issue_details TEXT NOT NULL,
  last_action_details TEXT NULL,
  last_action_on DATE NULL,
  complainant VARCHAR(120) NOT NULL,
  issue_on DATE NOT NULL,
  status ENUM('INPROGRESS','CLOSED','REJECTED') NOT NULL DEFAULT 'INPROGRESS',
  file_name VARCHAR(255) NULL,
  file_content MEDIUMTEXT NULL,
  PRIMARY KEY (id),
  KEY idx_disciplinary_student (student_user_id),
  CONSTRAINT fk_disciplinary_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Student finance
-- -------------------------
CREATE TABLE IF NOT EXISTS student_fee_dues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  reg_no VARCHAR(32) NOT NULL,
  fee_type VARCHAR(128) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status ENUM('PENDING','PAID','OVERDUE') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (id),
  KEY idx_fee_dues_student (student_user_id),
  KEY idx_fee_dues_regno (reg_no),
  CONSTRAINT fk_fee_dues_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Student profile records + resume
-- -------------------------
CREATE TABLE IF NOT EXISTS student_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  record_type VARCHAR(64) NOT NULL,
  details TEXT NOT NULL,
  dated_on DATE NOT NULL,
  file_name VARCHAR(255) NULL,
  file_mime VARCHAR(64) NULL,
  file_data_url MEDIUMTEXT NULL,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATE NULL,
  PRIMARY KEY (id),
  KEY idx_student_records_student (student_user_id),
  CONSTRAINT fk_student_records_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_infra_issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NULL,
  file_url VARCHAR(255) NULL,
  file_type VARCHAR(64) NULL,
  created_at DATETIME NOT NULL,
  status ENUM('SUBMITTED','IN_REVIEW','RESOLVED') NOT NULL DEFAULT 'SUBMITTED',
  PRIMARY KEY (id),
  KEY idx_infra_student (student_user_id),
  CONSTRAINT fk_infra_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_offers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  offer_date DATE NOT NULL,
  file_name VARCHAR(255) NULL,
  file_url VARCHAR(255) NULL,
  status ENUM('SUBMITTED','APPROVED','REJECTED','PENDING') NOT NULL DEFAULT 'SUBMITTED',
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_offers_student (student_user_id),
  CONSTRAINT fk_offers_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_course_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  status ENUM('INPROGRESS','COMPLETED') NOT NULL DEFAULT 'INPROGRESS',
  grade VARCHAR(8) NULL,
  enrolled_on DATE NULL,
  completed_on DATE NULL,
  month_year VARCHAR(32) NULL,
  PRIMARY KEY (id),
  KEY idx_course_records_student (student_user_id),
  CONSTRAINT fk_course_records_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_graduation_status (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  program_elective_total INT NOT NULL DEFAULT 0,
  program_elective_completed INT NOT NULL DEFAULT 0,
  program_core_total INT NOT NULL DEFAULT 0,
  program_core_completed INT NOT NULL DEFAULT 0,
  university_core_total INT NOT NULL DEFAULT 0,
  university_core_completed INT NOT NULL DEFAULT 0,
  university_elective_total INT NOT NULL DEFAULT 0,
  university_elective_completed INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_grad_student (student_user_id),
  CONSTRAINT fk_grad_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_course_feedback (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  rating INT NOT NULL DEFAULT 0,
  comment TEXT NULL,
  submitted_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_feedback_student (student_user_id),
  CONSTRAINT fk_feedback_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_internal_marks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  mark INT NOT NULL DEFAULT 0,
  max_mark INT NOT NULL DEFAULT 0,
  dated_on DATE NOT NULL,
  PRIMARY KEY (id),
  KEY idx_internal_marks_student (student_user_id),
  CONSTRAINT fk_internal_marks_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_revaluation_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  grade VARCHAR(8) NOT NULL,
  marks INT NOT NULL DEFAULT 0,
  status ENUM('INITIATED','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'INITIATED',
  requested_on DATE NOT NULL,
  PRIMARY KEY (id),
  KEY idx_revaluation_student (student_user_id),
  CONSTRAINT fk_revaluation_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_no_due_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  request_date DATE NOT NULL,
  steps_json TEXT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_no_due_student (student_user_id),
  CONSTRAINT fk_no_due_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Classroom Requests
CREATE TABLE IF NOT EXISTS classroom_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_reg_no VARCHAR(32) NULL,
  course_id VARCHAR(64) NULL,
  course_label VARCHAR(255) NULL,
  classroom_id VARCHAR(64) NULL,
  classroom_label VARCHAR(255) NULL,
  request_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  expected_students INT NOT NULL DEFAULT 0,
  reason TEXT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_classroom_requests_date (request_date),
  KEY idx_classroom_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Classroom Allotments
CREATE TABLE IF NOT EXISTS classroom_allotments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  allocated_classroom_id VARCHAR(64) NOT NULL,
  alloc_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_classroom_allotments_date (alloc_date),
  CONSTRAINT fk_classroom_allotments_request FOREIGN KEY (request_id) REFERENCES classroom_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- Seed data for classrooms
-- -------------------------
INSERT INTO classrooms (room_code, room_name, building, floor, capacity, room_type, status, is_active, has_projector, has_ac, notes, created_at, updated_at) VALUES
('CR101', 'Lecture Hall A', 'Main Building', 1, 100, 'LECTURE', 'OK', 1, 1, 1, 'Primary lecture hall for large classes', NOW(), NOW()),
('CR102', 'Seminar Room B', 'Main Building', 2, 50, 'SEMINAR', 'OK', 1, 1, 0, 'Conference and seminar facility', NOW(), NOW()),
('CR103', 'Computer Lab C', 'Engineering Block', 1, 30, 'LAB', 'OK', 1, 0, 1, 'Programming and computer lab', NOW(), NOW()),
('CR104', 'Auditorium D', 'Main Building', 0, 300, 'AUDITORIUM', 'OK', 1, 1, 1, 'Large auditorium for events', NOW(), NOW()),
('CR105', 'Tutorial Room E', 'Science Block', 1, 25, 'SEMINAR', 'OK', 1, 1, 1, 'Small group tutorials', NOW(), NOW()),
('CR106', 'Physics Lab F', 'Science Block', 2, 20, 'LAB', 'OK', 1, 0, 1, 'Physics experiments lab', NOW(), NOW()),
('CR107', 'Chemistry Lab G', 'Science Block', 3, 25, 'LAB', 'OK', 1, 0, 1, 'Chemistry laboratory', NOW(), NOW()),
('CR108', 'Library Reading H', 'Library Building', 1, 40, 'SEMINAR', 'OK', 1, 0, 0, 'Quiet reading and study area', NOW(), NOW()),
('CR109', 'IT Lab I', 'Engineering Block', 2, 35, 'LAB', 'OK', 1, 1, 1, 'Information technology lab', NOW(), NOW()),
('CR110', 'Lecture Hall J', 'Main Building', 3, 80, 'LECTURE', 'OK', 1, 1, 1, 'Secondary lecture hall', NOW(), NOW()),
('CR111', 'Board Room K', 'Admin Block', 1, 15, 'SEMINAR', 'OK', 1, 1, 1, 'Executive board meetings', NOW(), NOW()),
('CR112', 'Open Air Theater L', 'Campus Grounds', 0, 500, 'AUDITORIUM', 'OK', 1, 0, 0, 'Outdoor theater for large gatherings', NOW(), NOW()),
('CR113', 'Dance Studio M', 'Arts Block', 1, 30, 'LAB', 'OK', 1, 1, 0, 'Performing arts studio', NOW(), NOW()),
('CR114', 'Music Room N', 'Arts Block', 2, 20, 'LAB', 'OK', 1, 0, 0, 'Music practice room', NOW(), NOW()),
('CR115', 'Cafeteria O', 'Student Center', 0, 200, 'SEMINAR', 'OK', 1, 0, 0, 'Student dining and events', NOW(), NOW())
ON DUPLICATE KEY UPDATE room_name = VALUES(room_name), building = VALUES(building), capacity = VALUES(capacity);
