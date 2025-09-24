// --- ENUMS & TYPES ---
export type UserRole = 'SuperAdmin' | 'OrganizationAdmin' | 'Admin' | 'Teacher' | 'Student' | 'Parent';
export type ProspectStatus = 'New' | 'Contacted' | 'Demo Scheduled' | 'On Hold' | 'Converted' | 'Not Interested';
export type SessionStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Student No Show' | 'Teacher No Show' | 'Reschedule Pending' | 'Cancellation Pending';
export type SubmissionStatus = 'Pending' | 'Submitted' | 'Graded' | 'Late';
export type AssignmentUiStatus = 'Assigned' | 'Submitted' | 'Graded';
export type RequestStatus = 'Pending' | 'Approved' | 'Denied';
export type StudentStatus = 'Active' | 'Inactive';
export type DemoStatus = 'Pending Confirmation' | 'Confirmed' | 'Completed' | 'Canceled';
export type RescheduleStatus = 'Pending Student Suggestion' | 'Pending Teacher Slots' | 'Pending Student Confirmation' | 'Confirmed';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Void';


// --- AUTH MODELS ---
export interface User {
  id: string;
  organization_id?: string | null;
  full_name: string;
  email: string;
  avatar_url?: string;
  roles: UserRole[];
  is_active: boolean;
  time_zone: string;
}

// --- BASE DATA MODELS (Mirroring DB Tables) ---

export interface Person {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  time_zone: string;
}
// For UI purposes, we'll use Person and add role-specific enriched types
export type Student = Person;
export type Teacher = Person;

export interface Lead {
    id: string;
    timestamp: string;
    name: string;
    contactEmail: string;
    timeZone: string;
    subjectOfInterest: string;
    status: ProspectStatus;
}

export interface Course {
    id: number;
    organization_id: string;
    name: string;
    description?: string;
    teacher: Teacher;
}

export interface Enrollment {
    id: number;
    student: Student;
    course: Course;
    enrollment_date: string;
    hourly_rate: number;
}

export interface Class {
    id: number;
    organization_id: string;
    course: Course;
    teacher: Teacher;
    students: Student[]; // A class can have multiple students
    start_time: string; // ISO 8601 UTC
    end_time: string;   // ISO 8601 UTC
    status: SessionStatus;
    title?: string;
    meet_link?: string;
}

export interface Assignment {
    id: number;
    course: Course;
    organization_id: string;
    title: string;
    description?: string;
    due_date?: string; // ISO 8601 UTC
}

export interface Submission {
    id: number;
    assignment: Assignment;
    student: Student;
    status: SubmissionStatus;
    content?: string; // Could be text or a link to a file
    submitted_at?: string; // ISO 8601 UTC
    grade?: number;
    feedback?: string;
}

export interface Payment {
  id: number;
  student: Student;
  payment_date: string;
  amount: number;
  method?: string; // e.g., 'Stripe', 'Cash'
}

export interface RescheduleRequest {
    id: number;
    class: Class;
    requesting_person: Person;
    reason?: string;
    status: RequestStatus;
    proposed_slots?: string[]; // Array of ISO 8601 UTC timestamps
    final_slot?: string; // ISO 8601 UTC timestamp
}

export interface Conversation {
    id: number;
    organization_id: string;
    title?: string;
    participants: Person[];
    observers: Person[];
}

export interface Message {
    id: number;
    conversation_id: number;
    sender: Person;
    content: string;
    created_at: string; // ISO 8601 UTC
}

export interface LessonPlan {
    id: string; // Using string until DB table is added
    student: Student;
    teacher: Teacher;
    date: string;
    topics: string;
    notes?: string;
}

export interface TeacherAvailability {
    teacherId: string;
    date: string; // YYYY-MM-DD
    ranges: { startTime: string, endTime: string }[]; // HH:mm
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly';
    interval: number;
    daysOfWeek?: ('SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT')[];
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

export interface Invoice {
    id: number;
    student: Student;
    issue_date: string;
    due_date: string;
    total_amount: number;
    status: InvoiceStatus;
    items: InvoiceItem[];
}

export interface InvoiceItem {
    id: number;
    class_id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}


// --- ENRICHED/COMPOSITE MODELS FOR UI ---

export interface EnrichedClass extends Class {
    // Timezone-converted properties for a specific user
    localStartTime: string;
    localEndTime: string;
    localTimeZone: string;
    isPast: boolean;
}

export interface EnrichedSubmission extends Submission {
    uiStatus: AssignmentUiStatus;
    isLate: boolean;
}

export interface EnrichedStudent extends Student {
  financials: StudentFinancials;
  assignmentStats: AssignmentStats;
  enrollments: Enrollment[];
}

export interface StudentFinancials {
  totalHoursCompleted: number;
  totalAmountBilled: number;
  totalAmountPaid: number;
  outstandingBalance: number;
  accountStatus: string;
  alert: 'LOW CREDIT' | null;
}

export interface AssignmentStats {
  upcoming: number;
  overdue: number;
  needsGrading: number;
}

export interface AgendaItem {
    type: 'Class' | 'Demo';
    date: string; // Local date
    time?: string; // Local time
    title: string;
    details: string;
    meetLink?: string;
    status: SessionStatus | DemoStatus | string;
    rawStartTime: string; // For sorting
}

export interface AttendanceData {
  id: string;
  name: string;
  totalCompleted: number;
  totalStudentNoShow: number;
  totalTeacherNoShow: number;
  attendanceRate: number;
}

export interface EnrichedConversation extends Conversation {
    lastMessagePreview: string;
    lastMessageTimestamp: string;
    otherParticipants: Person[]; // Participants excluding the current user
}

export interface EnrichedMessage extends Message {
    isCurrentUser: boolean;
}
