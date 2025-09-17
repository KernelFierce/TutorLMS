import { Component, ChangeDetectionStrategy, input, output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceData, UserRole } from '../../models';

@Component({
  selector: 'app-attendance-report',
  templateUrl: './attendance-report.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AttendanceReportComponent {
  data = input.required<AttendanceData[]>();
  reportType = input.required<'Student' | 'Teacher'>();
  
  viewProfile = output<{id: string, role: UserRole}>();

  onViewProfile(id: string): void {
      this.viewProfile.emit({id, role: this.reportType()});
  }

  getRateColor(rate: number): string {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  }
}
