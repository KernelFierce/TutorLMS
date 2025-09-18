import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Student, Course, Assignment, Attendance, LessonPlan, StudentStatus } from '../../models';
import { DataService } from '../../data.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-student-profile',
  templateUrl: './student-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
})
export class StudentProfileComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  
  student = input.required<Student>();
  schedule = input.required<Course[]>();
  assignments = input.required<Assignment[]>();
  attendance = input.required<Attendance | null>();
  lessonPlans = input.required<LessonPlan[]>();

  back = output<void>();
  
  currentUser = this.authService.currentUser;
  
  isEditMode = signal(false);
  editableStudent = signal<Partial<Student>>({});
  
  newLessonPlanModel = signal({ topics: '', notes: '' });
  activeTab = signal<'schedule' | 'assignments' | 'attendance' | 'plans'>('schedule');

  onBack(): void {
    this.back.emit();
  }
  
  toggleEditMode(): void {
    if (!this.isEditMode()) {
        const currentStudent = this.student();
        this.editableStudent.set({
            name: currentStudent.name,
            authorizedEmail: currentStudent.authorizedEmail,
            hourlyRate: currentStudent.hourlyRate,
            timeZone: current.timeZone,
            status: currentStudent.status
        });
    }
    this.isEditMode.update(val => !val);
  }

  saveChanges(): void {
    // TODO: Implement updateStudentProfile in DataService
    // this.dataService.updateStudentProfile(this.student().studentId, this.editableStudent());
    this.isEditMode.set(false);
    alert('Student profile updated!');
  }
  
  addLessonPlan(): void {
    const planData = this.newLessonPlanModel();
    if (!planData.topics) {
      alert('Please enter topics for the lesson plan.');
      return;
    }
    
    // TODO: Implement addLessonPlan in DataService
    // this.dataService.addLessonPlan({
    //   studentId: this.student().studentId,
    //   teacherId: this.currentUser()?.entityId || '', 
    //   date: new Date().toISOString().split('T')[0],
    //   ...planData
    // });

    this.newLessonPlanModel.set({ topics: '', notes: ''});
    alert('Lesson plan added!');
  }

  getAssignmentStatusColor(status: string): string {
    switch (status) {
      case 'Assigned': return 'bg-blue-100 text-blue-800';
      case 'Submitted': return 'bg-yellow-100 text-yellow-800';
      case 'Graded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getAttendanceRateColor(rate: number | undefined): string {
    if (rate === undefined) return 'text-slate-600';
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  }
}
