import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrichedStudent, Student } from '../../models';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-student-profile',
  templateUrl: './student-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
})
export class StudentProfileComponent {
  private tutorService = inject(TutorDataService);
  private authService = inject(AuthService);
  
  student = input.required<EnrichedStudent>();

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
            full_name: currentStudent.full_name,
            email: currentStudent.email,
            time_zone: currentStudent.time_zone,
            is_active: currentStudent.is_active
        });
    }
    this.isEditMode.update(val => !val);
  }

  async saveChanges(): Promise<void> {
    // await this.tutorService.updateStudentProfile(this.student().id, this.editableStudent());
    this.isEditMode.set(false);
    alert('Student profile update not implemented yet.');
  }
  
  async addLessonPlan(): Promise<void> {
    const planData = this.newLessonPlanModel();
    if (!planData.topics) {
      alert('Please enter topics for the lesson plan.');
      return;
    }
    
    // await this.tutorService.addLessonPlan({
    //   studentId: this.student().id,
    //   teacherId: this.currentUser()?.id || '', 
    //   date: new Date().toISOString().split('T')[0],
    //   ...planData
    // });

    this.newLessonPlanModel.set({ topics: '', notes: ''});
    alert('Lesson plan creation not implemented yet.');
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
