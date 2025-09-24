import { Injectable, signal, computed, inject } from '@angular/core';
import { Lead, Student, Class, Payment, StudentFinancials, AgendaItem, Teacher, EnrichedClass, User, Assignment, Submission, EnrichedSubmission, Message, Conversation, EnrichedConversation, TeacherAvailability, StudentStatus, SessionStatus, AttendanceData, RescheduleRequest, RecurrenceRule, LessonPlan, UserRole, AssignmentUiStatus, AssignmentStats, Enrollment, EnrichedStudent, SubmissionStatus, EnrichedMessage, Invoice } from './models';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';


@Injectable({ providedIn: 'root' })
export class TutorDataService {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);

  isLoading = signal(false);
  
  // Base Data Signals
  leads = signal<Lead[]>([]);
  teachers = signal<Teacher[]>([]);
  students = signal<Student[]>([]);
  classes = signal<Class[]>([]);
  enrollments = signal<Enrollment[]>([]);
  submissions = signal<Submission[]>([]);
  payments = signal<Payment[]>([]);
  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  rescheduleRequests = signal<RescheduleRequest[]>([]);
  lessonPlans = signal<LessonPlan[]>([]);
  teacherAvailability = signal<TeacherAvailability[]>([]);
  invoices = signal<Invoice[]>([]);
  studentGuardianRelationships = signal<{student_id: string, guardian_id: string}[]>([]);

  async initializeData(): Promise<void> {
    this.isLoading.set(true);
    try {
        const [
            teachers, students, enrollments, classes, submissions, payments, 
            leads, conversations, messages, rescheduleRequests, invoices, relationships
        ] = await Promise.all([
            this.supabaseService.getTeachers(),
            this.supabaseService.getStudents(),
            this.supabaseService.getEnrollments(),
            this.supabaseService.getClasses(),
            this.supabaseService.getSubmissions(),
            this.supabaseService.getPayments(),
            this.supabaseService.getLeads(),
            this.supabaseService.getConversations(),
            this.supabaseService.getMessages(),
            this.supabaseService.getRescheduleRequests(),
            this.supabaseService.getInvoices(),
            // FIX: Implemented missing `getStudentGuardianRelationships` method in supabase service.
            this.supabaseService.getStudentGuardianRelationships(),
        ]);

        this.teachers.set(teachers);
        this.students.set(students);
        this.enrollments.set(enrollments);
        this.classes.set(classes);
        this.submissions.set(submissions);
        this.payments.set(payments);
        this.leads.set(leads);
        this.conversations.set(conversations);
        this.messages.set(messages);
        this.rescheduleRequests.set(rescheduleRequests);
        this.invoices.set(invoices);
        this.studentGuardianRelationships.set(relationships);

        // --- Sprint 4: Real-time Subscriptions ---
        this.supabaseService.subscribeToMessages((newMessage) => {
          this.messages.update(currentMessages => [...currentMessages, newMessage]);
        });
        
        // --- Sprint 3: Real-time Subscriptions ---
        this.supabaseService.subscribeToRescheduleRequests((updatedRequest) => {
            this.rescheduleRequests.update(currentRequests => {
                const index = currentRequests.findIndex(r => r.id === updatedRequest.id);
                if (index > -1) {
                    const newRequests = [...currentRequests];
                    newRequests[index] = updatedRequest;
                    return newRequests;
                }
                return [...currentRequests, updatedRequest];
            });
        });

    } catch (error) {
        console.error("Failed to initialize data", error);
    } finally {
        this.isLoading.set(false);
    }
  }

  private convertToUserLocalTime(utcDateTime: Date, targetTimeZone: string): { localStartTime: string, localEndTime: string, localTimeZone: string, isPast: boolean } {
      if (isNaN(utcDateTime.getTime())) {
          return { localStartTime: 'Invalid Date', localEndTime: '', localTimeZone: '', isPast: false };
      }
      const now = new Date();
      const isPast = utcDateTime < now;
      
      const zonedTime = utcToZonedTime(utcDateTime, targetTimeZone);
      const localStartTime = format(zonedTime, 'p', { timeZone: targetTimeZone });
      const localEndTime = ''; // Simplified for now
      const localTimeZone = format(zonedTime, 'z', { timeZone: targetTimeZone });
      
      return { localStartTime, localEndTime, localTimeZone, isPast };
  }
  
  private enrichClass(session: Class, userTimeZone: string): EnrichedClass {
    const timeDetails = this.convertToUserLocalTime(new Date(session.start_time), userTimeZone);
    return {
      ...session,
      ...timeDetails
    };
  }

  weeklyScheduleForCurrentUser = computed<EnrichedClass[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const userTimeZone = user.time_zone;
    
    const todayForUser = utcToZonedTime(new Date(), userTimeZone);
    const sevenDaysFromNow = new Date(todayForUser);
    sevenDaysFromNow.setDate(todayForUser.getDate() + 7);

    const allUserClasses = this.classes().filter(c => {
        if (user.roles.includes('Admin') || user.roles.includes('OrganizationAdmin') || user.roles.includes('SuperAdmin')) {
            return true;
        }
        const isTeacherForClass = user.roles.includes('Teacher') && c.teacher.id === user.id;
        const isStudentInClass = user.roles.includes('Student') && c.students.some(s => s.id === user.id);
        return isTeacherForClass || isStudentInClass;
    });

    return allUserClasses
      .map(c => this.enrichClass(c, userTimeZone))
      .filter(c => {
        const classZonedTime = utcToZonedTime(new Date(c.start_time), userTimeZone);
        return classZonedTime >= todayForUser && classZonedTime < sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  });

  todaysAgenda = computed<AgendaItem[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    
    const userTimeZone = user.time_zone;
    const nowInUserTz = utcToZonedTime(new Date(), userTimeZone);
    const todayStart = new Date(nowInUserTz.setHours(0,0,0,0));
    const todayEnd = new Date(nowInUserTz.setHours(23,59,59,999));

    const todaysClasses: AgendaItem[] = this.classes()
      .filter(c => {
        const classZonedTime = utcToZonedTime(new Date(c.start_time), userTimeZone);
        return classZonedTime >= todayStart && classZonedTime <= todayEnd;
      })
      .filter(c => {
         if (user.roles.includes('Admin') || user.roles.includes('OrganizationAdmin') || user.roles.includes('SuperAdmin')) {
            return true;
        }
        const isTeacherForClass = user.roles.includes('Teacher') && c.teacher.id === user.id;
        const isStudentInClass = user.roles.includes('Student') && c.students.some(s => s.id === user.id);
        return isTeacherForClass || isStudentInClass;
      })
      .map(c => {
        const enriched = this.enrichClass(c, userTimeZone);
        const otherPerson = user.roles.includes('Student') ? c.teacher.full_name : c.students[0]?.full_name || 'Student';
        return {
            type: 'Class' as const,
            date: format(utcToZonedTime(new Date(c.start_time), userTimeZone), 'yyyy-MM-dd'),
            time: enriched.localStartTime,
            title: `Class with ${otherPerson}`,
            details: `Topics: ${c.title || 'N/A'}`,
            meetLink: c.meet_link,
            status: c.status,
            rawStartTime: c.start_time
        }
      });
      
    return todaysClasses.sort((a, b) => a.rawStartTime.localeCompare(b.rawStartTime));
  });

  // FIX: Implemented missing `enrichSubmission` method to resolve property does not exist error.
  private enrichSubmission(submission: Submission): EnrichedSubmission {
    const now = new Date();
    const dueDate = submission.assignment.due_date ? new Date(submission.assignment.due_date) : null;
    const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;

    let uiStatus: AssignmentUiStatus;
    switch (submission.status) {
        case 'Graded':
            uiStatus = 'Graded';
            break;
        case 'Submitted':
        case 'Late':
            uiStatus = 'Submitted';
            break;
        case 'Pending':
        default:
            uiStatus = 'Assigned';
            break;
    }

    const isLate = submission.status === 'Late' || (!!dueDate && !!submittedAt && submittedAt > dueDate);

    return {
        ...submission,
        uiStatus,
        isLate,
    };
  }

  submissionsForCurrentUser = computed<EnrichedSubmission[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const allSubmissions = this.submissions().filter(s => {
      if (user.roles.includes('Admin') || user.roles.includes('OrganizationAdmin') || user.roles.includes('SuperAdmin')) {
        return true;
      }
      const isTeacherForSubmission = user.roles.includes('Teacher') && s.assignment.course.teacher.id === user.id;
      const isStudentForSubmission = user.roles.includes('Student') && s.student.id === user.id;
      return isTeacherForSubmission || isStudentForSubmission;
    });

    return allSubmissions
      .map(s => this.enrichSubmission(s))
      .sort((a, b) => new Date(b.assignment.due_date ?? 0).getTime() - new Date(a.assignment.due_date ?? 0).getTime());
  });

  conversationsForCurrentUser = computed<EnrichedConversation[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    
    const userConversations = this.conversations().filter(c => 
        c.participants.some(p => p.id === user.id) || 
        c.observers.some(o => o.id === user.id)
    );

    return userConversations.map(c => {
        const lastMessage = this.messages()
            .filter(m => m.conversation_id === c.id)
            .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        return {
            ...c,
            lastMessagePreview: lastMessage ? lastMessage.content.slice(0, 30) + '...' : 'No messages',
            lastMessageTimestamp: lastMessage?.created_at ?? '',
            otherParticipants: c.participants.filter(p => p.id !== user.id)
        };
    });
  });

  // FIX: Completed the definition of `allMessagesEnriched` computed signal.
  allMessagesEnriched = computed<EnrichedMessage[]>(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    
    return this.messages().map(message => ({
        ...message,
        isCurrentUser: message.sender.id === user.id
    }));
  });
  
  // FIX: Added missing method `getStudentFinancials`
  getStudentFinancials(studentId: string): StudentFinancials {
    const studentPayments = this.payments().filter(p => p.student.id === studentId);
    const studentClasses = this.classes().filter(c => c.students.some(s => s.id === studentId));
    const studentEnrollments = this.enrollments().filter(e => e.student.id === studentId);

    const totalAmountPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);
    
    const totalHoursCompleted = studentClasses
        .filter(c => c.status === 'Completed')
        .reduce((acc, c) => acc + ((new Date(c.end_time).getTime() - new Date(c.start_time).getTime()) / 3600000), 0);
    
    const totalAmountBilled = studentEnrollments.reduce((acc, e) => {
        const classCount = studentClasses.filter(c => c.course.id === e.course.id && c.status === 'Completed').length;
        const hoursPerClass = studentClasses.find(c => c.course.id === e.course.id) ? (new Date(studentClasses.find(c => c.course.id === e.course.id)!.end_time).getTime() - new Date(studentClasses.find(c => c.course.id === e.course.id)!.start_time).getTime()) / 3600000 : 1;
        return acc + (classCount * e.hourly_rate * hoursPerClass);
    }, 0);

    const outstandingBalance = totalAmountBilled - totalAmountPaid;

    return {
        totalHoursCompleted,
        totalAmountBilled,
        totalAmountPaid,
        outstandingBalance,
        accountStatus: outstandingBalance > 0 ? 'Due' : 'Paid',
        alert: null // Logic for this can be added
    };
  }

  // FIX: Added missing method `getAssignmentStats`
  getAssignmentStats(studentId: string): AssignmentStats {
      const studentSubmissions = this.submissions().filter(s => s.student.id === studentId);
      
      const now = new Date();
      
      const upcoming = studentSubmissions.filter(s => s.status === 'Pending' && s.assignment.due_date && new Date(s.assignment.due_date) > now).length;
      const overdue = studentSubmissions.filter(s => s.status === 'Pending' && s.assignment.due_date && new Date(s.assignment.due_date) < now).length;
      const needsGrading = studentSubmissions.filter(s => s.status === 'Submitted' || s.status === 'Late').length;
      
      return { upcoming, overdue, needsGrading };
  }

  // FIX: Added missing computed property `enrichedStudents`
  enrichedStudents = computed<EnrichedStudent[]>(() => {
    return this.students().map(student => {
        const financials = this.getStudentFinancials(student.id);
        const assignmentStats = this.getAssignmentStats(student.id);
        const enrollments = this.enrollments().filter(e => e.student.id === student.id);
        return {
            ...student,
            financials,
            assignmentStats,
            enrollments
        };
    });
  });
  
  // FIX: Added missing computed property `rescheduleRequestsForCurrentUser`
  rescheduleRequestsForCurrentUser = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    return this.rescheduleRequests().filter(req => {
        if (user.roles.includes('Admin') || user.roles.includes('OrganizationAdmin') || user.roles.includes('SuperAdmin')) {
            return true;
        }
        const isTeacherForRequest = user.roles.includes('Teacher') && req.class.teacher.id === user.id;
        const isStudentForRequest = user.roles.includes('Student') && req.class.students.some(s => s.id === user.id);
        return isTeacherForRequest || isStudentForRequest;
    });
  });

  // FIX: Added missing methods for component actions
  async logSession(sessionData: { studentId: string; teacherId: string; date: string; startTime: string; durationHours: number; topicsCovered: string; timeZone: string; }): Promise<void> {
    const user = this.authService.currentUser();
    if (!user?.organization_id) throw new Error("User has no organization");

    const startDateTime = zonedTimeToUtc(`${sessionData.date} ${sessionData.startTime}`, sessionData.timeZone);
    const endDateTime = new Date(startDateTime.getTime() + sessionData.durationHours * 60 * 60 * 1000);
    
    const newClass = await this.supabaseService.addSession({
        ...sessionData,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString()
    }, user.organization_id);

    this.classes.update(classes => [...classes, newClass]);
  }
  
  async scheduleClass(classData: { studentId: string; teacherId: string; date: string; startTime: string; durationHours: number; topicsCovered: string; timeZone: string; }): Promise<void> {
    const user = this.authService.currentUser();
    if (!user?.organization_id) throw new Error("User has no organization");

    const startDateTime = zonedTimeToUtc(`${classData.date} ${classData.startTime}`, classData.timeZone);
    const endDateTime = new Date(startDateTime.getTime() + classData.durationHours * 60 * 60 * 1000);

    const newClass = await this.supabaseService.addClass({
        ...classData,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString()
    }, user.organization_id);
    
    this.classes.update(classes => [...classes, newClass]);
  }

  async logPayment(paymentData: { studentId: string; paymentDate: string; amount: number; currency: string; }): Promise<void> {
    const newPayment = await this.supabaseService.addPayment(paymentData);
    this.payments.update(p => [...p, newPayment]);
  }

  async assignTask(taskData: any): Promise<void> {
    const user = this.authService.currentUser();
    if (!user?.organization_id) throw new Error("User has no organization");
    
    const newSubmission = await this.supabaseService.addAssignment(taskData, user.organization_id);
    this.submissions.update(s => [...s, newSubmission]);
  }

  async updateSessionStatus(classId: number, status: SessionStatus): Promise<void> {
    await this.supabaseService.updateClassStatus(classId, status);
    this.classes.update(classes => {
      const index = classes.findIndex(c => c.id === classId);
      if (index > -1) {
        const newClasses = [...classes];
        newClasses[index] = { ...newClasses[index], status };
        return newClasses;
      }
      return classes;
    });
  }

  async submitAssignment(submissionId: number, content: string): Promise<void> {
    await this.supabaseService.updateSubmission(submissionId, content, null, null);
    this.submissions.update(submissions => {
        const index = submissions.findIndex(s => s.id === submissionId);
        if (index > -1) {
            const newSubmissions = [...submissions];
            newSubmissions[index] = { ...newSubmissions[index], status: 'Submitted', content: content, submitted_at: new Date().toISOString() };
            return newSubmissions;
        }
        return submissions;
    });
  }

  async gradeAssignment(submissionId: number, grade: string, feedback: string): Promise<void> {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) {
        throw new Error('Grade must be a number.');
    }
    await this.supabaseService.updateSubmission(submissionId, null, numericGrade, feedback);
    this.submissions.update(submissions => {
        const index = submissions.findIndex(s => s.id === submissionId);
        if (index > -1) {
            const newSubmissions = [...submissions];
            newSubmissions[index] = { ...newSubmissions[index], status: 'Graded', grade: numericGrade, feedback: feedback };
            return newSubmissions;
        }
        return submissions;
    });
  }

  async sendMessage(conversationId: number, content: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;
    await this.supabaseService.addMessage(conversationId, user.id, content);
  }
}
