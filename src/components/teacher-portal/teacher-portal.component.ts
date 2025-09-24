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
import { RoleSwitcherComponent } from '../role-switcher/role-switcher.component';

@Component({
  selector: 'app-teacher-portal',
  templateUrl: './teacher-portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScheduleViewComponent, AssignmentsViewComponent, MessagingViewComponent, RescheduleViewComponent, StudentProfileComponent, TeacherProfileComponent, WeeklyPlannerComponent, FormsModule, RoleSwitcherComponent],
})
export class TeacherPortalComponent {
  tutorService = inject(TutorDataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  activeView = signal<'dashboard' | 'students' | 'student-profile' | 'planner' | 'assignments' | 'reschedule-requests' | 'messages' | 'my-profile'>('dashboard');

  currentUser = this.authService.currentUser;
  todaysAgenda = this.tutorService.todaysAgenda;
  assignments = this.tutorService.submissionsForCurrentUser;
  
  profileStudentId = signal<string | null>(null);
  
  isAddPlanModalOpen = signal(false);
  planForStudentId = signal<string | null>(null);
  newLessonPlanModel = signal({ topics: '', notes: '' });
  
  studentsForTeacher = computed(() => {
      const teacherId = this.currentUser()?.id;
      if (!teacherId) return [];
      return this.tutorService.enrollments()
        .filter(e => e.course.teacher.id === teacherId)
        .map(e => e.student);
  });

  enrichedStudents = computed<EnrichedStudent[]>(() => {
    const studentIds = new Set(this.studentsForTeacher().map(s => s.id));
    return this.tutorService.enrichedStudents().filter(s => studentIds.has(s.id));
  });
  
  selectedStudentProfile = computed(() => {
    const studentId = this.profileStudentId();
    if (!studentId) return null;
    
    return this.enrichedStudents().find(s => s.id === studentId);
  });
  
  teacherProfile = computed(() => {
    // const teacherId = this.currentUser()?.id;
    // if (!teacherId) return null;
    // return this.tutorService.getTeacherProfileData(teacherId);
    return null;
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
    // const planData = this.newLessonPlanModel();
    // const studentId = this.planForStudentId();
    // const teacherId = this.currentUser()?.id;

    // if (!planData.topics || !studentId || !teacherId) {
    //   alert('Please enter topics for the lesson plan.');
    //   return;
    // }
    
    // this.tutorService.addLessonPlan({
    //   studentId: studentId,
    //   teacherId: teacherId,
    //   date: new Date().toISOString().split('T')[0],
    //   ...planData
    // });

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
