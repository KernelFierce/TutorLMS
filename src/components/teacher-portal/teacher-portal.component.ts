import { Component, ChangeDetectionStrategy, inject, computed, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { EnrichedStudent, UserRole, LessonPlan } from '../../models';
import { ScheduleViewComponent } from '../schedule-view/schedule-view.component';
import { AssignmentsViewComponent } from '../assignments-view/assignments-view.component';
import { MessagingViewComponent } from '../messaging-view/messaging-view.component';
import { RescheduleViewComponent } from '../reschedule-view/reschedule-view.component';
import { StudentProfileComponent } from '../student-profile/student-profile.component';
import { TeacherProfileComponent } from '../teacher-profile/teacher-profile.component';
import { WeeklyPlannerComponent } from '../weekly-planner/weekly-planner.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teacher-portal',
  templateUrl: './teacher-portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScheduleViewComponent, AssignmentsViewComponent, MessagingViewComponent, RescheduleViewComponent, StudentProfileComponent, TeacherProfileComponent, WeeklyPlannerComponent, FormsModule],
})
export class TeacherPortalComponent {
  tutorService = inject(TutorDataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  activeView = signal<'dashboard' | 'students' | 'student-profile' | 'planner' | 'assignments' | 'reschedule-requests' | 'messages' | 'my-profile'>('dashboard');

  currentUser = this.authService.currentUser;
  todaysAgenda = this.tutorService.todaysAgenda;
  assignments = this.tutorService.assignmentsForCurrentUser;
  
  profileStudentId = signal<string | null>(null);
  
  isAddPlanModalOpen = signal(false);
  planForStudentId = signal<string | null>(null);
  newLessonPlanModel = signal({ topics: '', notes: '' });

  enrichedStudents = computed<EnrichedStudent[]>(() => {
    return this.tutorService.studentsForCurrentUser().map(student => ({
      ...student,
      financials: this.tutorService.getStudentFinancials(student.studentId),
      assignmentStats: this.tutorService.getStudentAssignmentStats(student.studentId)
    }));
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
  
  teacherProfile = computed(() => {
    const teacherId = this.currentUser()?.entityId;
    if (!teacherId) return null;
    return this.tutorService.getTeacherProfileData(teacherId);
  });
  
  setView(view: any): void {
    if (view !== 'student-profile') {
        this.profileStudentId.set(null);
    }
    this.activeView.set(view);
  }

  viewStudentProfile(studentId: string): void {
      this.profileStudentId.set(studentId);
      this.setView('student-profile');
  }

  openAddPlanModal(studentId: string): void {
    this.planForStudentId.set(studentId);
    this.newLessonPlanModel.set({ topics: '', notes: '' });
    this.isAddPlanModalOpen.set(true);
  }

  closeAddPlanModal(): void {
    this.isAddPlanModalOpen.set(false);
  }

  addLessonPlan(): void {
    const planData = this.newLessonPlanModel();
    const studentId = this.planForStudentId();
    const teacherId = this.currentUser()?.entityId;

    if (!planData.topics || !studentId || !teacherId) {
      alert('Please enter topics for the lesson plan.');
      return;
    }
    
    this.tutorService.addLessonPlan({
      studentId: studentId,
      teacherId: teacherId,
      date: new Date().toISOString().split('T')[0],
      ...planData
    });

    alert('Lesson plan added successfully!');
    this.closeAddPlanModal();
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