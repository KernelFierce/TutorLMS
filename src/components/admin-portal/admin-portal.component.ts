import { Component, ChangeDetectionStrategy, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../data.service';
import { ActionFormsComponent } from '../action-forms/action-forms.component';
import { Student, Teacher, Course, Attendance } from '../../models';
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
  dataService = inject(DataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  activeView = signal<'dashboard' | 'master-schedule' | 'students' | 'student-profile' | 'teachers' | 'teacher-profile' | 'assignments' | 'student-attendance' | 'teacher-attendance' | 'reschedule-requests' | 'cancellation-requests' | 'leads' | 'messages'>('dashboard');
  
  // Expose service signals directly
  currentUser = this.authService.currentUser;
  teachers = this.dataService.teachers;
  students = this.dataService.students;
  courses = this.dataService.courses;
  attendance = this.dataService.attendance;

  // State for Master Schedule filters
  selectedTeacherId = signal<string>('all');
  selectedStudentId = signal<string>('all');
  selectedMasterTimezone = signal<string>('UTC');
  
  // State for Students filter
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

  // TODO: Re-implement filtering and data enrichment logic based on the new data structures.
  
  setView(view: any): void {
    this.activeView.set(view);
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
}