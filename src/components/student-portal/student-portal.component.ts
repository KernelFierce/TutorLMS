import { Component, ChangeDetectionStrategy, inject, computed, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { ScheduleViewComponent } from '../schedule-view/schedule-view.component';
import { AssignmentsViewComponent } from '../assignments-view/assignments-view.component';
import { MessagingViewComponent } from '../messaging-view/messaging-view.component';
import { RescheduleViewComponent } from '../reschedule-view/reschedule-view.component';
import { FormsModule } from '@angular/forms';
import { RoleSwitcherComponent } from '../role-switcher/role-switcher.component';

@Component({
  selector: 'app-student-portal',
  templateUrl: './student-portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScheduleViewComponent, AssignmentsViewComponent, MessagingViewComponent, RescheduleViewComponent, FormsModule, RoleSwitcherComponent],
})
export class StudentPortalComponent {
  tutorService = inject(TutorDataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  activeView = signal<'dashboard' | 'schedule' | 'assignments' | 'reschedule-requests' | 'messages'>('dashboard');
  isRequestSessionModalOpen = signal(false);
  newSessionModel = signal({ teacherId: '', dateTime: '' });
  
  teacherAvailabilityForRequest = signal<{date: string, ranges: {startTime: string, endTime: string}[]}[]>([]);

  currentUser = this.authService.currentUser;
  todaysAgenda = this.tutorService.todaysAgenda;
  weeklySchedule = this.tutorService.weeklyScheduleForCurrentUser;
  assignments = this.tutorService.submissionsForCurrentUser;
  
  studentData = computed(() => {
    const studentId = this.currentUser()?.id;
    if (!studentId) return null;
    
    const student = this.tutorService.students().find(s => s.id === studentId);
    if (!student) return null;

    return {
      ...student,
      financials: this.tutorService.getStudentFinancials(studentId)
    };
  });

  teachersForStudent = computed(() => {
    const studentId = this.currentUser()?.id;
    if (!studentId) return [];
    
    const studentEnrollments = this.tutorService.enrollments().filter(e => e.student.id === studentId);
    const teachers = studentEnrollments.map(e => e.course.teacher);
    // Remove duplicates
    const uniqueTeachers = teachers.filter((teacher, index, self) =>
        index === self.findIndex((t) => (
            t.id === teacher.id
        ))
    );
    return uniqueTeachers;
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
      const allAvail = this.tutorService.teacherAvailability();
      this.teacherAvailabilityForRequest.set(allAvail.filter(a => a.teacherId === teacherId));
    } else {
      this.teacherAvailabilityForRequest.set([]);
    }
  }

  async requestNewSession(): Promise<void> {
    const studentId = this.currentUser()?.id;
    const { teacherId, dateTime } = this.newSessionModel();
    if (studentId && teacherId && dateTime) {
      // await this.tutorService.requestNewSession(studentId, teacherId, dateTime);
      alert('Requesting a new session is not yet implemented.');
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
