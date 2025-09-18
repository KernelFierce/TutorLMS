
import { Component, ChangeDetectionStrategy, input, output, signal, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Teacher, Student, AttendanceData, Course, Attendance } from '../../models';
import { AuthService } from '../../auth.service';
import { DataService } from '../../data.service';
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
  private dataService = inject(DataService);

  teacher = input.required<Teacher>();
  back = output<void>();
  
  currentUser = this.authService.currentUser;
  
  isEditMode = signal(false);
  editableTeacher = signal<Partial<Teacher>>({});
  
  activeTab = signal<'students' | 'attendance'>('students');

  assignedStudents = computed(() => {
    const allStudents = this.dataService.students();
    const teacherId = this.teacher()?.teacherId;
    if (!teacherId) return [];
    return allStudents.filter(s => s.teacherIds.includes(teacherId));
  });

  attendanceData = computed<AttendanceData | null>(() => {
    const teacherId = this.teacher()?.teacherId;
    if (!teacherId) return null;

    const coursesForTeacher = this.dataService.courses().filter(c => c.teacherId === teacherId);
    const courseIds = new Set(coursesForTeacher.map(c => c.courseId));
    const relevantAttendance = this.dataService.attendance().filter(a => courseIds.has(a.courseId));

    const stats = relevantAttendance.reduce((acc, record) => {
        if (record.status === 'Completed') acc.completed++;
        if (record.status === 'Student No Show') acc.studentNoShow++;
        if (record.status === 'Teacher No Show') acc.teacherNoShow++;
        return acc;
    }, { completed: 0, studentNoShow: 0, teacherNoShow: 0 });

    const totalAttended = stats.completed + stats.studentNoShow;
    const attendanceRate = totalAttended > 0 ? (stats.completed / totalAttended) * 100 : 100;

    return {
        id: teacherId,
        name: this.teacher().name,
        totalCompleted: stats.completed,
        totalStudentNoShow: stats.studentNoShow,
        totalTeacherNoShow: stats.teacherNoShow,
        attendanceRate: parseFloat(attendanceRate.toFixed(1))
    };
  });

  onBack(): void {
    this.back.emit();
  }
  
  toggleEditMode(): void {
    if (!this.isEditMode()) {
        const currentTeacher = this.teacher();
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
    const teacherId = this.teacher()?.teacherId;
    if (teacherId) {
        // TODO: Implement updateTeacherProfile in DataService
        // this.dataService.updateTeacherProfile(teacherId, this.editableTeacher());
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
