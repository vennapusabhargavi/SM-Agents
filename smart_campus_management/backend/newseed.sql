-- New seed data for teacher frontend dummy data

-- Insert teachers
INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES
('Dr. John Smith', 'john.smith@university.edu', '$2b$10$dummy', 'FACULTY', 1),
('Prof. Jane Doe', 'jane.doe@university.edu', '$2b$10$dummy', 'FACULTY', 1);

-- Insert user_profiles for faculty
INSERT INTO user_profiles (user_id, reg_no, department, mobile) VALUES
(1, 'FAC001', 'Computer Science', '1234567890'),
(2, 'FAC002', 'Computer Science', '0987654321');

-- Insert faculty_profiles
INSERT INTO faculty_profiles (user_id) VALUES
(1),
(2);

-- Insert students
INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES
('Alice Johnson', 'alice.johnson@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Bob Smith', 'bob.smith@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Charlie Brown', 'charlie.brown@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Diana Prince', 'diana.prince@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Eve Wilson', 'eve.wilson@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Frank Miller', 'frank.miller@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Grace Lee', 'grace.lee@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Henry Wilson', 'henry.wilson@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Isabella Garcia', 'isabella.garcia@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Jack Brown', 'jack.brown@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Katherine Davis', 'katherine.davis@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Liam Martinez', 'liam.martinez@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Mia Rodriguez', 'mia.rodriguez@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Noah Lopez', 'noah.lopez@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Olivia Gonzalez', 'olivia.gonzalez@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Parker Anderson', 'parker.anderson@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Quinn Thompson', 'quinn.thompson@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Riley White', 'riley.white@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Sophia Harris', 'sophia.harris@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Tyler Clark', 'tyler.clark@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Uma Lewis', 'uma.lewis@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Victor Walker', 'victor.walker@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Wendy Hall', 'wendy.hall@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Xander Young', 'xander.young@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Yara King', 'yara.king@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Zane Zimmer', 'zane.zimmer@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Abby Moore', 'abby.moore@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Ben Taylor', 'ben.taylor@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Cathy Wilson', 'cathy.wilson@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('David Brown', 'david.brown@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Emma Davis', 'emma.davis@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Felix Evans', 'felix.evans@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Hugo Green', 'hugo.green@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Iris Hill', 'iris.hill@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Jara Ingram', 'jara.ingram@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Kara Jones', 'kara.jones@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Maya Lopez', 'maya.lopez@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Noah Nelson', 'noah.nelson@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Piers Owen', 'piers.owen@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Rachel Quinn', 'rachel.quinn@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Samuel Reed', 'samuel.reed@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Tina Scott', 'tina.scott@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Ursula Taylor', 'ursula.taylor@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Victor Underwood', 'victor.underwood@student.edu', '$2b$10$dummy', 'STUDENT', 1),
('Wendy Vaughn', 'wendy.vaughn@student.edu', '$2b$10$dummy', 'STUDENT', 1);

-- Insert user_profiles for students
INSERT INTO user_profiles (user_id, reg_no, department, program, year_of_study, semester, cgpa, arrears, fee_clear, mobile) VALUES
(3, '19221314', 'Computer Science', 'B.Tech CSE', '1', 1, 8.5, 0, 1, NULL),
(4, '19221315', 'Computer Science', 'B.Tech CSE', '2', 3, 7.8, 1, 1, NULL),
(5, '19231316', 'Computer Science', 'B.Tech CSE', '3', 5, 9.0, 0, 1, NULL),
(6, '19221317', 'Computer Science', 'B.Tech CSE', '1', 1, 8.2, 0, 1, NULL),
(7, '19231318', 'Computer Science', 'B.Tech CSE', '2', 3, 7.5, 0, 1, NULL),
(8, 'CS006', 'Computer Science', 'B.Tech CSE', '3', 5, 8.8, 0, 1, NULL),
(9, 'CS007', 'Computer Science', 'B.Tech CSE', '1', 1, 8.0, 0, 1, NULL),
(10, 'CS008', 'Computer Science', 'B.Tech CSE', '2', 3, 8.5, 0, 1, NULL),
(11, 'CS009', 'Computer Science', 'B.Tech CSE', '3', 5, 9.2, 0, 1, NULL),
(12, 'CS010', 'Computer Science', 'B.Tech CSE', '4', 7, 8.9, 0, 1, NULL),
(13, 'CS011', 'Computer Science', 'B.Tech CSE', '1', 1, 7.9, 0, 1, NULL),
(14, 'CS012', 'Computer Science', 'B.Tech CSE', '2', 3, 8.3, 0, 1, NULL),
(15, 'CS013', 'Computer Science', 'B.Tech CSE', '3', 5, 8.7, 0, 1, NULL),
(16, 'CS014', 'Computer Science', 'B.Tech CSE', '4', 7, 9.1, 0, 1, NULL),
(17, 'CS015', 'Computer Science', 'B.Tech CSE', '1', 1, 8.1, 0, 1, NULL),
(18, 'CS016', 'Computer Science', 'B.Tech CSE', '2', 3, 7.6, 0, 1, NULL),
(19, 'CS017', 'Computer Science', 'B.Tech CSE', '3', 5, 8.4, 0, 1, NULL),
(20, 'CS018', 'Computer Science', 'B.Tech CSE', '1', 1, 8.6, 0, 1, NULL),
(21, 'CS019', 'Computer Science', 'B.Tech CSE', '2', 3, 8.8, 0, 1, NULL),
(22, 'CS020', 'Computer Science', 'B.Tech CSE', '3', 5, 9.0, 0, 1, NULL),
(23, 'CS021', 'Computer Science', 'B.Tech CSE', '1', 1, 7.7, 0, 1, NULL),
(24, 'CS022', 'Computer Science', 'B.Tech CSE', '2', 3, 8.2, 0, 1, NULL),
(25, 'CS023', 'Computer Science', 'B.Tech CSE', '3', 5, 8.9, 0, 1, NULL),
(26, 'CS024', 'Computer Science', 'B.Tech CSE', '1', 1, 8.3, 0, 1, NULL),
(27, 'CS025', 'Computer Science', 'B.Tech CSE', '2', 3, 7.4, 0, 1, NULL),
(28, 'CS026', 'Computer Science', 'B.Tech CSE', '3', 5, 8.6, 0, 1, NULL),
(29, 'CS027', 'Computer Science', 'B.Tech CSE', '4', 7, 9.3, 0, 1, NULL),
(30, 'CS028', 'Computer Science', 'B.Tech CSE', '2', 3, 8.0, 0, 1, NULL),
(31, 'CS029', 'Computer Science', 'B.Tech CSE', '3', 5, 8.5, 0, 1, NULL),
(32, 'CS030', 'Computer Science', 'B.Tech CSE', '1', 1, 7.8, 0, 1, NULL),
(33, 'CS031', 'Computer Science', 'B.Tech CSE', '4', 7, 8.7, 0, 1, NULL),
(34, 'CS032', 'Computer Science', 'B.Tech CSE', '2', 3, 8.1, 0, 1, NULL),
(35, 'CS033', 'Computer Science', 'B.Tech CSE', '3', 5, 8.4, 0, 1, NULL),
(36, 'CS034', 'Computer Science', 'B.Tech CSE', '1', 1, 8.9, 0, 1, NULL),
(37, 'CS035', 'Computer Science', 'B.Tech CSE', '2', 3, 7.5, 0, 1, NULL),
(38, 'CS036', 'Computer Science', 'B.Tech CSE', '3', 5, 8.8, 0, 1, NULL),
(39, 'CS037', 'Computer Science', 'B.Tech CSE', '1', 1, 8.2, 0, 1, NULL),
(40, 'CS038', 'Computer Science', 'B.Tech CSE', '2', 3, 7.9, 0, 1, NULL),
(41, 'CS039', 'Computer Science', 'B.Tech CSE', '3', 5, 9.0, 0, 1, NULL),
(42, 'CS040', 'Computer Science', 'B.Tech CSE', '1', 1, 8.4, 0, 1, NULL),
(43, 'CS041', 'Computer Science', 'B.Tech CSE', '2', 3, 8.6, 0, 1, NULL),
(44, 'CS042', 'Computer Science', 'B.Tech CSE', '3', 5, 8.3, 0, 1, NULL),
(45, 'CS043', 'Computer Science', 'B.Tech CSE', '4', 7, 9.2, 0, 1, NULL),
(46, 'CS044', 'Computer Science', 'B.Tech CSE', '2', 3, 8.7, 0, 1, NULL),
(47, 'CS045', 'Computer Science', 'B.Tech CSE', '3', 5, 8.1, 0, 1, NULL);


-- Insert courses
INSERT INTO course_catalog (code, name, program, semester) VALUES
('CS101', 'Introduction to Computer Science', 'B.Tech CSE', 1),
('CS102', 'Data Structures', 'B.Tech CSE', 3),
('CS103', 'Algorithms', 'B.Tech CSE', 5),
('CS104', 'Database Systems', 3, 'B.Tech CSE'),
('CS105', 'Operating Systems', 5, 'B.Tech CSE'),
('CS106', 'Computer Networks', 3, 'B.Tech CSE'),
('CS107', 'Software Engineering', 1, 'B.Tech CSE'),
('CS108', 'Database Management', 3, 'B.Tech CSE'),
('CS109', 'Web Development', 5, 'B.Tech CSE'),
('CS110', 'Machine Learning', 4, 'B.Tech CSE'),
('CS111', 'Artificial Intelligence', 1, 'B.Tech CSE'),
('CS112', 'Cyber Security', 3, 'B.Tech CSE'),
('CS113', 'Cloud Computing', 5, 'B.Tech CSE'),
('CS114', 'Big Data', 4, 'B.Tech CSE'),
('CS115', 'Mobile App Development', 1, 'B.Tech CSE'),
('CS116', 'Game Development', 3, 'B.Tech CSE'),
('CS117', 'Data Mining', 5, 'B.Tech CSE'),
('CS118', 'Blockchain Technology', 1, 'B.Tech CSE'),
('CS119', 'Quantum Computing', 3, 'B.Tech CSE'),
('CS120', 'IoT Systems', 5, 'B.Tech CSE'),
('CS121', 'Compiler Design', 1, 'B.Tech CSE'),
('CS122', 'Parallel Computing', 3, 'B.Tech CSE'),
('CS123', 'Human-Computer Interaction', 5, 'B.Tech CSE'),
('CS124', 'Software Testing', 1, 'B.Tech CSE'),
('CS125', 'Information Retrieval', 3, 'B.Tech CSE'),
('CS126', 'Natural Language Processing', 5, 'B.Tech CSE'),
('CS127', 'Computer Vision', 4, 'B.Tech CSE'),
('CS128', 'Robotics', 3, 'B.Tech CSE'),
('CS129', 'Ethical Hacking', 5, 'B.Tech CSE'),
('CS130', 'Augmented Reality', 1, 'B.Tech CSE'),
('CS131', 'Virtual Reality', 4, 'B.Tech CSE'),
('CS132', 'Embedded Systems', 3, 'B.Tech CSE'),
('CS133', 'Digital Signal Processing', 5, 'B.Tech CSE'),
('CS134', 'Microprocessors', 1, 'B.Tech CSE'),
('CS135', 'Analog Electronics', 2, 'B.Tech CSE'),
('CS136', 'Power Systems', 3, 'B.Tech CSE'),
('CS137', 'Control Systems', 5, 'B.Tech CSE'),
('CS138', 'Renewable Energy', 1, 'B.Tech CSE'),
('CS139', 'Biomedical Engineering', 3, 'B.Tech CSE'),
('CS140', 'Nanotechnology', 1, 'B.Tech CSE'),
('CS141', 'Materials Science', 3, 'B.Tech CSE'),
('CS142', 'Aerospace Engineering', 5, 'B.Tech CSE'),
('CS143', 'Marine Engineering', 4, 'B.Tech CSE'),
('CS144', 'Petroleum Engineering', 3, 'B.Tech CSE'),
('CS145', 'Geotechnical Engineering', 5, 'B.Tech CSE'),
('CS146', 'Structural Engineering', 1, 'B.Tech CSE'),
('CS147', 'Urban Planning', 2, 'B.Tech CSE'),
('CS148', 'Environmental Engineering', 3, 'B.Tech CSE'),
('CS149', 'Water Resources', 5, 'B.Tech CSE'),
('CS150', 'Transportation Engineering', 1, 'B.Tech CSE');

-- Insert course enrollments for attendance
INSERT INTO course_enrollments (student_user_id, course_id, term_year, term_name) VALUES
(3, 1, 2026, 'Odd'),
(4, 2, 2026, 'Odd'),
(5, 3, 2026, 'Odd'),
(6, 4, 2026, 'Odd'),
(7, 5, 2026, 'Odd'),
(8, 6, 2026, 'Odd'),
(9, 7, 2026, 'Odd'),
(10, 8, 2026, 'Odd'),
(11, 9, 2026, 'Odd'),
(12, 10, 2026, 'Odd'),
(13, 11, 2026, 'Odd'),
(14, 12, 2026, 'Odd'),
(15, 13, 2026, 'Odd'),
(16, 14, 2026, 'Odd'),
(17, 15, 2026, 'Odd'),
(18, 16, 2026, 'Odd');

-- Insert internal marks for students
INSERT INTO student_internal_marks (student_user_id, course_code, course_name, test_name, mark, max_mark, dated_on) VALUES
(3, 'CS101', 'Introduction to Computer Science', 'Level 1', 85, 100, CURDATE()),
(3, 'CS101', 'Introduction to Computer Science', 'Level 2', 90, 100, CURDATE()),
(3, 'CS101', 'Introduction to Computer Science', 'Level 3', 88, 100, CURDATE()),
(3, 'CS101', 'Introduction to Computer Science', 'Assignment', 92, 100, CURDATE()),
(3, 'CS101', 'Introduction to Computer Science', 'Viva', 87, 100, CURDATE()),
(3, 'CS101', 'Introduction to Computer Science', 'Debug', 80, 100, CURDATE()),
(3, 'CS101', 'Introduction to Computer Science', 'Class Practical', 85, 100, CURDATE()),
(3, 'CS101', 'Introduction to Computer Science', 'Capstone Project', 90, 100, CURDATE()),
(4, 'CS102', 'Data Structures', 'Level 1', 78, 100, CURDATE()),
(4, 'CS102', 'Data Structures', 'Level 2', 82, 100, CURDATE()),
(4, 'CS102', 'Data Structures', 'Level 3', 85, 100, CURDATE()),
(4, 'CS102', 'Data Structures', 'Assignment', 88, 100, CURDATE()),
(4, 'CS102', 'Data Structures', 'Viva', 80, 100, CURDATE()),
(4, 'CS102', 'Data Structures', 'Debug', 75, 100, CURDATE()),
(4, 'CS102', 'Data Structures', 'Class Practical', 78, 100, CURDATE()),
(4, 'CS102', 'Data Structures', 'Capstone Project', 82, 100, CURDATE()),
(5, 'CS103', 'Algorithms', 'Level 1', 92, 100, CURDATE()),
(5, 'CS103', 'Algorithms', 'Level 2', 95, 100, CURDATE()),
(5, 'CS103', 'Algorithms', 'Level 3', 90, 100, CURDATE()),
(5, 'CS103', 'Algorithms', 'Assignment', 96, 100, CURDATE()),
(5, 'CS103', 'Algorithms', 'Viva', 93, 100, CURDATE()),
(5, 'CS103', 'Algorithms', 'Debug', 88, 100, CURDATE()),
(5, 'CS103', 'Algorithms', 'Class Practical', 92, 100, CURDATE()),
(5, 'CS103', 'Algorithms', 'Capstone Project', 95, 100, CURDATE());

-- Insert attendance data for students
INSERT INTO student_attendance_records (student_user_id, course_code, course_name, class_attended, attended_hours, total_class, total_hours) VALUES
(3, 'CS101', 'Introduction to Computer Science', 8, 16, 10, 20),
(3, 'CS102', 'Data Structures', 7, 14, 10, 20),
(3, 'CS103', 'Algorithms', 9, 18, 10, 20),
(4, 'CS101', 'Introduction to Computer Science', 8, 16, 10, 20),
(4, 'CS102', 'Data Structures', 7, 14, 10, 20),
(4, 'CS103', 'Algorithms', 9, 18, 10, 20),
(5, 'CS101', 'Introduction to Computer Science', 8, 16, 10, 20),
(5, 'CS102', 'Data Structures', 7, 14, 10, 20),
(5, 'CS103', 'Algorithms', 9, 18, 10, 20),
(6, 'CS101', 'Introduction to Computer Science', 8, 16, 10, 20),
(6, 'CS102', 'Data Structures', 7, 14, 10, 20),
(6, 'CS103', 'Algorithms', 9, 18, 10, 20),
(7, 'CS101', 'Introduction to Computer Science', 8, 16, 10, 20),
(7, 'CS102', 'Data Structures', 7, 14, 10, 20),
(7, 'CS103', 'Algorithms', 9, 18, 10, 20);

-- Insert notifications for teacher dashboard notices
INSERT INTO teacher_notifications (teacher_user_id, created_at, title, message, sender, has_download, download_url, status) VALUES
(1, '2025-12-26 00:00:00', 'Exam Schedule Update', 'Exam schedule updated. Please ensure student communication is completed before 6 PM today.', 'SYSTEM', 0, NULL, 'UNREAD'),
(1, '2025-12-22 00:00:00', 'Internal Marks Submission', 'Internal marks submission window closes tomorrow. Verify the course mapping before submission.', 'SYSTEM', 0, NULL, 'UNREAD'),
(1, '2025-12-19 00:00:00', 'New Course Enrollment Requests', 'New course enrollment requests are available for review under Course Approval.', 'SYSTEM', 0, NULL, 'UNREAD');

-- Course faculty assignments removed as table does not exist in schema

-- Additional attendance for more courses
INSERT INTO student_attendance_records (student_user_id, course_code, course_name, class_attended, attended_hours, total_class, total_hours) VALUES
(3, 'CS104', 'Database Systems', 9, 18, 10, 20),
(3, 'CS105', 'Operating Systems', 8, 16, 10, 20),
(4, 'CS104', 'Database Systems', 7, 14, 10, 20),
(4, 'CS105', 'Operating Systems', 9, 18, 10, 20),
(5, 'CS104', 'Database Systems', 8, 16, 10, 20),
(5, 'CS105', 'Operating Systems', 7, 14, 10, 20),
(6, 'CS104', 'Database Systems', 9, 18, 10, 20),
(6, 'CS105', 'Operating Systems', 8, 16, 10, 20),
(7, 'CS104', 'Database Systems', 7, 14, 10, 20),
(7, 'CS105', 'Operating Systems', 9, 18, 10, 20);

-- Additional course enrollments
INSERT INTO course_enrollments (student_user_id, course_id, term_year, term_name) VALUES
(3, 4, 2026, 'Odd'),
(3, 5, 2026, 'Odd'),
(4, 4, 2026, 'Odd'),
(4, 5, 2026, 'Odd'),
(5, 4, 2026, 'Odd'),
(5, 5, 2026, 'Odd'),
(6, 4, 2026, 'Odd'),
(6, 5, 2026, 'Odd'),
(7, 4, 2026, 'Odd'),
(7, 5, 2026, 'Odd'),
(8, 6, 2026, 'Even'),
(9, 7, 2026, 'Even'),
(10, 8, 2026, 'Even'),
(11, 9, 2026, 'Even'),
(12, 10, 2026, 'Even');

-- Removed inserts for tables not in schema_for_agents.sql

-- Note: Course approval requests, no due requests, etc., may need additional tables or assumptions, but for dummy, this should suffice.