

export type LeadStatus = 'New' | 'Contacted' | 'Demo Scheduled' | 'Converted' | 'Closed';
export type StudentStatus = 'Active' | 'Inactive';
export type SessionStatus = 
  | 'Scheduled' 
  | 'Completed' 
  | 'Canceled' 
  | 'Student No Show' 
  | 'Teacher No Show'
  | 'Reschedule Pending'
  | 'Cancellation Pending';

export type DemoStatus = 'Pending Confirmation' | 'Confirmed' | 'Canceled';
export type AssignmentStatus = 'Assigned' | 'Submitted' | 'Graded';
export type UserRole = 'Admin' | 'Teacher' | 'Student';

// NEW: More granular status for the multi-step reschedule workflow
export type RescheduleStatus = 'Pending Student Suggestion' | 'Pending Teacher Slots' | 'Pending Student Confirmation' | 'Confirmed';

export interface User {
  name: string;
  email: string;
  picture?: string;
  role: UserRole;
  entityId?: string; 
}

export interface Teacher {
    teacherId: string;
    name: string;
    email: string;
    timeZone: string;
}

export interface Lead {
  id: string;
  timestamp: string;
  name: string;
  contactEmail: string;
  timeZone: string;
  subjectOfInterest: string;
  status: LeadStatus;
}

export interface Student {
  studentId: string;
  name: string;
  timeZone: string;
  hourlyRate: number;
  status: StudentStatus;
  authorizedEmail: string; 
  teacherIds: string[];
  paymentReminderStatus?: 'Queued' | 'Sent';
}

export interface ClassSession {
  classId: string;
  studentId: string;
  teacherId: string;
  date: string; 
  startTime: string; 
  durationHours: number;
  topicsCovered: string;
  status: SessionStatus;
  meetLink?: string;
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly';
    interval: number;
    daysOfWeek?: ('SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT')[];
    startDate: string; 
    endDate: string; 
}

export interface RecurringClass {
    studentId: string;
    teacherId: string;
    startTime: string; 
    durationHours: number;
    topicsCovered: string;
    rule: RecurrenceRule;
}

export interface EnrichedClassSession extends ClassSession {
    studentName: string;
    teacherName: string;
    localDateStr: string;
    localTime: string;
    localTimeZone: string;
    isPast: boolean;
}

export interface Demo {
  demoId: string;
  leadId: string;
  teacherId: string;
  date: string; 
  startTime: string; 
  status: DemoStatus;
  meetLink?: string;
}

export interface Payment {
  paymentId: string;
  studentId: string;
  paymentDate: string; 
  amount: number;
  currency: string;
}

export interface Assignment {
  assignmentId: string;
  studentId: string;
  teacherId: string;
  title: string;
  instructions: string;
  dueDate: string; 
  submissionDate?: string; 
  status: AssignmentStatus;
  submissionLink?: string;
  submissionFileName?: string;
  grade?: string;
  // NEW: Advanced grading and feedback system
  gradingSystem: 'Points' | 'Percentage' | 'Letter Grade';
  maxPoints?: number;
  feedback?: string; 
  teacherComments?: string; 
  notificationSent?: boolean;
}

export interface EnrichedAssignment extends Assignment {
    studentName: string;
    teacherName: string;
    isLate: boolean;
}

export interface StudentFinancials {
  totalHoursCompleted: number;
  totalAmountBilled: number;
  totalAmountPaid: number;
  outstandingBalance: number;
  accountStatus: string;
  alert: 'LOW CREDIT' | null;
}

export interface EnrichedStudent extends Student {
  financials: StudentFinancials;
}

export interface AgendaItem {
    type: 'Class' | 'Demo';
    date: string;
    time?: string;
    title: string;
    details: string;
    meetLink?: string;
    status: SessionStatus | DemoStatus;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string; 
  senderRole: UserRole;
  timestamp: string; 
  text: string;
}

export interface EnrichedMessage extends Message {
  senderName: string;
  isCurrentUser: boolean;
}

export interface Conversation {
  id: string; 
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  lastMessageText: string;
  lastMessageTimestamp: string;
}

// UPDATED: Teacher availability now supports flexible time ranges.
export interface TeacherAvailability {
    teacherId: string;
    date: string; 
    ranges: { startTime: string, endTime: string }[]; // e.g., '09:00', '11:30'
}

export interface AttendanceData {
    id: string; 
    name: string;
    totalCompleted: number;
    totalStudentNoShow: number;
    totalTeacherNoShow: number;
    attendanceRate: number;
}

// UPDATED: RescheduleRequest model supports the full "handshake" workflow.
export interface RescheduleRequest {
    requestId: string;
    classId: string;
    studentId: string;
    teacherId: string;
    studentSuggestion?: string; // Student's initial text suggestion
    teacherProposedSlots: string[]; // Array of ISO datetime strings from teacher
    studentConfirmedSlot?: string; // The slot the student finally confirms
    status: RescheduleStatus;
}

export interface LessonPlan {
    planId: string;
    studentId: string;
    teacherId: string;
    date: string; 
    topics: string;
    notes?: string;
}

export interface TeacherProfileData {
    teacher: Teacher;
    assignedStudents: Student[];
    attendance: AttendanceData;
}
