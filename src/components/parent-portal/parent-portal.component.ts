import { Component, ChangeDetectionStrategy, inject, computed, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { RoleSwitcherComponent } from '../role-switcher/role-switcher.component';
import { EnrichedStudent } from '../../models';
import { ScheduleViewComponent } from '../schedule-view/schedule-view.component';
import { AssignmentsViewComponent } from '../assignments-view/assignments-view.component';

@Component({
  selector: 'app-parent-portal',
  templateUrl: './parent-portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RoleSwitcherComponent, ScheduleViewComponent, AssignmentsViewComponent],
})
export class ParentPortalComponent {
  tutorService = inject(TutorDataService);
  authService = inject(AuthService);

  @Output() logout = new EventEmitter<void>();

  currentUser = this.authService.currentUser;
  selectedStudentId = signal<string | null>(null);

  myStudents = computed<EnrichedStudent[]>(() => {
    const parentId = this.currentUser()?.id;
    if (!parentId) return [];

    const relationships = this.tutorService.studentGuardianRelationships();
    const myStudentIds = relationships
      .filter(r => r.guardian_id === parentId)
      .map(r => r.student_id);

    return this.tutorService.enrichedStudents().filter(s => myStudentIds.includes(s.id));
  });

  selectedStudent = computed<EnrichedStudent | null>(() => {
    const studentId = this.selectedStudentId();
    if (!studentId) return null;
    return this.myStudents().find(s => s.id === studentId) ?? null;
  });
  
  studentSchedule = computed(() => {
    const studentId = this.selectedStudentId();
    if (!studentId) return [];
    return this.tutorService.weeklyScheduleForCurrentUser().filter(c => c.students.some(s => s.id === studentId));
  });

  studentAssignments = computed(() => {
    const studentId = this.selectedStudentId();
    if (!studentId) return [];
    return this.tutorService.submissionsForCurrentUser().filter(s => s.student.id === studentId);
  });

  constructor() {
    effect(() => {
      const students = this.myStudents();
      // If a selected student is no longer in the list, or if no student is selected, select the first one.
      if (students.length > 0 && (!this.selectedStudentId() || !students.some(s => s.id === this.selectedStudentId()))) {
        this.selectedStudentId.set(students[0].id);
      } else if (students.length === 0) {
        this.selectedStudentId.set(null);
      }
    });
  }

  selectStudent(studentId: string): void {
    this.selectedStudentId.set(studentId);
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
