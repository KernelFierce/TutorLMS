import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ClassSession, EnrichedClassSession, SessionStatus } from '../../models';
import { AuthService } from '../../auth.service';
import { DataService } from '../../data.service';

interface GroupedSession {
  date: string;
  day: string;
  sessions: EnrichedClassSession[];
}

@Component({
  selector: 'app-schedule-view',
  templateUrl: './schedule-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [DatePipe]
})
export class ScheduleViewComponent {
  private datePipe = inject(DatePipe);
  authService = inject(AuthService);
  dataService = inject(DataService);
  currentUser = this.authService.currentUser;

  sessions = input.required<ClassSession[]>();

  private students = this.dataService.students;
  private teachers = this.dataService.teachers;

  private enrichedSessions = computed<EnrichedClassSession[]>(() => {
    const studentsMap = new Map(this.students().map(s => [s.studentId, s]));
    const teachersMap = new Map(this.teachers().map(t => [t.teacherId, t]));
    const now = new Date();

    return this.sessions().map(session => {
      const student = studentsMap.get(session.studentId);
      const sessionDateTime = new Date(`${session.date}T${session.startTime}Z`); // Assume UTC
      const userTimezone = student?.timeZone || 'UTC';

      return {
        ...session,
        studentName: student?.name || 'Unknown Student',
        teacherName: teachersMap.get(session.teacherId)?.name || 'Unknown Teacher',
        localDateStr: this.datePipe.transform(sessionDateTime, 'yyyy-MM-dd', userTimezone) || '',
        localTime: this.datePipe.transform(sessionDateTime, 'shortTime', userTimezone) || '',
        localTimeZone: userTimezone,
        isPast: sessionDateTime < now,
      };
    });
  });

  groupedSessions = computed<GroupedSession[]>(() => {
    const sessionsByDate = this.enrichedSessions().reduce((acc, session) => {
      const key = session.localDateStr;
      (acc[key] = acc[key] || []).push(session);
      return acc;
    }, {} as { [key: string]: EnrichedClassSession[] });

    return Object.keys(sessionsByDate).map(dateStr => {
      const date = new Date(`${dateStr}T00:00:00Z`); // Treat date as UTC
      return {
        date: this.datePipe.transform(date, 'fullDate', 'UTC') || '',
        day: this.datePipe.transform(date, 'EEEE', 'UTC') || '',
        sessions: sessionsByDate[dateStr]
      };
    }).sort((a, b) => a.sessions[0].localDateStr.localeCompare(b.sessions[0].localDateStr));
  });

  updateStatus(classId: string, status: SessionStatus): void {
    // TODO: Implement updateSessionStatus in DataService
    // this.dataService.updateSessionStatus(classId, status);
  }

  cancelSession(classId: string): void {
    if (confirm('Are you sure you want to cancel this session? This action cannot be undone.')) {
      // TODO: Implement cancelSession in DataService
      // this.dataService.cancelSession(classId);
    }
  }

  initiateReschedule(classId: string): void {
    // TODO: Implement initiateReschedule in DataService
    // this.dataService.initiateReschedule(classId);
  }

  requestCancellation(classId: string): void {
    if (confirm('Are you sure you want to request cancellation for this session?')) {
      // TODO: Implement requestCancellation in DataService
      // this.dataService.requestCancellation(classId);
    }
  }
}
