import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { EnrichedClassSession, SessionStatus } from '../../models';
import { AuthService } from '../../auth.service';
import { TutorDataService } from '../../tutor-data.service';

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
  tutorService = inject(TutorDataService);
  currentUser = this.authService.currentUser;

  sessions = input.required<EnrichedClassSession[]>();

  groupedSessions = computed<GroupedSession[]>(() => {
    const sessionsByDate = this.sessions().reduce((acc, session) => {
      const key = session.localDateStr;
      (acc[key] = acc[key] || []).push(session);
      return acc;
    }, {} as { [key: string]: EnrichedClassSession[] });
    
    return Object.keys(sessionsByDate).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return {
        date: this.datePipe.transform(date, 'fullDate', 'UTC') || '',
        day: this.datePipe.transform(date, 'EEEE', 'UTC') || '',
        sessions: sessionsByDate[dateStr]
      };
    }).sort((a,b) => a.sessions[0].localDateStr.localeCompare(b.sessions[0].localDateStr));
  });

  updateStatus(classId: string, status: 'Completed' | 'Student No Show' | 'Teacher No Show'): void {
    this.tutorService.updateSessionStatus(classId, status);
  }

  cancelSession(classId: string): void {
    if (confirm('Are you sure you want to cancel this session? This action cannot be undone.')) {
      this.tutorService.cancelSession(classId);
    }
  }

  initiateReschedule(classId: string): void {
      this.tutorService.initiateReschedule(classId);
  }

  requestCancellation(classId: string): void {
      if(confirm('Are you sure you want to request cancellation for this session?')) {
          this.tutorService.requestCancellation(classId);
      }
  }
}