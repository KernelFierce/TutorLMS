

import { Component, ChangeDetectionStrategy, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorDataService } from '../../tutor-data.service';
import { ActionFormsComponent } from '../action-forms/action-forms.component';
import { EnrichedStudent, EnrichedClassSession, Teacher, Student, UserRole } from '../../models';
import { AuthService } from '../../auth.service';
import { AssignmentsViewComponent } from '../assignments-view/assignments-view.component';
import { MessagingViewComponent } from '../messaging-view/messaging-view.component';
import { ScheduleViewComponent } from '../schedule-view/schedule-view.component';
import { AttendanceReportComponent } from '../attendance-report/attendance-report.component';
import { RescheduleViewComponent } from '../reschedule-view/reschedule-view.component';
import { CancellationRequestsViewComponent } from '../cancellation-requests-view/cancellation-requests-view.component';
import { StudentProfileComponent } from '../student-profile/student-profile.component';
import { TeacherProfileComponent } from '../teacher-profile/teacher-profile.component';


@Component({
  selector: 'app-admin-portal',
  templateUrl: './admin-portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ActionFormsComponent, AssignmentsViewComponent, MessagingViewComponent, ScheduleViewComponent, AttendanceReportComponent, RescheduleViewComponent, CancellationRequestsViewComponent, StudentProfileComponent, TeacherProfileComponent],
})
export class AdminPortalComponent {
  tutorService = inject(TutorDataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  activeView = signal<'dashboard' | 'master-schedule' | 'students' | 'student-profile' | 'teachers' | 'teacher-profile' | 'assignments' | 'student-attendance' | 'teacher-attendance' | 'reschedule-requests' | 'cancellation-requests' | 'leads' | 'messages'>('dashboard');
  
  // Expose service computed signals directly
  currentUser = this.authService.currentUser;
  todaysAgenda = this.tutorService.todaysAgenda;
  financialOverview = this.tutorService.financialOverview;
  leads = this.tutorService.leads;
  assignments = this.tutorService.assignmentsForCurrentUser;
  teachers = this.tutorService.teachers;
  allStudents = this.tutorService.students;
  studentAttendance = this.tutorService.studentAttendanceData;
  teacherAttendance = this.tutorService.teacherAttendanceData;
  rescheduleRequests = this.tutorService.rescheduleRequestsForCurrentUser;
  cancellationRequests = this.tutorService.cancellationRequestsForAdmin;
  
  // State for Master Schedule filters
  selectedTeacherId = signal<string>('all');
  selectedStudentId = signal<string>('all');
  // FIX: Using Intl.DateTimeFormat().resolvedOptions().timeZone can be unreliable in some environments.
  // Defaulting to 'UTC' for consistency, as suggested by other comments about Intl API limitations in the project.
  selectedMasterTimezone = signal<string>('UTC');
  
  // State for Students filter
  studentStatusFilter = signal<'All' | 'Active' | 'Inactive'>('All');
  
  profileStudentId = signal<string | null>(null);
  profileTeacherId = signal<string | null>(null);

  // FIX: Intl.supportedValuesOf('timeZone') is not available in this environment.
  // Using a curated list of common timezones instead.
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
  
  filteredSchedule = computed<EnrichedClassSession[]>(() => {
    const allSessions = this.tutorService.weeklyScheduleForCurrentUser();
    const teacherId = this.selectedTeacherId();
    const studentId = this.selectedStudentId();

    return allSessions.filter(session => {
        const teacherMatch = teacherId === 'all' || session.teacherId === teacherId;
        const studentMatch = studentId === 'all' || session.studentId === studentId;
        return teacherMatch && studentMatch;
    });
  });

  enrichedStudents = computed<EnrichedStudent[]>(() => {
    return this.tutorService.students().map(student => ({
      ...student,
      financials: this.tutorService.getStudentFinancials(student.studentId)
    }));
  });

  filteredStudents = computed(() => {
    const filter = this.studentStatusFilter();
    if (filter === 'All') {
      return this.enrichedStudents();
    }
    return this.enrichedStudents().filter(s => s.status === filter);
  });
  
  selectedStudentProfile = computed(() => {
    const studentId = this.profileStudentId();
    if (!studentId) return null;
    
    const student = this.enrichedStudents().find(s => s.studentId === studentId);
    if (!student) return null;

    return {
      student,
      schedule: this.tutorService.scheduleForSelectedStudent(studentId),
      assignments: this.tutorService.assignmentsForSelectedStudent(studentId),
      attendance: this.tutorService.attendanceForSelectedStudent(studentId),
      lessonPlans: this.tutorService.lessonPlansForSelectedStudent(studentId)
    };
  });

  selectedTeacherProfile = computed(() => {
    const teacherId = this.profileTeacherId();
    if (!teacherId) return null;
    return this.tutorService.getTeacherProfileData(teacherId);
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

  convertLead(leadId: string): void {
    if (confirm('Are you sure you want to convert this lead to a student?')) {
        const newStudentId = this.tutorService.convertLeadToStudent(leadId);
        alert('Lead converted successfully!');
        this.viewProfile({id: newStudentId, role: 'Student'});
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
    this.tutorService.queuePaymentReminder(studentId);
    alert('Reminder queued for review.');
  }

  approveReminder(studentId: string): void {
    this.tutorService.approveAndSendReminder(studentId);
    alert('Reminder approved and sent!');
  }
}
