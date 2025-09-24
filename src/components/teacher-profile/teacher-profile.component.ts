import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Person } from '../../models';
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
  private authService = inject(AuthService);
  private tutorService = inject(TutorDataService);

  profileData = input.required<any | null>();
  back = output<void>();
  
  currentUser = this.authService.currentUser;
  
  isEditMode = signal(false);
  editableTeacher = signal<Partial<Person>>({});
  
  activeTab = signal<'students' | 'attendance'>('students');

  onBack(): void {
    this.back.emit();
  }
  
  toggleEditMode(): void {
    if (!this.isEditMode()) {
        const currentTeacher = this.profileData()?.teacher;
        if (currentTeacher) {
            this.editableTeacher.set({
                full_name: currentTeacher.full_name,
                email: currentTeacher.email,
                time_zone: currentTeacher.time_zone,
            });
        }
    }
    this.isEditMode.update(val => !val);
  }

  async saveChanges(): Promise<void> {
    const teacherId = this.profileData()?.teacher.id;
    if (teacherId) {
        // await this.tutorService.updateTeacherProfile(teacherId, this.editableTeacher());
        this.isEditMode.set(false);
        alert('Teacher profile update not implemented yet.');
    }
  }

  getAttendanceRateColor(rate: number | undefined): string {
    if (rate === undefined) return 'text-slate-600';
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  }
}
