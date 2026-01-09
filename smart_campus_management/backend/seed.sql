-- Seed test users for Smart Campus API
-- Run this after schema_query.sql
-- Passwords: admin123, teacher123, student123 (bcrypt hashed with salt 10)

USE smart_campus;

-- Clear existing test data
DELETE FROM user_profiles WHERE reg_no IN ('admsec123', 'ssetsec123', '192211661');
DELETE FROM users WHERE email LIKE '%@example.com';

-- Insert users with pre-hashed passwords
INSERT IGNORE INTO users (full_name, email, password_hash, role, is_active) VALUES
('Dr. Sarah Johnson', 'admin@example.com', '$2a$10$VmrqAw7.KHbiCTRr9.V/FOuhdNGiONyi5VyidVf6fwhi5VO6c.872', 'ADMIN', 1),
('Prof. Michael Chen', 'teacher@example.com', '$2a$10$zyN65NAkGdP95BjTXH3gqOLBv4HP7Nao3awjYkQzWgY5isCQgqw7e', 'FACULTY', 1),
('Alex Rodriguez', 'student@example.com', '$2a$10$N0kcXCJk4LeuwjLwS3RNfuLf0IDEa0EzRIMqA0kz5VZKC7LIl.jn2', 'STUDENT', 1);

-- Insert profiles using reg_no for all roles
INSERT INTO user_profiles (user_id, reg_no, department, program, semester, year_of_study, cgpa, mobile)
SELECT id, 'admsec123', 'Administration', 'Management', NULL, NULL, NULL, '9876543210' FROM users WHERE email = 'admin@example.com'
UNION ALL
SELECT id, 'ssetsec123', 'Computer Science', 'Engineering', NULL, NULL, NULL, '9876543211' FROM users WHERE email = 'teacher@example.com'
UNION ALL
SELECT id, '192211661', 'Computer Science', 'B.Tech CSE', 6, '3rd Year', 8.5, '9876543212' FROM users WHERE email = 'student@example.com';

-- Insert faculty profiles for teachers
INSERT IGNORE INTO faculty_profiles (user_id, speciality, ug_university, pg_university, appointment_date, designation, ug_year, pg_year)
SELECT id, 'Computer Science', 'Example University', 'Example University', '2020-01-15', 'Assistant Professor', '2010', '2012' FROM users WHERE email = 'teacher@example.com';

-- Insert sample admin notifications
INSERT INTO admin_notifications (created_at, severity, channel, status, title, message, entity_type, entity_id, actor) VALUES
(NOW(), 'INFO', 'IN_APP', 'UNREAD', 'Welcome to Smart Campus', 'System initialized successfully. All modules are operational.', 'SYSTEM', 'INIT', 'System'),
(NOW() - INTERVAL 1 DAY, 'SUCCESS', 'IN_APP', 'UNREAD', 'New User Registration', 'Student Alex Rodriguez has registered successfully.', 'USER', '3', 'System'),
(NOW() - INTERVAL 2 DAY, 'WARNING', 'IN_APP', 'READ', 'Classroom Maintenance', 'CR101 requires maintenance. Scheduled for next week.', 'CLASSROOM', 'CR101', 'Admin'),
(NOW() - INTERVAL 3 DAY, 'DANGER', 'IN_APP', 'READ', 'Exam Session Alert', 'Exam session E2024-1 is approaching deadline for subject registration.', 'EXAM_SESSION', '1', 'System');

-- Insert sample teacher notifications
INSERT INTO teacher_notifications (teacher_user_id, created_at, title, message, sender)
SELECT id, NOW(), 'Course Approved', 'Your course CSE101 has been approved by admin.', 'Admin' FROM users WHERE email = 'teacher@example.com'
UNION ALL
SELECT id, NOW() - INTERVAL 1 DAY, 'New Enrollment', '5 students enrolled in your CSE101 course.', 'System' FROM users WHERE email = 'teacher@example.com';

-- Insert sample student notifications
INSERT INTO student_notifications (student_user_id, created_at, title, message, sender)
SELECT id, NOW(), 'Welcome Student', 'Welcome to Smart Campus! Your account is active.', 'Admin' FROM users WHERE email = 'student@example.com'
UNION ALL
SELECT id, NOW() - INTERVAL 1 DAY, 'Course Enrollment', 'You have been enrolled in CSE101.', 'System' FROM users WHERE email = 'student@example.com';