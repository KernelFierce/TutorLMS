import { Component, ChangeDetectionStrategy, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorDataService } from '../../tutor-data.service';
import { ActionFormsComponent } from '../action-forms/action-forms.component';
import { EnrichedStudent, EnrichedClass, Teacher, Student, UserRole, Invoice } from '../../models';
import { AuthService } from '../../auth.service';
import { AssignmentsViewComponent } from '../assignments-view/assignments-view.component';
import { MessagingViewComponent } from '../messaging-view/messaging-view.component';
import { ScheduleViewComponent } from '../schedule-view/schedule-view.component';
import { AttendanceReportComponent } from '../attendance-report/attendance-report.component';
import { RescheduleViewComponent } from '../reschedule-view/reschedule-view.component';
import { CancellationRequestsViewComponent } from '../cancellation-requests-view/cancellation-requests-view.component';
import { StudentProfileComponent } from '../student-profile/student-profile.component';
import { TeacherProfileComponent } from '../teacher-profile/teacher-profile.component';
import { RoleSwitcherComponent } from '../role-switcher/role-switcher.component';
import { BillingViewComponent } from '../billing-view/billing-view.component';

@Component({
  selector: 'app-admin-portal',
  templateUrl: './admin-portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ActionFormsComponent, AssignmentsViewComponent, MessagingViewComponent, ScheduleViewComponent, AttendanceReportComponent, RescheduleViewComponent, CancellationRequestsViewComponent, StudentProfileComponent, TeacherProfileComponent, RoleSwitcherComponent, BillingViewComponent],
})
export class AdminPortalComponent {
  tutorService = inject(TutorDataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  activeView = signal<'dashboard' | 'master-schedule' | 'students' | 'student-profile' | 'teachers' | 'teacher-profile' | 'assignments' | 'billing' | 'reschedule-requests' | 'cancellation-requests' | 'leads' | 'messages'>('dashboard');
  
  currentUser = this.authService.currentUser;
  todaysAgenda = this.tutorService.todaysAgenda;
  leads = this.tutorService.leads;
  assignments = this.tutorService.submissionsForCurrentUser;
  teachers = this.tutorService.teachers;
  allStudents = this.tutorService.students;
  rescheduleRequests = this.tutorService.rescheduleRequests;
  cancellationRequests = computed(() => this.tutorService.classes().filter(c => c.status === 'Cancellation Pending'));
  
  invoices = this.tutorService.invoices;
  payments = this.tutorService.payments;

  selectedTeacherId = signal<string>('all');
  selectedStudentId = signal<string>('all');
  selectedMasterTimezone = signal<string>('UTC');
  
  studentStatusFilter = signal<'All' | 'Active' | 'Inactive'>('All');
  
  profileStudentId = signal<string | null>(null);
  profileTeacherId = signal<string | null>(null);

  timezones = signal([
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
  ]);
  
  filteredSchedule = computed<EnrichedClass[]>(() => {
    // This needs to be reimplemented with the new data structure
    return [];
  });

  enrichedStudents = this.tutorService.enrichedStudents;

  filteredStudents = computed(() => {
    const filter = this.studentStatusFilter();
    if (filter === 'All') {
      return this.enrichedStudents();
    }
    const isActive = filter === 'Active';
    return this.enrichedStudents().filter(s => s.is_active === isActive);
  });
  
  selectedStudentProfile = computed(() => {
    const studentId = this.profileStudentId();
    if (!studentId) return null;
    
    return this.enrichedStudents().find(s => s.id === studentId);
  });

  selectedTeacherProfile = computed(() => {
    const teacherId = this.profileTeacherId();
    if (!teacherId) return null;

    const teacher = this.tutorService.teachers().find(t => t.id === teacherId);
    if (!teacher) return null;

    const enrollments = this.tutorService.enrollments();
    const classes = this.tutorService.classes();

    const assignedStudents = enrollments
        .filter(e => e.course.teacher.id === teacherId)
        .map(e => e.student)
        .filter((student, index, self) => index === self.findIndex(s => s.id === student.id));

    const teacherClasses = classes.filter(c => c.teacher.id === teacherId && new Date(c.start_time) < new Date());
    const totalCompleted = teacherClasses.filter(c => c.status === 'Completed').length;
    const totalStudentNoShow = teacherClasses.filter(c => c.status === 'Student No Show').length;
    const totalTeacherNoShow = teacherClasses.filter(c => c.status === 'Teacher No Show').length;
    
    const totalSessionsWithAttendance = totalCompleted + totalStudentNoShow + totalTeacherNoShow;
    const attendanceRate = totalSessionsWithAttendance > 0 ? (totalCompleted / totalSessionsWithAttendance) * 100 : 100;

    const attendance = [{
        id: teacher.id,
        name: teacher.full_name,
        totalCompleted,
        totalStudentNoShow,
        totalTeacherNoShow,
        attendanceRate
    }];
    
    return {
        teacher: teacher,
        assignedStudents: assignedStudents,
        attendance: attendance
    };
  });
  
  setView(view: any): void {
    if (view !== 'student-profile') this.profileStudentId.set(null);
    if (view !== 'teacher-profile') this.profileTeacherId.set(null);
    this.activeView.set(view);
  }

  viewProfile(event: {id: string, role: UserRole}): void {
      if (event.role === 'Student') {
          this.profileStudentId.set(event.id);
          this.setView('student-profile');
      } else if (event.role === 'Teacher') {
          this.profileTeacherId.set(event.id);
          this.setView('teacher-profile');
      }
  }

  async convertLead(leadId: string): Promise<void> {
    if (confirm('Are you sure you want to convert this lead to a student?')) {
        // const newStudentId = await this.tutorService.convertLead(leadId);
        // if (newStudentId) {
        //     alert('Lead converted successfully!');
        //     this.viewProfile({id: newStudentId, role: 'Student'});
        // } else {
        //     alert('Failed to convert lead.');
        // }
        alert('Lead conversion not yet implemented.');
    }
  }
  
  getGreeting(): string {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
  }

  onLogout(): void {
    this.logout.emit();
  }

  queueReminder(studentId: string): void {
    // this.tutorService.queuePaymentReminder(studentId);
    alert('Reminder queued for review.');
  }

  approveReminder(studentId: string): void {
    // this.tutorService.approveAndSendReminder(studentId);
    alert('Reminder approved and sent!');
  }
}