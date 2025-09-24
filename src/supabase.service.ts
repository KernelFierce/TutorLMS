import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, Person, Student, Teacher, Course, Enrollment, Class, Assignment, Submission, Payment, RescheduleRequest, Message, Conversation, UserRole, SessionStatus, SubmissionStatus, RequestStatus, Invoice } from './models';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabaseUrl = 'https://ouytogcbjczaooyioobd.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eXRvZ2NiamN6YW9veWlvb2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDc2MjUsImV4cCI6MjA3MzcyMzYyNX0.f3Wzt7pSBp1Lc1hpHH1vb-gztkO8vOEdnfuFKNgxXwk';
  private supabaseInstance: SupabaseClient;

  constructor() {
    this.supabaseInstance = createClient(this.supabaseUrl, this.supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabaseInstance;
  }

  private getRoleId(role: UserRole): number {
    switch (role) {
      case 'SuperAdmin': return 1;
      case 'OrganizationAdmin': return 2;
      case 'Admin': return 3;
      case 'Teacher': return 4;
      case 'Student': return 5;
      case 'Parent': return 6;
      default: throw new Error(`Invalid role: ${role}`);
    }
  }

  private async getPeopleByRole(role: UserRole): Promise<Person[]> {
    const roleId = this.getRoleId(role);
    const { data, error } = await this.supabaseInstance
      .from('people')
      .select('*, user_roles!inner(role_id)')
      .eq('user_roles.role_id', roleId);

    if (error) {
        console.error(`Error fetching people for role ${role}:`, error);
        throw error;
    }
    
    return data || [];
  }

  getTeachers = (): Promise<Teacher[]> => this.getPeopleByRole('Teacher');
  getStudents = (): Promise<Student[]> => this.getPeopleByRole('Student');

  async getEnrollments(): Promise<Enrollment[]> {
    const { data, error } = await this.supabaseInstance
      .from('student_enrollments')
      .select(`
        id,
        enrollment_date,
        hourly_rate,
        student:people!student_enrollments_student_id_fkey(*),
        course:courses!inner(
            *,
            teacher:people!courses_teacher_id_fkey(*)
        )
      `);
    if (error) throw error;
    // FIX: Cast through 'unknown' to fix type incompatibility caused by Supabase client's incorrect type inference for nested relations.
    return (data as unknown as Enrollment[]) || [];
  }

  async getClasses(): Promise<Class[]> {
    const { data, error } = await this.supabaseInstance
        .from('classes')
        .select(`
            id, organization_id, start_time, end_time, status, title, meet_link,
            teacher:people!classes_teacher_id_fkey(*),
            course:courses!inner(
                *,
                teacher:people!courses_teacher_id_fkey(*)
            ),
            students:class_attendance!inner(student:people!inner(*))
        `);
    if (error) throw error;
    
    return data.map((c: any) => ({
        ...c,
        students: c.students.map((s: any) => s.student)
    })) || [];
  }

  async getSubmissions(): Promise<Submission[]> {
    const { data, error } = await this.supabaseInstance
        .from('submissions')
        .select(`
            id, status, content, submitted_at, grade, feedback,
            student:people!submissions_student_id_fkey(*),
            assignment:assignments!inner(
                *,
                course:courses!inner(
                    *,
                    teacher:people!courses_teacher_id_fkey(*)
                )
            )
        `);
    if (error) throw error;
    // FIX: Cast through 'unknown' to fix type incompatibility caused by Supabase client's incorrect type inference for nested relations.
    return (data as unknown as Submission[]) || [];
  }

  async getPayments(): Promise<Payment[]> {
    const { data, error } = await this.supabaseInstance
      .from('payments')
      .select(`*, student:people!payments_student_id_fkey(*)`);
    if (error) throw error;
    return data || [];
  }
  
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await this.supabaseInstance
        .from('invoices')
        .select(`*, student:people(*), items:invoice_items(*)`);
    if (error) throw error;
    return data as Invoice[] || [];
  }

  async addSession(sessionData: any, organization_id: string): Promise<any> {
    const { data: enrollments, error: enrollError } = await this.supabaseInstance.from('student_enrollments').select('*, course:courses!inner(*)').eq('student_id', sessionData.studentId).eq('courses.teacher_id', sessionData.teacherId);
    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) throw new Error('No matching enrollment found for the student and teacher.');
    const courseId = enrollments[0].course.id;

    const { data, error } = await this.supabaseInstance.from('classes').insert({ course_id: courseId, organization_id, teacher_id: sessionData.teacherId, start_time: sessionData.start_time, end_time: sessionData.end_time, status: 'Completed', title: sessionData.topicsCovered }).select().single();
    if (error) throw error;

    const { error: attendanceError } = await this.supabaseInstance.from('class_attendance').insert({ class_id: data.id, student_id: sessionData.studentId, status: 'Present' });
    if (attendanceError) throw attendanceError;
    
    return data;
  }

  async addClass(classData: any, organization_id: string): Promise<any> {
      const { data: enrollments, error: enrollError } = await this.supabaseInstance.from('student_enrollments').select('*, course:courses!inner(*)').eq('student_id', classData.studentId).eq('courses.teacher_id', classData.teacherId);
      if (enrollError) throw enrollError;
      if (!enrollments || enrollments.length === 0) throw new Error('No matching enrollment found for the student and teacher.');
      const courseId = enrollments[0].course.id;

      const { data, error } = await this.supabaseInstance.from('classes').insert({ course_id: courseId, organization_id, teacher_id: classData.teacherId, start_time: classData.start_time, end_time: classData.end_time, status: 'Scheduled', title: classData.topicsCovered }).select().single();
      if (error) throw error;

      // Use a placeholder status for future attendance
      const { error: attendanceError } = await this.supabaseInstance.from('class_attendance').insert({ class_id: data.id, student_id: classData.studentId, status: 'Excused' });
      if (attendanceError) throw attendanceError;

      return data;
  }
  
  async updateClassStatus(classId: number, status: SessionStatus): Promise<void> {
    const { error } = await this.supabaseInstance
      .from('classes')
      .update({ status: status })
      .eq('id', classId);

    if (error) {
      console.error('Error updating class status:', error);
      throw error;
    }

    // Also update the attendance record
    let attendanceStatus;
    if (status === 'Completed') attendanceStatus = 'Present';
    else if (status === 'Student No Show') attendanceStatus = 'Absent';
    else if (status === 'Cancelled') attendanceStatus = 'Excused';

    if (attendanceStatus) {
      const { error: attendanceError } = await this.supabaseInstance
        .from('class_attendance')
        .update({ status: attendanceStatus })
        .eq('class_id', classId);
      
      if (attendanceError) {
        console.error('Error updating attendance status:', attendanceError);
        // Don't re-throw, as the main status update succeeded.
      }
    }
  }

  async addPayment(paymentData: any): Promise<Payment> {
      const { data, error } = await this.supabaseInstance.from('payments').insert({ student_id: paymentData.studentId, payment_date: paymentData.paymentDate, amount: paymentData.amount, method: paymentData.currency }).select(`*, student:people!payments_student_id_fkey(*)`).single();
      if (error) throw error;
      return data;
  }

  async addAssignment(taskData: any, organization_id: string): Promise<Submission> {
    const { data: studentEnrollments } = await this.supabaseInstance
        .from('student_enrollments')
        .select('course_id')
        .eq('student_id', taskData.studentId);

    if (!studentEnrollments || studentEnrollments.length === 0) {
        throw new Error('Student is not enrolled in any courses.');
    }

    const { data: courseData, error: courseError } = await this.supabaseInstance
        .from('courses')
        .select('id')
        .eq('teacher_id', taskData.teacherId)
        .in('id', studentEnrollments.map(e => e.course_id))
        .limit(1)
        .single();

    if (courseError || !courseData) {
        console.error('Course lookup error:', courseError);
        throw new Error('No matching course found for the selected student and teacher.');
    }

    const courseId = courseData.id;

    const { data: assignment, error: assignError } = await this.supabaseInstance
        .from('assignments')
        .insert({
            course_id: courseId,
            organization_id,
            title: taskData.title,
            description: taskData.instructions,
            due_date: taskData.dueDate,
            status: 'Published'
        })
        .select()
        .single();
        
    if (assignError) {
        console.error('Assignment creation error:', assignError);
        throw assignError;
    }

    const { error: subError } = await this.supabaseInstance
        .from('submissions')
        .insert({
            assignment_id: assignment.id,
            student_id: taskData.studentId,
            status: 'Pending' as SubmissionStatus
        });

    if (subError) {
        console.error('Submission creation error:', subError);
        throw subError;
    }

    const { data: newSubmission, error: fetchError } = await this.supabaseInstance
        .from('submissions')
        .select(`
            id, status, content, submitted_at, grade, feedback,
            student:people!submissions_student_id_fkey(*),
            assignment:assignments!inner(
                *,
                course:courses!inner(
                    *,
                    teacher:people!courses_teacher_id_fkey(*)
                )
            )
        `)
        .eq('assignment_id', assignment.id)
        .eq('student_id', taskData.studentId)
        .single();

    if (fetchError) {
        console.error('Error fetching new submission:', fetchError);
        throw fetchError;
    }

    // FIX: Cast through 'unknown' to fix type incompatibility caused by Supabase client's incorrect type inference for nested relations.
    return newSubmission as unknown as Submission;
  }

  async updateSubmission(submissionId: number, content: string | null, grade: number | null, feedback: string | null): Promise<void> {
      const updateData: any = {};
      if (content) {
          updateData.content = content;
          updateData.status = 'Submitted';
          updateData.submitted_at = new Date().toISOString();
      }
      if (grade !== null) {
          updateData.grade = grade;
          updateData.status = 'Graded';
      }
      if (feedback) updateData.feedback = feedback;
      
      const { error } = await this.supabaseInstance.from('submissions').update(updateData).eq('id', submissionId);
      if (error) throw error;
  }

  async updateRescheduleRequest(requestId: number, update: Partial<RescheduleRequest>): Promise<void> {
      const { error } = await this.supabaseInstance.from('reschedule_requests').update(update).eq('id', requestId);
      if (error) throw error;
  }

  async addMessage(conversationId: number, senderId: string, content: string): Promise<Message> {
      const { data, error } = await this.supabaseInstance.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, content }).select('*, sender:people!messages_sender_id_fkey(*)').single();
      if (error) throw error;
      return data;
  }

  async getLeads(): Promise<Lead[]> {
    const { data, error } = await this.supabaseInstance.from('prospects').select('*');
    if (error) throw error;
    return data.map(p => ({
        id: p.id.toString(), timestamp: p.created_at, name: p.full_name,
        contactEmail: p.email, timeZone: 'UTC', subjectOfInterest: 'N/A', status: p.status
    })) || [];
  }

  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await this.supabaseInstance.from('conversations').select('*, participants:conversation_participants(person:people(*), is_observer)');
    if (error) throw error;
    return data.map((c: any) => ({
        id: c.id, organization_id: c.organization_id, title: c.title,
        participants: c.participants.filter((p: any) => !p.is_observer).map((p: any) => p.person),
        observers: c.participants.filter((p: any) => p.is_observer).map((p: any) => p.person)
    })) || [];
  }

  async getMessages(): Promise<Message[]> {
    const { data, error } = await this.supabaseInstance.from('messages').select('*, sender:people!messages_sender_id_fkey(*)');
    if (error) throw error;
    return data || [];
  }
  
  async getRescheduleRequests(): Promise<RescheduleRequest[]> {
     const { data, error } = await this.supabaseInstance.from('reschedule_requests').select(`*, 
        requesting_person:people(*), 
        class:classes!inner(
            *, 
            teacher:people(*), 
            students:class_attendance!inner(student:people!inner(*)), 
            course:courses(*)
        )`);
     if (error) throw error;
     return data.map((req: any) => ({ ...req, class: { ...req.class, students: req.class.students.map((s: any) => s.student) } })) || [];
  }
  
  // FIX: Added missing `getStudentGuardianRelationships` method.
  async getStudentGuardianRelationships(): Promise<{student_id: string, guardian_id: string}[]> {
    const { data, error } = await this.supabaseInstance.from('student_guardian_relationships').select('student_id, guardian_id');
    if (error) throw error;
    return data || [];
  }
  
  async createOrganization(orgName: string, adminName: string, adminEmail: string, adminPass: string): Promise<any> {
    const { data, error } = await this.supabaseInstance.functions.invoke('create-organization', {
      body: { org_name: orgName, admin_name: adminName, admin_email: adminEmail, admin_pass: adminPass },
    });
    if (error) throw error;
    return data;
  }
  
  subscribeToMessages(callback: (payload: Message) => void): void {
    this.supabaseInstance
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
            const { data, error } = await this.supabaseInstance.from('messages').select('*, sender:people!messages_sender_id_fkey(*)').eq('id', payload.new.id).single();
            if (error) {
                console.error('Error fetching new message', error);
            } else {
                callback(data as Message);
            }
        })
        .subscribe();
  }

  subscribeToRescheduleRequests(callback: (payload: RescheduleRequest) => void): void {
      this.supabaseInstance
          .channel('public:reschedule_requests')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reschedule_requests' }, async (payload) => {
              // FIX: Cast payload to `any` to safely access `id` property.
              const id = (payload.new as any).id || (payload.old as any).id;
              const { data, error } = await this.supabaseInstance.from('reschedule_requests').select(`*, requesting_person:people(*), class:classes!inner(*, teacher:people(*), students:class_attendance!inner(student:people!inner(*)), course:courses(*))`).eq('id', id).single();
               if (error) {
                  console.error('Error fetching updated reschedule request', error);
              } else {
                  const req = data as any;
                  callback({ ...req, class: { ...req.class, students: req.class.students.map((s: any) => s.student) } });
              }
          })
          .subscribe();
  }
}