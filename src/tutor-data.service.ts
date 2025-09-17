import { Injectable, signal, computed, inject } from '@angular/core';
import { Lead, Student, ClassSession, Demo, Payment, StudentFinancials, AgendaItem, Teacher, EnrichedClassSession, User, Assignment, EnrichedAssignment, Message, Conversation, EnrichedMessage, TeacherAvailability, StudentStatus, SessionStatus, AttendanceData, RescheduleRequest, RecurringClass, DemoStatus, LessonPlan, TeacherProfileData, UserRole, RescheduleStatus } from './models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TutorDataService {
  private authService = inject(AuthService);
  private today = new Date();
  
  private todayStringUTC = this.today.toISOString().split('T')[0];

  leads = signal<Lead[]>([
    { id: 'L-101', timestamp: '2024-07-28', name: 'Alice Johnson', contactEmail: 'alice@email.com', timeZone: 'America/New_York', subjectOfInterest: 'Algebra II', status: 'New' },
    { id: 'L-102', timestamp: '2024-07-27', name: 'Bob Williams', contactEmail: 'bob@email.com', timeZone: 'Europe/Paris', subjectOfInterest: 'Chemistry', status: 'Contacted' },
  ]);

  teachers = signal<Teacher[]>([
    { teacherId: 'T-JSM45', name: 'John Smith', email: 'teacher.john@example.com', timeZone: 'America/New_York' }, // EST
    { teacherId: 'T-MDO67', name: 'Mary Doe', email: 'teacher.mary@example.com', timeZone: 'Europe/London' }, // GMT/BST
  ]);
  
  students = signal<Student[]>([
    { studentId: 'S-ABC123', name: 'Charlie Brown', timeZone: 'America/Los_Angeles', hourlyRate: 50, status: 'Active', authorizedEmail: 'student.charlie@example.com', teacherIds: ['T-JSM45'], paymentReminderStatus: 'Queued' }, // PST
    { studentId: 'S-DEF456', name: 'Diana Prince', timeZone: 'Europe/London', hourlyRate: 65, status: 'Active', authorizedEmail: 'student.diana@example.com', teacherIds: ['T-JSM45', 'T-MDO67'] }, // GMT/BST
    { studentId: 'S-GHI789', name: 'Ethan Hunt', timeZone: 'Asia/Tokyo', hourlyRate: 55, status: 'Inactive', authorizedEmail: 'student.ethan@example.com', teacherIds: ['T-MDO67'] }, // JST
  ]);
  
  classes = signal<ClassSession[]>([
    { classId: 'C-001', studentId: 'S-ABC123', teacherId: 'T-JSM45', date: this.getPastDate(2), startTime: '21:00', durationHours: 1, topicsCovered: 'Linear Equations', status: 'Completed' },
    { classId: 'C-002', studentId: 'S-DEF456', teacherId: 'T-MDO67', date: this.getPastDate(3), startTime: '11:30', durationHours: 1.5, topicsCovered: 'Stoichiometry', status: 'Student No Show' },
    { classId: 'C-003', studentId: 'S-ABC123', teacherId: 'T-JSM45', date: this.todayStringUTC, startTime: '23:00', durationHours: 1, topicsCovered: 'Quadratic Functions', status: 'Scheduled', meetLink: 'https://meet.google.com/abc-def-ghi' },
    { classId: 'C-004', studentId: 'S-ABC123', teacherId: 'T-JSM45', date: this.getPastDate(8), startTime: '17:00', durationHours: 1, topicsCovered: 'Polynomials', status: 'Teacher No Show' },
    { classId: 'C-005', studentId: 'S-DEF456', teacherId: 'T-JSM45', date: this.getFutureDate(2), startTime: '13:00', durationHours: 1, topicsCovered: 'Chemical Bonds', status: 'Scheduled', meetLink: 'https://meet.google.com/jkl-mno-pqr' },
    { classId: 'C-006', studentId: 'S-DEF456', teacherId: 'T-MDO67', date: this.getFutureDate(4), startTime: '13:00', durationHours: 1.5, topicsCovered: 'Organic Chemistry Intro', status: 'Reschedule Pending', meetLink: 'https://meet.google.com/stu-vwx-yza' },
    { classId: 'C-007', studentId: 'S-ABC123', teacherId: 'T-JSM45', date: this.getFutureDate(4), startTime: '00:00', durationHours: 1, topicsCovered: 'Advanced Factoring', status: 'Scheduled', meetLink: 'https://meet.google.com/bcd-efg-hij' },
    { classId: 'C-008', studentId: 'S-DEF456', teacherId: 'T-MDO67', date: this.getFutureDate(3), startTime: '10:00', durationHours: 1, topicsCovered: 'Reaction Kinetics', status: 'Cancellation Pending', meetLink: 'https://meet.google.com/ghi-jkl-mno' },
  ]);
  
  demos = signal<Demo[]>([
     { demoId: 'D-001', leadId: 'L-102', teacherId: 'T-JSM45', date: this.getFutureDate(1), startTime: '14:00', status: 'Pending Confirmation', meetLink: 'https://meet.google.com/xyz-abc-def'},
  ]);
  
  payments = signal<Payment[]>([
     { paymentId: 'P-001', studentId: 'S-ABC123', paymentDate: this.getPastDate(10), amount: 200, currency: 'USD' },
     { paymentId: 'P-002', studentId: 'S-DEF456', paymentDate: this.getPastDate(5), amount: 50, currency: 'USD' },
  ]);

  assignments = signal<Assignment[]>([
    { assignmentId: 'A-001', studentId: 'S-ABC123', teacherId: 'T-JSM45', title: 'Algebra Worksheet 1', instructions: 'Complete all odd-numbered problems.', dueDate: this.getFutureDate(5), status: 'Assigned', gradingSystem: 'Points', maxPoints: 20, notificationSent: false },
    { assignmentId: 'A-002', studentId: 'S-ABC123', teacherId: 'T-JSM45', title: 'Polynomial Factoring', instructions: 'Factor all polynomials on the attached sheet.', dueDate: this.getPastDate(1), status: 'Submitted', submissionDate: this.getPastDate(0), submissionLink: '#', submissionFileName: 'charlie_brown_hw.pdf', gradingSystem: 'Letter Grade' },
    { assignmentId: 'A-003', studentId: 'S-DEF456', teacherId: 'T-MDO67', title: 'Lab Report: Titration', instructions: 'Write a full lab report on the titration experiment.', dueDate: this.getPastDate(2), status: 'Graded', submissionDate: this.getPastDate(3), grade: '92', feedback: 'Excellent work, very thorough analysis.', gradingSystem: 'Percentage' },
  ]);

  messages = signal<Message[]>([
    { messageId: 'M-001', conversationId: 'S-ABC123_T-JSM45', senderId: 'T-JSM45', senderRole: 'Teacher', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), text: 'Hi Charlie, just a reminder to review the notes on quadratic equations before our next session.' },
    { messageId: 'M-002', conversationId: 'S-ABC123_T-JSM45', senderId: 'S-ABC123', senderRole: 'Student', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), text: 'Will do, thanks Mr. Smith!' },
  ]);
  
  teacherAvailability = signal<TeacherAvailability[]>([
    { teacherId: 'T-JSM45', date: this.todayStringUTC, ranges: [{startTime: '13:00', endTime: '16:00'}, {startTime: '22:00', endTime: '23:30'}] },
    { teacherId: 'T-MDO67', date: this.todayStringUTC, ranges: [{startTime: '10:00', endTime: '14:00'}] },
  ]);
  
  recurringClasses = signal<RecurringClass[]>([]);

  rescheduleRequests = signal<RescheduleRequest[]>([
      { requestId: 'R-001', classId: 'C-006', studentId: 'S-DEF456', teacherId: 'T-MDO67', studentSuggestion: 'Can we do it on Friday instead?', teacherProposedSlots: [], status: 'Pending Teacher Slots' }
  ]);
  
  lessonPlans = signal<LessonPlan[]>([
    { planId: 'LP-001', studentId: 'S-ABC123', teacherId: 'T-JSM45', date: this.getFutureDate(0), topics: 'Review quadratic formula', notes: 'Focus on discriminant.' },
    { planId: 'LP-002', studentId: 'S-DEF456', teacherId: 'T-JSM45', date: this.getFutureDate(2), topics: 'Introduction to redox reactions', notes: 'Prepare balancing examples.'}
  ]);


  private getUserTimeZone(user: User): string {
    switch(user.role) {
        case 'Admin': return 'UTC'; // Default for admin, can be changed in UI
        case 'Teacher': return this.teachers().find(t => t.teacherId === user.entityId)?.timeZone || 'UTC';
        case 'Student': return this.students().find(s => s.studentId === user.entityId)?.timeZone || 'UTC';
        default: return 'UTC';
    }
  }

  private convertToUserLocalTime(utcDate: string, utcTime: string, targetTimeZone: string): { localDateStr: string, localTime: string, localTimeZone: string, isPast: boolean } {
      const utcDateTime = new Date(`${utcDate}T${utcTime}:00Z`);
      if (isNaN(utcDateTime.getTime())) {
          return { localDateStr: 'Invalid Date', localTime: '', localTimeZone: '', isPast: false };
      }
      
      const now = new Date();
      const isPast = utcDateTime < now;

      const localDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: targetTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(utcDateTime);
      const localTime = new Intl.DateTimeFormat('en-US', { timeZone: targetTimeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(utcDateTime);
      const localTimeZone = new Intl.DateTimeFormat('en-US', { timeZone: targetTimeZone, timeZoneName: 'short' }).format(utcDateTime).split(' ')[1];
      
      return { localDateStr, localTime, localTimeZone, isPast };
  }

  weeklyScheduleForCurrentUser = computed<EnrichedClassSession[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const userTimeZone = this.getUserTimeZone(user);
    
    const todayForUser = new Date(new Date().toLocaleDateString("en-US", { timeZone: userTimeZone }));
    const sevenDaysFromNow = new Date(todayForUser);
    sevenDaysFromNow.setDate(todayForUser.getDate() + 7);


    const allUserClasses = this.classes().filter(c => {
        switch(user.role) {
            case 'Admin': return true;
            case 'Teacher': return c.teacherId === user.entityId;
            case 'Student': return c.studentId === user.entityId;
            default: return false;
        }
    });

    return allUserClasses
      .map(c => this.enrichClassSession(c, userTimeZone))
      .filter(c => {
        const classLocalDate = new Date(c.localDateStr);
        return classLocalDate >= todayForUser && classLocalDate < sevenDaysFromNow;
      })
      .sort((a, b) => new Date(`${a.date}T${a.startTime}Z`).getTime() - new Date(`${b.date}T${b.startTime}Z`).getTime());
  });

  todaysAgenda = computed<AgendaItem[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    
    const userTimeZone = this.getUserTimeZone(user);
    const nowInUserTz = new Date(new Date().toLocaleString("en-US", { timeZone: userTimeZone }));
    const todayInUserTzStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(nowInUserTz);

    const todaysClasses: AgendaItem[] = this.weeklyScheduleForCurrentUser()
      .filter(c => c.localDateStr === todayInUserTzStr)
      .map(c => ({
        type: 'Class' as const,
        date: c.localDateStr,
        time: `${c.localTime} ${c.localTimeZone}`,
        title: user.role === 'Student' ? `Class with ${c.teacherName}` : `Class with ${c.studentName}`,
        details: `Topics: ${c.topicsCovered}`,
        meetLink: c.meetLink,
        status: c.status
      }));

    const todaysDemos: AgendaItem[] = user.role === 'Admin' ? this.demos()
      .filter(d => d.date === this.todayStringUTC && (d.status !== 'Canceled'))
      .map(d => {
        const lead = this.leads().find(l => l.id === d.leadId);
        return {
          type: 'Demo' as const,
          date: d.date,
          title: `Demo with ${lead?.name || 'Unknown Lead'}`,
          details: `Subject: ${lead?.subjectOfInterest || 'N/A'}`,
          meetLink: d.meetLink,
          status: d.status
        };
      }) : [];
      
    return [...todaysClasses, ...todaysDemos].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  });

  assignmentsForCurrentUser = computed<EnrichedAssignment[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const allAssignments = this.assignments().filter(a => {
      switch(user.role) {
        case 'Admin': return true;
        case 'Teacher': return a.teacherId === user.entityId;
        case 'Student': return a.studentId === user.entityId;
        default: return false;
      }
    });

    return allAssignments
      .map(a => this.enrichAssignment(a))
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  });
  
  allMessagesEnriched = computed<EnrichedMessage[]>(() => {
      const user = this.authService.currentUser();
      if (!user) return [];
      
      return this.messages().map(msg => {
          let senderName = 'Unknown';
          if (msg.senderRole === 'Admin') senderName = 'Admin';
          if (msg.senderRole === 'Teacher') senderName = this.teachers().find(t => t.teacherId === msg.senderId)?.name || 'Teacher';
          if (msg.senderRole === 'Student') senderName = this.students().find(s => s.studentId === msg.senderId)?.name || 'Student';
          
          return {
              ...msg,
              senderName,
              isCurrentUser: user.role === msg.senderRole && (user.entityId === msg.senderId || user.role === 'Admin')
          }
      });
  });

  conversationsForCurrentUser = computed<Conversation[]>(() => {
      const user = this.authService.currentUser();
      if (!user) return [];
      
      const messagesByConversation = this.messages().reduce((acc, msg) => {
          (acc[msg.conversationId] = acc[msg.conversationId] || []).push(msg);
          return acc;
      }, {} as {[key: string]: Message[]});
      
      let conversations = Object.keys(messagesByConversation).map(convoId => {
          const [studentId, teacherId] = convoId.split('_');
          const student = this.students().find(s => s.studentId === studentId);
          const teacher = this.teachers().find(t => t.teacherId === teacherId);
          
          const sortedMessages = messagesByConversation[convoId].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const lastMessage = sortedMessages[0];
          
          return {
              id: convoId,
              studentId,
              studentName: student?.name || 'Unknown',
              teacherId,
              teacherName: teacher?.name || 'Unknown',
              lastMessageText: lastMessage.text,
              lastMessageTimestamp: lastMessage.timestamp,
          }
      });

      if (user.role === 'Teacher') {
        conversations = conversations.filter(c => c.teacherId === user.entityId);
      } else if (user.role === 'Student') {
        conversations = conversations.filter(c => c.studentId === user.entityId);
      }

      return conversations.sort((a,b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
  });

  studentsForCurrentUser = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    switch(user.role) {
      case 'Admin':
        return this.students();
      case 'Teacher':
        return this.students().filter(s => s.teacherIds.includes(user.entityId ?? ''));
      case 'Student':
        return this.students().filter(s => s.studentId === user.entityId);
      default:
        return [];
    }
  });
  
  activeStudents = computed(() => this.studentsForCurrentUser().filter(s => s.status === 'Active'));

  financialOverview = computed(() => {
     const totalBilled = this.students().reduce((acc, student) => {
         const financials = this.getStudentFinancials(student.studentId);
         return acc + financials.totalAmountBilled;
     }, 0);
     
     const totalPaid = this.payments().reduce((sum, p) => sum + p.amount, 0);
     const totalOutstanding = totalBilled - totalPaid;
     
     return {
         totalRevenue: totalPaid,
         totalOutstanding: totalOutstanding > 0 ? totalOutstanding : 0,
         activeClients: this.students().filter(s => s.status === 'Active').length,
     };
  });

  private getPastDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  private getFutureDate(daysAhead: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  }

  getStudentFinancials(studentId: string): StudentFinancials {
    const student = this.students().find(s => s.studentId === studentId);
    if (!student) {
      return { totalHoursCompleted: 0, totalAmountBilled: 0, totalAmountPaid: 0, outstandingBalance: 0, accountStatus: 'N/A', alert: null };
    }

    const totalHoursCompleted = this.classes()
      .filter(c => c.studentId === studentId && c.status === 'Completed')
      .reduce((sum, c) => sum + c.durationHours, 0);

    const totalAmountBilled = totalHoursCompleted * student.hourlyRate;

    const totalAmountPaid = this.payments()
      .filter(p => p.studentId === studentId)
      .reduce((sum, p) => sum + p.amount, 0);

    const outstandingBalance = totalAmountBilled - totalAmountPaid;

    let accountStatus = 'PAID';
    if (outstandingBalance > 0) {
      accountStatus = `DUE: $${outstandingBalance.toFixed(2)}`;
    } else if (outstandingBalance < 0) {
      accountStatus = `CREDIT: $${(-outstandingBalance).toFixed(2)}`;
    }

    let alert: 'LOW CREDIT' | null = null;
    const credit = -outstandingBalance;
    if (credit > 0 && credit < student.hourlyRate) {
      alert = 'LOW CREDIT';
    }

    return {
      totalHoursCompleted,
      totalAmountBilled,
      totalAmountPaid,
      outstandingBalance,
      accountStatus,
      alert,
    };
  }
  
  studentAttendanceData = computed<AttendanceData[]>(() => {
    return this.students().map(student => this.getAttendanceDataForEntity(student.studentId, 'Student'));
  });

  teacherAttendanceData = computed<AttendanceData[]>(() => {
    return this.teachers().map(teacher => this.getAttendanceDataForEntity(teacher.teacherId, 'Teacher'));
  });
  
  scheduleForSelectedStudent(studentId: string): EnrichedClassSession[] {
      if (!studentId) return [];
      const student = this.students().find(s => s.studentId === studentId);
      if (!student) return [];
      return this.classes()
        .filter(c => c.studentId === studentId)
        .map(c => this.enrichClassSession(c, student.timeZone))
        .sort((a,b) => new Date(`${b.date}T${b.startTime}Z`).getTime() - new Date(`${a.date}T${a.startTime}Z`).getTime());
  }

  assignmentsForSelectedStudent(studentId: string): EnrichedAssignment[] {
      if (!studentId) return [];
      return this.assignments()
        .filter(a => a.studentId === studentId)
        .map(a => this.enrichAssignment(a))
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }
  
  attendanceForSelectedStudent(studentId: string): AttendanceData | null {
      if (!studentId) return null;
      return this.getAttendanceDataForEntity(studentId, 'Student');
  }

  lessonPlansForSelectedStudent(studentId: string): LessonPlan[] {
      return this.lessonPlans().filter(lp => lp.studentId === studentId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  getTeacherProfileData(teacherId: string): TeacherProfileData | null {
    if (!teacherId) return null;
    const teacher = this.teachers().find(t => t.teacherId === teacherId);
    if (!teacher) return null;

    return {
        teacher,
        assignedStudents: this.students().filter(s => s.teacherIds.includes(teacherId)),
        attendance: this.getAttendanceDataForEntity(teacherId, 'Teacher')
    }
  }

  rescheduleRequestsForCurrentUser = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    
    return this.rescheduleRequests().filter(req => {
        if (user.role === 'Admin') return true;
        if (user.role === 'Teacher') return req.teacherId === user.entityId;
        if (user.role === 'Student') return req.studentId === user.entityId;
        return false;
    });
  });

  cancellationRequestsForAdmin = computed(() => {
    return this.classes()
      .filter(c => c.status === 'Cancellation Pending')
      .map(c => this.enrichClassSession(c, 'UTC')); 
  });

  logSession(sessionData: { studentId: string; teacherId: string; date: string; startTime: string; durationHours: number; topicsCovered: string; }): void {
    const newSession: ClassSession = {
      classId: `C-${this.generateId()}`,
      status: 'Completed',
      ...sessionData
    };
    this.classes.update(classes => [...classes, newSession]);
  }
  
  scheduleClass(classData: { studentId: string; teacherId: string; date: string; startTime: string; durationHours: number; topicsCovered: string; }): void {
    const newClass: ClassSession = {
      classId: `C-${this.generateId()}`,
      status: 'Scheduled',
      meetLink: `https://meet.google.com/sim-${this.generateId(7)}`,
      ...classData
    };
    this.classes.update(classes => [...classes, newClass]);
  }
  
  scheduleRecurringClass(recurringData: RecurringClass): void {
      this.recurringClasses.update(r => [...r, recurringData]);
      const newClasses = this.generateRecurringSessions(recurringData);
      this.classes.update(c => [...c, ...newClasses]);
      alert(`Successfully scheduled ${newClasses.length} recurring classes.`);
  }

  scheduleDemo(demoData: { leadId: string; teacherId: string; date: string; startTime: string }): void {
    const newDemo: Demo = {
      demoId: `D-${this.generateId()}`,
      status: 'Pending Confirmation',
      meetLink: `https://meet.google.com/sim-${this.generateId(7)}`,
      ...demoData
    };
    this.demos.update(demos => [...demos, newDemo]);
    this.leads.update(leads => leads.map(lead => lead.id === demoData.leadId ? { ...lead, status: 'Demo Scheduled' } : lead));
    alert('Demo is scheduled and pending confirmation from teacher and parent.');
  }

  logPayment(paymentData: { studentId: string; paymentDate: string; amount: number; currency: string; }): void {
    const newPayment: Payment = {
      paymentId: `P-${this.generateId()}`,
      ...paymentData
    };
    this.payments.update(payments => [...payments, newPayment]);
  }

  convertLeadToStudent(leadId: string): string {
    const lead = this.leads().find(l => l.id === leadId);
    if (!lead) return '';

    const newStudent: Student = {
      studentId: `S-${this.generateId(6).toUpperCase()}`,
      name: lead.name,
      timeZone: lead.timeZone,
      hourlyRate: 50,
      status: 'Active',
      authorizedEmail: lead.contactEmail,
      teacherIds: [],
    };

    this.students.update(students => [...students, newStudent]);
    this.leads.update(leads => leads.map(l => l.id === leadId ? { ...l, status: 'Converted' } : l));
    return newStudent.studentId;
  }

  queuePaymentReminder(studentId: string): void {
    this.students.update(students => students.map(s => s.studentId === studentId ? { ...s, paymentReminderStatus: 'Queued' } : s));
  }

  approveAndSendReminder(studentId: string): void {
    this.students.update(students => students.map(s => s.studentId === studentId ? { ...s, paymentReminderStatus: 'Sent' } : s));
  }

  submitAssignment(assignmentId: string, fileName: string): void {
    const submissionDate = new Date().toISOString().split('T')[0];
    this.assignments.update(assignments => assignments.map(a => a.assignmentId === assignmentId ? { ...a, status: 'Submitted', submissionFileName: fileName, submissionLink: '#', submissionDate } : a));
  }
  
  editGrade(assignmentId: string, grade: string, feedback: string): void {
    this.assignments.update(assignments => assignments.map(a => 
      a.assignmentId === assignmentId 
      ? { ...a, status: 'Graded', grade, feedback } 
      : a
    ));
  }

  sendAssignmentNotification(assignmentId: string): void {
    this.assignments.update(assignments => assignments.map(a => a.assignmentId === assignmentId ? { ...a, notificationSent: true } : a));
  }

  updateSessionStatus(classId: string, status: 'Completed' | 'Student No Show' | 'Teacher No Show'): void {
      this.classes.update(classes => classes.map(c => c.classId === classId ? { ...c, status } : c));
  }

  cancelSession(classId: string): void {
    this.classes.update(classes => classes.map(c => c.classId === classId ? { ...c, status: 'Canceled' } : c));
  }
  
  updateStudentProfile(studentId: string, data: Partial<Student>): void {
    this.students.update(students => students.map(s => s.studentId === studentId ? { ...s, ...data } : s));
  }
  
  updateTeacherProfile(teacherId: string, data: Partial<Teacher>): void {
    this.teachers.update(teachers => teachers.map(t => t.teacherId === teacherId ? { ...t, ...data } : t));
  }
  
  addLessonPlan(plan: Omit<LessonPlan, 'planId'>): void {
      const newPlan: LessonPlan = { ...plan, planId: `LP-${this.generateId()}`};
      this.lessonPlans.update(plans => [...plans, newPlan]);
  }

  sendMessage(conversationId: string, text: string): void {
    const user = this.authService.currentUser();
    if (!user) return;

    const newMessage: Message = {
      messageId: `M-${this.generateId()}`,
      conversationId,
      senderId: user.role === 'Admin' ? 'admin' : user.entityId!,
      senderRole: user.role,
      timestamp: new Date().toISOString(),
      text,
    };

    this.messages.update(messages => [...messages, newMessage]);
  }

  setAvailability(teacherId: string, date: string, range: {startTime: string, endTime: string}, isAvailable: boolean): void {
    this.teacherAvailability.update(availabilities => {
        const existingDate = availabilities.find(a => a.teacherId === teacherId && a.date === date);
        if (existingDate) {
            return availabilities.map(a => {
                if (a.teacherId === teacherId && a.date === date) {
                    const newRanges = isAvailable 
                        ? [...a.ranges, range].sort((r1, r2) => r1.startTime.localeCompare(r2.startTime))
                        : a.ranges.filter(r => r.startTime !== range.startTime || r.endTime !== range.endTime);
                    return { ...a, ranges: newRanges };
                }
                return a;
            });
        } else {
            return [...availabilities, { teacherId, date, ranges: isAvailable ? [range] : [] }];
        }
    });
  }

  initiateReschedule(classId: string): void {
    const cls = this.classes().find(c => c.classId === classId);
    if(!cls) return;

    const newRequest: RescheduleRequest = {
        requestId: `R-${this.generateId()}`,
        classId: classId,
        studentId: cls.studentId,
        teacherId: cls.teacherId,
        teacherProposedSlots: [],
        status: 'Pending Student Suggestion'
    };

    this.rescheduleRequests.update(reqs => [...reqs, newRequest]);
    this.classes.update(classes => classes.map(c => c.classId === classId ? {...c, status: 'Reschedule Pending'} : c));
    alert('Reschedule process initiated. The student will be prompted to make a suggestion.');
  }

  submitStudentRescheduleSuggestion(requestId: string, suggestion: string): void {
    this.rescheduleRequests.update(requests => requests.map(req => 
        req.requestId === requestId 
        ? { ...req, studentSuggestion: suggestion, status: 'Pending Teacher Slots' } 
        : req
    ));
  }

  submitTeacherProposedSlots(requestId: string, slots: string[]): void {
     this.rescheduleRequests.update(requests => requests.map(req => 
        req.requestId === requestId 
        ? { ...req, teacherProposedSlots: slots, status: 'Pending Student Confirmation' } 
        : req
    ));
  }
  
  submitStudentFinalConfirmation(requestId: string, finalSlot: string): void {
      this.rescheduleRequests.update(requests => requests.map(req => 
        req.requestId === requestId 
        ? { ...req, studentConfirmedSlot: finalSlot, status: 'Confirmed' } 
        : req
    ));

    const request = this.rescheduleRequests().find(r => r.requestId === requestId);
    if (!request) return;

    const newDate = finalSlot.split('T')[0];
    const newStartTime = finalSlot.split('T')[1];

    this.classes.update(classes => classes.map(c => 
      c.classId === request.classId 
      ? { ...c, date: newDate, startTime: newStartTime, status: 'Scheduled' } 
      : c
    ));

    alert('Session has been successfully rescheduled!');
  }
  
  requestCancellation(classId: string): void {
      this.classes.update(classes => classes.map(c => c.classId === classId ? { ...c, status: 'Cancellation Pending' } : c));
      alert('Your request to cancel this session has been sent to the administrator for review.');
  }

  approveCancellation(classId: string): void {
      this.classes.update(classes => classes.map(c => c.classId === classId ? { ...c, status: 'Canceled' } : c));
  }

  denyCancellation(classId: string): void {
      this.classes.update(classes => classes.map(c => c.classId === classId ? { ...c, status: 'Scheduled' } : c));
  }
  
  requestNewSession(studentId: string, teacherId: string, dateTime: string): void {
    const date = dateTime.split('T')[0];
    const startTime = dateTime.split('T')[1];
    const newClass: ClassSession = {
      classId: `C-${this.generateId()}`,
      studentId,
      teacherId,
      date,
      startTime,
      durationHours: 1, // Default duration
      topicsCovered: 'Student Requested Session',
      status: 'Scheduled', // Or 'Pending Confirmation' if admin needs to approve
      meetLink: `https://meet.google.com/sim-${this.generateId(7)}`
    };
    this.classes.update(c => [...c, newClass]);
    alert(`New session requested for ${date} at ${startTime}. It has been added to your schedule.`);
  }

  private generateId(length = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  private enrichClassSession(session: ClassSession, userTimeZone: string): EnrichedClassSession {
    const student = this.students().find(s => s.studentId === session.studentId);
    const teacher = this.teachers().find(t => t.teacherId === session.teacherId);
    const timeDetails = this.convertToUserLocalTime(session.date, session.startTime, userTimeZone);

    return {
      ...session,
      studentName: student?.name || 'Unknown',
      teacherName: teacher?.name || 'Unknown',
      ...timeDetails
    };
  }
  
  private enrichAssignment(assignment: Assignment): EnrichedAssignment {
    const student = this.students().find(s => s.studentId === assignment.studentId);
    const teacher = this.teachers().find(t => t.teacherId === assignment.teacherId);
    const isLate = assignment.submissionDate ? new Date(assignment.submissionDate) > new Date(assignment.dueDate) : false;
    return {
      ...assignment,
      studentName: student?.name || 'Unknown',
      teacherName: teacher?.name || 'Unknown',
      isLate,
    };
  }
  
  private getAttendanceDataForEntity(entityId: string, type: 'Student' | 'Teacher'): AttendanceData {
    const classes = this.classes().filter(c => (type === 'Student' ? c.studentId : c.teacherId) === entityId);
    const entity = (type === 'Student' ? this.students().find(s => s.studentId === entityId) : this.teachers().find(t => t.teacherId === entityId));

    const totalCompleted = classes.filter(c => c.status === 'Completed').length;
    const totalStudentNoShow = classes.filter(c => c.status === 'Student No Show').length;
    const totalTeacherNoShow = classes.filter(c => c.status === 'Teacher No Show').length;
    
    let totalPossible = 0;
    if (type === 'Student') {
      totalPossible = totalCompleted + totalStudentNoShow;
    } else { // Teacher
      totalPossible = totalCompleted + totalTeacherNoShow;
    }

    const attendanceRate = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 100;

    return {
        id: entityId,
        name: entity?.name || 'Unknown',
        totalCompleted,
        totalStudentNoShow,
        totalTeacherNoShow,
        attendanceRate
    };
  }
  
  private generateRecurringSessions(recurringData: RecurringClass): ClassSession[] {
    const { rule, ...classDetails } = recurringData;
    const newSessions: ClassSession[] = [];
    let currentDate = new Date(rule.startDate + 'T00:00:00Z');
    const endDate = new Date(rule.endDate + 'T23:59:59Z');

    if (rule.frequency === 'daily') {
        while (currentDate <= endDate) {
            newSessions.push(this.createClassFromDate(currentDate, classDetails));
            currentDate.setUTCDate(currentDate.getUTCDate() + rule.interval);
        }
    } else { // weekly
        const dayMapping = {'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6};
        const requiredDays = rule.daysOfWeek?.map(d => dayMapping[d]) || [];
        
        // Go to the first day of the start week (Sunday)
        currentDate.setUTCDate(currentDate.getUTCDate() - currentDate.getUTCDay());

        while(currentDate <= endDate) {
            // Check all days in the current week
            for (let i = 0; i < 7; i++) {
                let checkDate = new Date(currentDate.getTime());
                checkDate.setUTCDate(checkDate.getUTCDate() + i);

                if(checkDate > endDate) break;

                // Ensure we don't add dates before the actual start date
                if(checkDate >= new Date(rule.startDate + 'T00:00:00Z') && requiredDays.includes(checkDate.getUTCDay())) {
                    newSessions.push(this.createClassFromDate(checkDate, classDetails));
                }
            }
            // Jump to the next interval week
            currentDate.setUTCDate(currentDate.getUTCDate() + (7 * rule.interval));
        }
    }
    return newSessions;
  }

  private createClassFromDate(date: Date, classDetails: Omit<RecurringClass, 'rule'>): ClassSession {
      return {
        ...classDetails,
        classId: `C-${this.generateId()}`,
        date: date.toISOString().split('T')[0],
        status: 'Scheduled',
        meetLink: `https://meet.google.com/sim-${this.generateId(7)}`,
      };
  }
}
