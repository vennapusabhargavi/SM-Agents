import React, { useState } from "react";
import {
  HelpCircleIcon,
  BookOpenIcon,
  MessageCircleIcon,
  PlayCircleIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
  ExternalLinkIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LightbulbIcon,
} from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

type GuideItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  content?: string;
};

export default function TeacherHelp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      id: "attendance-1",
      question: "How do I mark attendance for my class?",
      answer: "Go to the Attendance → Attendance Marking section. Select your course, choose the date, and use the student list to mark present/absent status. You can also bulk mark entire classes.",
      category: "attendance",
    },
    {
      id: "grades-1",
      question: "How do I enter internal assessment marks?",
      answer: "Navigate to Internal Marks → Declare & Enter Marks. Select your course and assessment type, then enter marks for each student. The system will automatically calculate weightages.",
      category: "internal-marks",
    },
    {
      id: "courses-1",
      question: "Can I create new courses?",
      answer: "Yes, go to Course → Create Course. Fill in the course details, syllabus, and student enrollment. Your course will need approval from the academic office before becoming active.",
      category: "courses",
    },
    {
      id: "classroom-1",
      question: "How do I request a classroom for my lecture?",
      answer: "Use Classroom → Request Classroom. Select the date, time slot, and capacity needed. The system will show available rooms and automatically allocate based on availability.",
      category: "classroom",
    },
    {
      id: "notifications-1",
      question: "Why am I not receiving notifications?",
      answer: "Check your notification preferences in My Profile. Ensure your email and phone number are updated. You can also view all notifications in the Notifications section.",
      category: "general",
    },
    {
      id: "reports-1",
      question: "How do I generate student performance reports?",
      answer: "Go to Result → View Result Analysis. Select your course and use the filters to generate detailed performance analytics and downloadable reports.",
      category: "reports",
    },
    {
      id: "od-1",
      question: "How do I approve On-Duty requests from students?",
      answer: "Navigate to Attendance → OD Approval. Review submitted requests with supporting documents and approve/reject them. Approved OD will be marked in attendance records.",
      category: "attendance",
    },
    {
      id: "profile-1",
      question: "How do I update my profile information?",
      answer: "Click on My Profile and use the 'Edit Profile' button. You can update personal details, qualifications, and contact information. Changes require verification.",
      category: "general",
    },
  ];

  const guides: GuideItem[] = [
    {
      id: "getting-started",
      title: "Getting Started Guide",
      description: "Complete walkthrough for new faculty members",
      category: "basics",
      icon: <BookOpenIcon size={20} className="text-blue-600" />,
      content: "Learn the basics of navigating the Smart Campus system, setting up your profile, and understanding your dashboard.",
    },
    {
      id: "attendance-management",
      title: "Attendance Management",
      description: "Complete guide to marking and managing student attendance",
      category: "attendance",
      icon: <CheckCircleIcon size={20} className="text-green-600" />,
      content: "Step-by-step instructions for daily attendance marking, OD approval, and generating attendance reports.",
    },
    {
      id: "grade-entry",
      title: "Grade Entry & Weightage",
      description: "How to enter marks and manage assessment weightages",
      category: "internal-marks",
      icon: <FileTextIcon size={20} className="text-purple-600" />,
      content: "Detailed guide on entering internal assessment marks, calculating weightages, and ensuring compliance with university guidelines.",
    },
    {
      id: "course-creation",
      title: "Course Creation & Management",
      description: "Creating and managing course curricula",
      category: "courses",
      icon: <BookOpenIcon size={20} className="text-orange-600" />,
      content: "Learn how to create courses, manage syllabi, handle enrollments, and coordinate with other faculty.",
    },
    {
      id: "classroom-booking",
      title: "Classroom Booking System",
      description: "Requesting and managing classroom allocations",
      category: "classroom",
      icon: <ClockIcon size={20} className="text-teal-600" />,
      content: "Complete guide to the classroom booking system, conflict resolution, and facility management.",
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredGuides = guides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === "all" || guide.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "All Topics", count: faqs.length + guides.length },
    { id: "basics", label: "Getting Started", count: guides.filter(g => g.category === "basics").length },
    { id: "attendance", label: "Attendance", count: faqs.filter(f => f.category === "attendance").length + guides.filter(g => g.category === "attendance").length },
    { id: "internal-marks", label: "Internal Marks", count: faqs.filter(f => f.category === "internal-marks").length + guides.filter(g => g.category === "internal-marks").length },
    { id: "courses", label: "Courses", count: faqs.filter(f => f.category === "courses").length + guides.filter(g => g.category === "courses").length },
    { id: "classroom", label: "Classroom", count: faqs.filter(f => f.category === "classroom").length + guides.filter(g => g.category === "classroom").length },
    { id: "general", label: "General", count: faqs.filter(f => f.category === "general").length },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Help & Documentation
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Find answers, guides, and support for using the Smart Campus system
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search help topics, FAQs, guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition",
              activeCategory === category.id
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {category.label} ({category.count})
          </button>
        ))}
      </div>

      {/* Guides Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <LightbulbIcon size={24} className="text-yellow-500" />
          Quick Guides
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuides.map((guide) => (
            <div key={guide.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                  {guide.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {guide.description}
                  </p>
                </div>
              </div>
              <button className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-50 py-2 px-4 rounded-lg text-sm font-medium transition">
                Read Guide
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <HelpCircleIcon size={24} className="text-blue-500" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {filteredFAQs.map((faq) => (
            <div key={faq.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  {faq.question}
                </span>
                {expandedFAQ === faq.id ? (
                  <ChevronDownIcon size={20} className="text-slate-500 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon size={20} className="text-slate-500 flex-shrink-0" />
                )}
              </button>

              {expandedFAQ === faq.id && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-3">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <AlertCircleIcon size={20} className="text-orange-500" />
          Need More Help?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Contact Information</h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <PhoneIcon size={16} />
                <span>Technical Support: +91-123-456-7890</span>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon size={16} />
                <span>Email: support@smartcampus.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon size={16} />
                <span>Available: Mon-Fri, 9:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition">
                Submit Support Ticket
              </button>
              <button className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition">
                Schedule Training Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
