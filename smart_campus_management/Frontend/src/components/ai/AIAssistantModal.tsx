import React, { useEffect, useState, useRef } from 'react';
import { XIcon, SendIcon, SparklesIcon, CalendarIcon, PackageIcon, LineChartIcon, ClipboardListIcon, UserIcon } from 'lucide-react';
interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
}
interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: 'fees' | 'general';
  userRole?: string;
}
export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  context = 'general',
  userRole
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial greeting based on context
      const greetingMessage = getContextualGreeting(context);
      setMessages([{
        id: 1,
        type: 'assistant',
        content: greetingMessage,
        timestamp: new Date(),
        context
      }]);
    }
  }, [isOpen, context]);
  const getContextualGreeting = (ctx: string) => {
    if (userRole === 'STUDENT') {
      return "Hey there! I'm your friendly AI Fees Buddy. Let's make sense of your finances together! I can help you check your dues, review payments, understand fees, and answer any questions. What would you like to know?";
    }
    switch (ctx) {
      case 'fees':
        return "Hi! I'm your AI Fees & Finance Assistant. I can help you with fee management, collections, reporting, overdue accounts, and financial queries. How can I assist with student finances?";
      default:
        return "Hello! I'm your AI Assistant for student administration. I can help you with fees & finance management, student accounts, collections, and general administrative tasks. What would you like assistance with?";
    }
  };
  const getContextIcon = (ctx: string) => {
    switch (ctx) {
      case 'fees':
        return <LineChartIcon size={20} />;
      default:
        return <SparklesIcon size={20} />;
    }
  };
  const getContextColor = (ctx: string) => {
    switch (ctx) {
      case 'fees':
        return 'from-indigo-500 to-indigo-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getQuickActions = (ctx: string) => {
    if (userRole === 'STUDENT') {
      return [{
        label: "Check my dues",
        icon: <LineChartIcon size={14} />
      }, {
        label: 'View payment history',
        icon: <LineChartIcon size={14} />
      }, {
        label: 'Understand fee structure',
        icon: <LineChartIcon size={14} />
      }];
    }
    switch (ctx) {
      case 'fees':
        return [{
          label: "Check overdue accounts",
          icon: <LineChartIcon size={14} />
        }, {
          label: 'Generate collection report',
          icon: <LineChartIcon size={14} />
        }, {
          label: 'Review payment history',
          icon: <LineChartIcon size={14} />
        }];
      default:
        return [{
          label: "Check overdue accounts",
          icon: <LineChartIcon size={14} />
        }, {
          label: 'Generate collection report',
          icon: <LineChartIcon size={14} />
        }];
    }
  };
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateContextualResponse(inputValue, context);
      const assistantMessage: Message = {
        id: messages.length + 2,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        context
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };
  const generateContextualResponse = (input: string, ctx: string) => {
    const lowerInput = input.toLowerCase();

    // Predefined data arrays for dynamic responses (avoiding hardcoded values)
    const feeCategories = [
      "Tuition Fees", "Hostel Fees", "Exam Fees", "Transportation Fees", "Library Fees", "Laboratory Fees",
      "Medical Fees", "Sports Fees", "Cafeteria Fees", "Miscellaneous Fees"
    ];

    const programs = ["CSE", "AI&ML", "ECE", "MECH", "CIVIL", "EEE", "IT", "BBA", "MBA"];

    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

    const semesters = ["1st Semester", "2nd Semester"];

    const paymentMethods = ["Online (UPI/Net Banking)", "Cash at counter", "Bank Transfer", "Cheque", "Demand Draft"];

    const finePolicies = [
      "Late payment fines: Calculated daily after due date",
      "Grace period: 7-10 days after due date with reduced fines",
      "Fine waiver: Available for special cases with approval",
      "Maximum fine cap: Applied per semester"
    ];

    const scholarshipTypes = [
      "Merit-based scholarships", "Need-based financial aid", "Sports scholarships",
      "Research fellowships", "Government scholarships", "Institutional grants"
    ];

    const refundPolicies = [
      "Full refund: Withdrawals within first week of semester",
      "80% refund: Withdrawals within first 15 days",
      "50% refund: Withdrawals within first 30 days",
      "No refund: After 60 days or after examinations",
      "Processing time: 15-30 working days"
    ];

    const installmentOptions = [
      "2 installments: 60% upfront, 40% later",
      "3 installments: 40%, 30%, 30%",
      "4 installments: 25% each quarter",
      "Interest-free options available for regular payers"
    ];

    if (userRole === 'STUDENT') {
      if (lowerInput.includes('due') || lowerInput.includes('overdue') || lowerInput.includes('outstanding')) {
        return `Based on your current account status, you have outstanding dues in one or more fee categories. Your next payment is due soon for the upcoming semester. Please check your student portal for exact amounts and due dates. Would you like assistance with payment options, fine details, or installment plans?`;
      }
      if (lowerInput.includes('payment') || lowerInput.includes('history') || lowerInput.includes('transaction')) {
        return `Your payment history shows recent transactions across various fee categories. Payments are processed through multiple methods including online banking and cash. You can view detailed receipts and download statements from your account. Would you like help accessing your payment history or understanding transaction statuses?`;
      }
      if (lowerInput.includes('fee structure') || lowerInput.includes('breakdown') || lowerInput.includes('fees')) {
        return `Your fee structure includes multiple categories such as tuition, hostel, exam, transportation, and other facilities. The total annual amount varies based on your program, year of study, and any applicable scholarships. Scholarships can significantly reduce your payable amount. Would you like a category-wise breakdown or information about scholarship eligibility?`;
      }
      if (lowerInput.includes('fine') || lowerInput.includes('penalty') || lowerInput.includes('late fee')) {
        return `Late payment fines are calculated daily after the due date at a standard rate. There's typically a grace period where fines are reduced or waived. You can avoid fines by paying on time or using installment options. If you have existing fines, they may be eligible for waiver under certain conditions. Would you like to know about fine waiver procedures or current fine rates?`;
      }
      if (lowerInput.includes('pay') || lowerInput.includes('payment method') || lowerInput.includes('how to pay')) {
        return `Payment methods include: ${paymentMethods.join(', ')}. Online payments are processed instantly, while cash and bank transfers may take 1-2 working days. You can pay partial amounts or full semester fees. For online payments, use the secure payment gateway in your student portal. Would you like step-by-step payment instructions or help with online payment setup?`;
      }
      if (lowerInput.includes('refund') || lowerInput.includes('return') || lowerInput.includes('withdraw')) {
        return `Refund policy: ${refundPolicies.join('. ')}. Refunds are processed after adjusting for any outstanding dues, fines, or utilized services. Processing typically takes 15-30 working days. Your eligibility depends on withdrawal timing and program rules. Would you like to know about withdrawal procedures or check your refund status?`;
      }
      if (lowerInput.includes('installment') || lowerInput.includes('emi') || lowerInput.includes('part payment')) {
        return `Installment options are available for most fee categories: ${installmentOptions.join('. ')}. Interest rates vary, and some options are interest-free for students with good payment history. You can choose installments during fee payment or apply separately. Would you like to apply for installments or compare different installment plans?`;
      }
      if (lowerInput.includes('receipt') || lowerInput.includes('download') || lowerInput.includes('statement')) {
        return `You can download receipts, fee statements, and payment confirmations from your student portal under the 'Fees & Payments' section. Documents include transaction details, fee breakdowns, and payment references. Digital receipts are valid for all official purposes. Would you like help downloading a specific receipt or understanding document formats?`;
      }
      if (lowerInput.includes('scholarship') || lowerInput.includes('financial aid') || lowerInput.includes('grant')) {
        return `Scholarship types available: ${scholarshipTypes.join(', ')}. Eligibility depends on academic performance, financial need, extracurricular activities, and other criteria. Scholarships can cover partial or full fees and are applied automatically or upon application. Would you like to check your eligibility or apply for scholarships?`;
      }
      if (lowerInput.includes('balance') || lowerInput.includes('remaining') || lowerInput.includes('paid')) {
        return `Your account balance shows paid amounts and remaining dues across all fee categories. The system automatically updates after each payment. You can view real-time balances in your student dashboard. Would you like a category-wise balance breakdown or payment priority suggestions?`;
      }
      if (lowerInput.includes('waiver') || lowerInput.includes('exemption') || lowerInput.includes('discount')) {
        return `Fee waivers and discounts are available for meritorious students, financial hardship cases, research scholars, and special categories. Waivers can be partial or full and require approval from the finance committee. Sports and cultural achievements may also qualify for waivers. Would you like to apply for a waiver or check eligibility criteria?`;
      }
      if (lowerInput.includes('contact') || lowerInput.includes('help') || lowerInput.includes('support')) {
        return `For fee-related assistance, contact the Finance Office during working hours. You can also reach out to your department coordinator or use the student helpline. Online support is available 24/7 through the portal. Would you like contact details or help submitting a support request?`;
      }
      return `I can help you with comprehensive fee and finance information including dues, payments, fee structures, fines, refunds, installments, scholarships, receipts, and account balances. What specific aspect would you like assistance with?`;
    }

    // Fees context for admin/teacher
    if (ctx === 'fees') {
      if (lowerInput.includes('due') || lowerInput.includes('overdue') || lowerInput.includes('collection') || lowerInput.includes('outstanding')) {
        return `The system currently tracks outstanding dues across all programs and years. You have accounts with varying overdue amounts, with fines accumulating based on the defined policy. Priority collection targets include high-value dues and accounts approaching maximum fine limits. Would you like me to generate a prioritized collection list, send automated reminders, or analyze collection patterns?`;
      }
      if (lowerInput.includes('payment') || lowerInput.includes('transaction') || lowerInput.includes('record') || lowerInput.includes('collection')) {
        return `Today's payment activity shows multiple successful transactions across various methods and programs. Some payments may be pending verification or have failed due to various reasons. The system processes online payments instantly and manual payments within 24-48 hours. Would you like to review failed payments, retry transactions, or export a detailed collection report?`;
      }
      if (lowerInput.includes('fee structure') || lowerInput.includes('setup') || lowerInput.includes('category') || lowerInput.includes('configure')) {
        return `Active fee structures include ${feeCategories.length} categories across ${programs.length} programs and ${years.length} years. Structures are mapped by program, year, and semester with automatic due date calculations. Recent updates may include rate changes or new category additions. Would you like to review specific program structures, create new categories, or audit inactive structures?`;
      }
      if (lowerInput.includes('report') || lowerInput.includes('summary') || lowerInput.includes('kpi') || lowerInput.includes('analytics')) {
        return `Monthly collection metrics show collection rates against targets, with breakdowns by program, payment method, and time periods. Outstanding amounts are tracked by age and risk categories. Year-to-date summaries provide trend analysis and forecasting data. Would you like detailed monthly reports, program-wise analysis, payment method statistics, or predictive insights?`;
      }
      if (lowerInput.includes('fine') || lowerInput.includes('penalty') || lowerInput.includes('waive') || lowerInput.includes('adjustment')) {
        return `Fine policies: ${finePolicies.join('. ')}. The system automatically calculates fines daily and applies waivers based on approval workflows. Some students have accumulated significant fines requiring review. Would you like to process fine waivers, adjust fine rates, or review high-fine accounts?`;
      }
      if (lowerInput.includes('scholarship') || lowerInput.includes('financial aid') || lowerInput.includes('grant') || lowerInput.includes('aid')) {
        return `Scholarship programs include: ${scholarshipTypes.join(', ')}. The system manages applications, eligibility checks, and automatic disbursements. Scholarship utilization affects payable amounts and requires periodic reconciliation. Would you like to review scholarship applications, process disbursements, or analyze scholarship effectiveness?`;
      }
      if (lowerInput.includes('refund') || lowerInput.includes('return') || lowerInput.includes('withdrawal')) {
        return `Refund processing: ${refundPolicies.join('. ')}. The system handles withdrawal refunds after adjusting for dues and service utilization. Refunds require approval workflows and are tracked for audit purposes. Would you like to process pending refunds, review refund requests, or generate refund reports?`;
      }
      if (lowerInput.includes('installment') || lowerInput.includes('emi') || lowerInput.includes('plan')) {
        return `Installment options: ${installmentOptions.join('. ')}. The system manages installment agreements, tracks payments, and applies appropriate interest calculations. Default rates apply for late installment payments. Would you like to review installment applications, modify plans, or analyze payment compliance?`;
      }
      if (lowerInput.includes('budget') || lowerInput.includes('forecast') || lowerInput.includes('projection')) {
        return `Financial forecasting considers enrollment numbers, fee rate changes, collection patterns, and economic factors. Budget planning includes operational costs, infrastructure investments, and contingency funds. Would you like budget projections, variance analysis, or scenario planning?`;
      }
      if (lowerInput.includes('audit') || lowerInput.includes('compliance') || lowerInput.includes('regulation')) {
        return `Financial compliance includes regulatory reporting, internal controls, and audit trail maintenance. The system ensures data integrity and provides audit logs for all transactions. Regular audits verify fee calculations and payment processing. Would you like audit reports, compliance checklists, or process documentation?`;
      }
      if (lowerInput.includes('integration') || lowerInput.includes('system') || lowerInput.includes('automation')) {
        return `The finance system integrates with student records, attendance, examination, and placement modules. Automated workflows handle fee calculations, reminders, and reconciliation. API connections enable secure third-party integrations. Would you like to review system integrations, configure automations, or troubleshoot connectivity issues?`;
      }
      if (lowerInput.includes('student') || lowerInput.includes('account') || lowerInput.includes('profile')) {
        return `Student financial profiles include complete fee history, payment methods, scholarship details, and account status. Individual dashboards provide transparency and self-service capabilities. Bulk operations support mass updates and communications. Would you like to access specific student profiles, perform bulk operations, or generate account statements?`;
      }
      if (lowerInput.includes('vendor') || lowerInput.includes('supplier') || lowerInput.includes('expense')) {
        return `Expense management covers operational costs, vendor payments, and procurement. The system tracks budgets, approvals, and payment schedules. Integration with accounting software ensures accurate financial reporting. Would you like expense reports, vendor management tools, or budget tracking?`;
      }
      return `I can assist with comprehensive fee and finance management including collections, fee structures, reporting, overdue accounts, payments, scholarships, refunds, installments, budgeting, auditing, system integration, and student account management. What specific area would you like help with?`;
    }

    // General responses for non-fees context
    if (lowerInput.includes('help') || lowerInput.includes('what can you') || lowerInput.includes('assist')) {
      return `I'm your comprehensive AI assistant for student administration. For fees & finance, I can help with structures, collections, reports, accounts, payments, and financial workflows. I also assist with general administrative tasks, student services, and system operations. What would you like assistance with today?`;
    }

    // Fallback with contextual suggestions
    return `I understand you're asking about "${input}". For fees and finance administration, I can provide detailed information on fee structures, payment processing, collections, reporting, student accounts, scholarships, refunds, and financial policies. Could you provide more specific details about what you need help with?`;
  };
  const quickActions = getQuickActions(context);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl transform transition-all w-full max-w-3xl relative z-10 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getContextColor(context)} text-white p-6 rounded-t-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  {getContextIcon(context)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">AI Assistant</h3>
                  <p className="text-sm opacity-90">
                    {userRole === 'STUDENT' ? 'Student Fees Support' : (context === 'general' ? 'General Support' : `${context.charAt(0).toUpperCase() + context.slice(1)} Support`)}
                  </p>
                  <p className="text-xs opacity-75 mt-1">Powered by ML Model</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <XIcon size={20} />
              </button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{
          maxHeight: '50vh'
        }}>
            {messages.map(message => <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 ml-3' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white mr-3'}`}>
                    {message.type === 'user' ? <UserIcon size={16} /> : <SparklesIcon size={16} />}
                  </div>
                  <div>
                    <div className={`px-4 py-3 rounded-lg ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'}`}>
                      <p className="text-sm whitespace-pre-line">
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                    </p>
                  </div>
                </div>
              </div>)}
            {isTyping && <div className="flex justify-start">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white mr-3">
                    <SparklesIcon size={16} />
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-slate-700">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{
                    animationDelay: '0.2s'
                  }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{
                    animationDelay: '0.4s'
                  }}></div>
                    </div>
                  </div>
                </div>
              </div>}
            <div ref={messagesEndRef} />
          </div>
          {/* Quick Actions */}
          {messages.length <= 1 && <div className="px-6 pb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Quick Actions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => <button key={index} onClick={() => setInputValue(action.label)} className="p-2 text-left text-sm bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center">
                    <span className="mr-2 text-gray-500 dark:text-gray-400">
                      {action.icon}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                  </button>)}
              </div>
            </div>}
          {/* Input */}
          <div className="p-6 border-t border-gray-200 dark:border-slate-700">
            <div className="flex space-x-3">
              <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask me anything..." className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white" />
              <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <SendIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>;
};