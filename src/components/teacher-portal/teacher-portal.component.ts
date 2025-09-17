import { Component, ChangeDetectionStrategy, inject, computed, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../data.service';
import { AuthService } from '../../auth.service';
import { Student, Course, LessonPlan } from '../../models';
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
  dataService = inject(DataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  activeView = signal<'dashboard' | 'students' | 'student-profile' | 'planner' | 'assignments' | 'reschedule-requests' | 'messages' | 'my-profile'>('dashboard');

  currentUser = this.authService.currentUser;
  students = this.dataService.students;
  courses = this.dataService.courses;

  profileStudentId = signal<string | null>(null);
  
  isAddPlanModalOpen = signal(false);
  planForStudentId = signal<string | null>(null);
  newLessonPlanModel = signal({ topics: '', notes: '' });

  // TODO: Re-implement student and profile logic based on the new data structures.

  setView(view: any): void {
    this.activeView.set(view);
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
    
    // TODO: Implement addLessonPlan in DataService
    // this.dataService.addLessonPlan(...);

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