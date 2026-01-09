

CREATE DATABASE IF NOT EXISTS smart_campus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_campus;


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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  user_id BIGINT UNSIGNED NOT NULL,
  reg_no VARCHAR(50) NOT NULL,
  department VARCHAR(120) NOT NULL,
  program VARCHAR(120) NOT NULL,
  year_of_study INT NOT NULL,
  current_semester INT NOT NULL,
  cgpa DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  arrears_count INT NOT NULL DEFAULT 0,
  phone VARCHAR(20) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_students_reg (reg_no),
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faculty (
  user_id BIGINT UNSIGNED NOT NULL,
  emp_no VARCHAR(50) NOT NULL,
  department VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_faculty_emp (emp_no),
  CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- NOTIFICATIONS (IN_APP + optional EMAIL/SMS placeholders)
-- -------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  channel ENUM('IN_APP','EMAIL','SMS','WHATSAPP') NOT NULL DEFAULT 'IN_APP',
  priority ENUM('LOW','NORMAL','HIGH','CRITICAL') NOT NULL DEFAULT 'NORMAL',
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  related_type VARCHAR(60) NULL,
  related_id BIGINT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id, is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- AUDIT LOGS
-- -------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  ip_addr VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_actor (actor_user_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------
-- DB-BACKED AGENT EVENT QUEUE
-- -------------------------
CREATE TABLE IF NOT EXISTS agent_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(80) NOT NULL,
  payload_json JSON NOT NULL,
  status ENUM('PENDING','PROCESSING','DONE','FAILED') NOT NULL DEFAULT 'PENDING',
  available_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_at TIMESTAMP NULL DEFAULT NULL,
  locked_by VARCHAR(120) NULL DEFAULT NULL,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_agent_events_status (status, available_at),
  KEY idx_agent_events_type (event_type, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS agent_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  agent_name VARCHAR(80) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL DEFAULT NULL,
  status ENUM('RUNNING','DONE','FAILED') NOT NULL DEFAULT 'RUNNING',
  summary_json JSON NULL,
  error_text TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_agent_runs_agent (agent_name, started_at)
) ENGINE=InnoDB;

-- =========================================================
-- CLASSROOM ALLOCATION AGENT TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS classrooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  building VARCHAR(120) NOT NULL,
  room_number VARCHAR(30) NOT NULL,
  room_type ENUM('CLASSROOM','LAB','AUDITORIUM','SEMINAR') NOT NULL DEFAULT 'CLASSROOM',
  capacity INT NOT NULL,
  equipment_json JSON NULL,
  status ENUM('OK','MAINTENANCE','BLOCKED') NOT NULL DEFAULT 'OK',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_room (building, room_number),
  KEY idx_classrooms_status (status, is_active),
  KEY idx_classrooms_capacity (capacity)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS room_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_user_id BIGINT UNSIGNED NOT NULL,
  request_type ENUM('CLASS','EXAM','PLACEMENT_DRIVE','INTERVIEW') NOT NULL,
  title VARCHAR(180) NOT NULL,
  request_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  strength INT NOT NULL DEFAULT 0,
  required_equipment_json JSON NULL,
  preferred_building VARCHAR(120) NULL,
  status ENUM('PENDING','ALLOCATED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  decision_reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_room_requests_status (status, request_date),
  KEY idx_room_requests_requester (requester_user_id),
  CONSTRAINT fk_room_requests_requester FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS room_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  classroom_id BIGINT UNSIGNED NOT NULL,
  alloc_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  allocated_by ENUM('AGENT','MANUAL') NOT NULL DEFAULT 'AGENT',
  status ENUM('ACTIVE','CANCELLED','REPLACED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_room_alloc_time (classroom_id, alloc_date, start_time, end_time, status),
  KEY idx_room_alloc_request (request_id),
  KEY idx_room_alloc_room (classroom_id, alloc_date),
  CONSTRAINT fk_room_alloc_req FOREIGN KEY (request_id) REFERENCES room_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_room_alloc_room FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS allocation_conflicts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  conflict_reason VARCHAR(255) NOT NULL,
  suggestions_json JSON NULL,
  detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  resolution_notes VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_alloc_conf_req (request_id),
  CONSTRAINT fk_alloc_conf_req FOREIGN KEY (request_id) REFERENCES room_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS allocation_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  allocation_id BIGINT UNSIGNED NOT NULL,
  action ENUM('CREATED','CANCELLED','REASSIGNED','OVERRIDDEN') NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_alloc_hist_alloc (allocation_id),
  CONSTRAINT fk_alloc_hist_alloc FOREIGN KEY (allocation_id) REFERENCES room_allocations(id) ON DELETE CASCADE,
  CONSTRAINT fk_alloc_hist_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS timetable_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_type ENUM('STUDENT','FACULTY') NOT NULL,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('CLASS','EXAM','PLACEMENT') NOT NULL,
  title VARCHAR(180) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom_id BIGINT UNSIGNED NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tt_owner (owner_type, owner_user_id, event_date),
  KEY idx_tt_date (event_date),
  CONSTRAINT fk_tt_room FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_tt_owner_user FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- FEE & FINANCE AGENT TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS fee_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  is_optional TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fee_cat (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fee_structures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  program VARCHAR(120) NOT NULL,
  year_of_study INT NOT NULL,
  semester INT NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fee_struct_prog (program, year_of_study, semester, is_active),
  CONSTRAINT fk_fee_struct_cat FOREIGN KEY (category_id) REFERENCES fee_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_fee_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  program VARCHAR(120) NOT NULL,
  year_of_study INT NOT NULL,
  semester INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  pending_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  fine_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  status ENUM('CLEAR','PENDING','OVERDUE') NOT NULL DEFAULT 'PENDING',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fee_account_term (student_user_id, program, year_of_study, semester),
  KEY idx_fee_account_status (status, due_date),
  CONSTRAINT fk_fee_account_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method ENUM('UPI','CARD','NETBANKING','CASH','OFFLINE') NOT NULL,
  status ENUM('SUCCESS','FAILED','PENDING') NOT NULL DEFAULT 'PENDING',
  gateway_ref VARCHAR(120) NULL,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pay_student (student_user_id, created_at),
  KEY idx_pay_status (status),
  CONSTRAINT fk_pay_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_pay_items_pay (payment_id),
  CONSTRAINT fk_pay_items_pay FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_pay_items_cat FOREIGN KEY (category_id) REFERENCES fee_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS receipts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  receipt_no VARCHAR(40) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  receipt_data_json JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_receipt_payment (payment_id),
  UNIQUE KEY uq_receipt_no (receipt_no),
  CONSTRAINT fk_receipt_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  issue_type ENUM('FAILED','MISMATCH','GATEWAY_TIMEOUT') NOT NULL,
  details VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pay_issue_pay (payment_id),
  CONSTRAINT fk_pay_issue_pay FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- EXAMINATION MANAGEMENT AGENT TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(30) NOT NULL,
  course_name VARCHAR(180) NOT NULL,
  semester INT NOT NULL,
  program VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_code (course_code),
  KEY idx_course_prog_sem (program, semester)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS course_enrollments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  term_year INT NOT NULL,
  term_name VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enroll (student_user_id, course_id, term_year, term_name),
  KEY idx_enroll_course (course_id),
  CONSTRAINT fk_enroll_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  term_year INT NOT NULL,
  term_name VARCHAR(40) NOT NULL,
  attendance_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_att (student_user_id, course_id, term_year, term_name),
  CONSTRAINT fk_att_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  term_year INT NOT NULL,
  term_name VARCHAR(40) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('DRAFT','PUBLISHED','RESCHEDULED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exam_session (term_year, term_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_subjects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_session_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  exam_date DATE NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  status ENUM('PLANNED','SCHEDULED','RESCHEDULED','CANCELLED') NOT NULL DEFAULT 'PLANNED',
  PRIMARY KEY (id),
  UNIQUE KEY uq_exam_subj (exam_session_id, course_id),
  KEY idx_exam_date (exam_date),
  CONSTRAINT fk_exam_subj_sess FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_subj_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_eligibility (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_session_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  is_eligible TINYINT(1) NOT NULL DEFAULT 0,
  reasons_json JSON NULL,
  computed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exam_elig (exam_session_id, student_user_id),
  CONSTRAINT fk_exam_elig_sess FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_elig_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hall_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_session_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  ticket_no VARCHAR(40) NOT NULL,
  qr_payload TEXT NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('ACTIVE','UPDATED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (id),
  UNIQUE KEY uq_hall_ticket (exam_session_id, student_user_id),
  UNIQUE KEY uq_ticket_no (ticket_no),
  CONSTRAINT fk_ticket_sess FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hall_ticket_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hall_ticket_id BIGINT UNSIGNED NOT NULL,
  exam_subject_id BIGINT UNSIGNED NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom_id BIGINT UNSIGNED NULL,
  seat_no VARCHAR(20) NULL,
  PRIMARY KEY (id),
  KEY idx_ticket_items_ticket (hall_ticket_id),
  CONSTRAINT fk_ticket_items_ticket FOREIGN KEY (hall_ticket_id) REFERENCES hall_tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_items_subj FOREIGN KEY (exam_subject_id) REFERENCES exam_subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_items_room FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- PLACEMENT MANAGEMENT AGENT TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  student_user_id BIGINT UNSIGNED NOT NULL,
  resume_url VARCHAR(255) NULL,
  skills_json JSON NULL,
  projects_json JSON NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_user_id),
  CONSTRAINT fk_profiles_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  industry VARCHAR(120) NULL,
  contact_email VARCHAR(190) NULL,
  contact_phone VARCHAR(30) NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_criteria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  min_cgpa DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  max_arrears INT NOT NULL DEFAULT 999,
  require_fee_clearance TINYINT(1) NOT NULL DEFAULT 1,
  allowed_programs_json JSON NULL,
  allowed_semesters_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_criteria (company_id),
  CONSTRAINT fk_criteria_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS placement_drives (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  drive_title VARCHAR(180) NOT NULL,
  drive_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  stage ENUM('ANNOUNCED','APPLICATIONS','SHORTLISTED','TEST','INTERVIEWS','RESULTS','CLOSED') NOT NULL DEFAULT 'ANNOUNCED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_drive_stage (stage, drive_date),
  CONSTRAINT fk_drive_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS drive_applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drive_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('APPLIED','INELIGIBLE','SHORTLISTED','REJECTED','TESTED','INTERVIEWED','SELECTED','JOINED') NOT NULL DEFAULT 'APPLIED',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_drive_student (drive_id, student_user_id),
  KEY idx_drive_app_status (drive_id, status),
  CONSTRAINT fk_drive_app_drive FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE,
  CONSTRAINT fk_drive_app_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interview_slots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drive_id BIGINT UNSIGNED NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 10,
  room_request_id BIGINT UNSIGNED NULL,
  room_allocation_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_slots_drive (drive_id, slot_date),
  CONSTRAINT fk_slots_drive FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE,
  CONSTRAINT fk_slots_room_req FOREIGN KEY (room_request_id) REFERENCES room_requests(id) ON DELETE SET NULL,
  CONSTRAINT fk_slots_room_alloc FOREIGN KEY (room_allocation_id) REFERENCES room_allocations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interview_slot_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slot_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('ASSIGNED','COMPLETED','NO_SHOW','RESCHEDULED') NOT NULL DEFAULT 'ASSIGNED',
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slot_student (slot_id, student_user_id),
  CONSTRAINT fk_slot_assign_slot FOREIGN KEY (slot_id) REFERENCES interview_slots(id) ON DELETE CASCADE,
  CONSTRAINT fk_slot_assign_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS offers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drive_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  offer_status ENUM('OFFERED','ACCEPTED','DECLINED','JOINED') NOT NULL DEFAULT 'OFFERED',
  offer_letter_url VARCHAR(255) NULL,
  offered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offer (drive_id, student_user_id),
  CONSTRAINT fk_offer_drive FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE,
  CONSTRAINT fk_offer_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS exam_subject_rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_subject_id BIGINT UNSIGNED NOT NULL,
  room_request_id BIGINT UNSIGNED NOT NULL,
  room_allocation_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exam_subject (exam_subject_id),
  KEY idx_esr_room_req (room_request_id),
  KEY idx_esr_room_alloc (room_allocation_id),
  CONSTRAINT fk_esr_exam_subject FOREIGN KEY (exam_subject_id) REFERENCES exam_subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_esr_room_req FOREIGN KEY (room_request_id) REFERENCES room_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_esr_room_alloc FOREIGN KEY (room_allocation_id) REFERENCES room_allocations(id) ON DELETE SET NULL
) ENGINE=InnoDB;
