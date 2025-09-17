import { Component, ChangeDetectionStrategy, inject, computed, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { ScheduleViewComponent } from '../schedule-view/schedule-view.component';
import { AssignmentsViewComponent } from '../assignments-view/assignments-view.component';
import { MessagingViewComponent } from '../messaging-view/messaging-view.component';
import { RescheduleViewComponent } from '../reschedule-view/reschedule-view.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-portal',
  templateUrl: './student-portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScheduleViewComponent, AssignmentsViewComponent, MessagingViewComponent, RescheduleViewComponent, FormsModule],
})
export class StudentPortalComponent {
  tutorService = inject(TutorDataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  activeView = signal<'dashboard' | 'schedule' | 'assignments' | 'reschedule-requests' | 'messages'>('dashboard');
  isRequestSessionModalOpen = signal(false);
  newSessionModel = signal({ teacherId: '', dateTime: '' });
  
  // For the modal: available slots for the selected teacher
  teacherAvailabilityForRequest = signal<{date: string, ranges: {startTime: string, endTime: string}[]}[]>([]);

  currentUser = this.authService.currentUser;
  todaysAgenda = this.tutorService.todaysAgenda;
  weeklySchedule = this.tutorService.weeklyScheduleForCurrentUser;
  assignments = this.tutorService.assignmentsForCurrentUser;
  
  studentData = computed(() => {
    const studentId = this.currentUser()?.entityId;
    if (!studentId) return null;
    
    const student = this.tutorService.students().find(s => s.studentId === studentId);
    if (!student) return null;

    return {
      ...student,
      financials: this.tutorService.getStudentFinancials(studentId)
    };
  });

  teachersForStudent = computed(() => {
    const student = this.studentData();
    if (!student) return [];
    return this.tutorService.teachers().filter(t => student.teacherIds.includes(t.teacherId));
  });
  
  setView(view: 'dashboard' | 'schedule' | 'assignments' | 'reschedule-requests' | 'messages'): void {
    this.activeView.set(view);
  }

  openRequestSessionModal(): void {
    this.newSessionModel.set({ teacherId: '', dateTime: '' });
    this.teacherAvailabilityForRequest.set([]);
    this.isRequestSessionModalOpen.set(true);
  }

  closeRequestSessionModal(): void {
    this.isRequestSessionModalOpen.set(false);
  }

  onTeacherSelectForRequest(): void {
    const teacherId = this.newSessionModel().teacherId;
    if (teacherId) {
      // In a real app, you'd fetch this from the backend. Here we filter mock data.
      const allAvail = this.tutorService.teacherAvailability();
      this.teacherAvailabilityForRequest.set(allAvail.filter(a => a.teacherId === teacherId));
    } else {
      this.teacherAvailabilityForRequest.set([]);
    }
  }

  requestNewSession(): void {
    const studentId = this.currentUser()?.entityId;
    const { teacherId, dateTime } = this.newSessionModel();
    if (studentId && teacherId && dateTime) {
      this.tutorService.requestNewSession(studentId, teacherId, dateTime);
      this.closeRequestSessionModal();
    } else {
      alert('Please select a teacher and a time slot.');
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
}
