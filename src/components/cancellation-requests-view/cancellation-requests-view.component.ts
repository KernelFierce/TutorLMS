import { Component, ChangeDetectionStrategy, inject, input, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Course } from '../../models';
import { DataService } from '../../data.service';

@Component({
  selector: 'app-cancellation-requests-view',
  templateUrl: './cancellation-requests-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [DatePipe],
})
export class CancellationRequestsViewComponent {
  private dataService = inject(DataService);
  private datePipe = inject(DatePipe);

  requests = input.required<Course[]>();

  private students = this.dataService.students;
  private teachers = this.dataService.teachers;

  enrichedRequests = computed(() => {
    const studentsMap = new Map(this.students().map(s => [s.studentId, s]));
    const teachersMap = new Map(this.teachers().map(t => [t.teacherId, t]));

    return this.requests().map(request => {
      const student = studentsMap.get(request.studentId);
      const teacher = teachersMap.get(request.teacherId);
      const sessionDateTime = new Date(`${request.date}T${request.startTime}Z`);
      const displayTimezone = student?.timeZone || 'UTC';

      return {
        ...request,
        studentName: student?.name || 'Unknown Student',
        teacherName: teacher?.name || 'Unknown Teacher',
        localDateStr: this.datePipe.transform(sessionDateTime, 'fullDate', displayTimezone) || '',
        localTime: this.datePipe.transform(sessionDateTime, 'shortTime', displayTimezone) || '',
      };
    });
  });

  approve(courseId: string): void {
    if (confirm('Are you sure you want to approve this cancellation?')) {
      // TODO: Implement approveCancellation in DataService
      // this.dataService.approveCancellation(courseId);
    }
  }

  deny(courseId: string): void {
    if (confirm('Are you sure you want to deny this cancellation request? The session will be set back to "Scheduled".')) {
      // TODO: Implement denyCancellation in DataService
      // this.dataService.denyCancellation(courseId);
    }
  }
}
