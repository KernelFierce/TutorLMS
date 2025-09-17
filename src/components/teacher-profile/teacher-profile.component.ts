
import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherProfileData, Teacher, Student } from '../../models';
import { AuthService } from '../../auth.service';
import { TutorDataService } from '../../tutor-data.service';
import { AttendanceReportComponent } from '../attendance-report/attendance-report.component';

@Component({
  selector: 'app-teacher-profile',
  templateUrl: './teacher-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, AttendanceReportComponent],
  providers: [DatePipe],
})
export class TeacherProfileComponent {
  // FIX: inject was used but not imported.
  // REFACTOR: Made services private for better encapsulation.
  private authService = inject(AuthService);
  private tutorService = inject(TutorDataService);

  profileData = input.required<TeacherProfileData | null>();
  back = output<void>();
  
  currentUser = this.authService.currentUser;
  
  isEditMode = signal(false);
  editableTeacher = signal<Partial<Teacher>>({});
  
  activeTab = signal<'students' | 'attendance'>('students');

  onBack(): void {
    this.back.emit();
  }
  
  toggleEditMode(): void {
    if (!this.isEditMode()) {
        const currentTeacher = this.profileData()?.teacher;
        if (currentTeacher) {
            this.editableTeacher.set({
                name: currentTeacher.name,
                email: currentTeacher.email,
                timeZone: currentTeacher.timeZone,
            });
        }
    }
    this.isEditMode.update(val => !val);
  }

  saveChanges(): void {
    const teacherId = this.profileData()?.teacher.teacherId;
    if (teacherId) {
        this.tutorService.updateTeacherProfile(teacherId, this.editableTeacher());
        this.isEditMode.set(false);
        alert('Teacher profile updated!');
    }
  }

  getAttendanceRateColor(rate: number | undefined): string {
    if (rate === undefined) return 'text-slate-600';
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  }
}
