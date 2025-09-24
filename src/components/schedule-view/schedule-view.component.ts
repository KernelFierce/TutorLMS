import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { EnrichedClass, SessionStatus } from '../../models';
import { AuthService } from '../../auth.service';
import { TutorDataService } from '../../tutor-data.service';
import { format } from 'date-fns-tz';


interface GroupedSession {
  date: string;
  day: string;
  sessions: EnrichedClass[];
}

@Component({
  selector: 'app-schedule-view',
  templateUrl: './schedule-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [DatePipe]
})
export class ScheduleViewComponent {
  // FIX: Explicitly type `datePipe` to resolve compiler error.
  private datePipe: DatePipe = inject(DatePipe);
  authService = inject(AuthService);
  tutorService = inject(TutorDataService);
  currentUser = this.authService.currentUser;

  sessions = input.required<EnrichedClass[]>();

  groupedSessions = computed<GroupedSession[]>(() => {
    const sessionsByDate = this.sessions().reduce((acc, session) => {
      const zonedDate = new Date(session.start_time);
      const key = format(zonedDate, 'yyyy-MM-dd', { timeZone: session.localTimeZone });
      (acc[key] = acc[key] || []).push(session);
      return acc;
    }, {} as { [key: string]: EnrichedClass[] });
    
    return Object.keys(sessionsByDate).map(dateStr => {
      const date = new Date(dateStr + 'T00:00:00Z'); // Treat as UTC midnight for formatting
      return {
        date: this.datePipe.transform(date, 'fullDate', 'UTC') || '',
        day: this.datePipe.transform(date, 'EEEE', 'UTC') || '',
        sessions: sessionsByDate[dateStr]
      };
    }).sort((a,b) => a.sessions[0].start_time.localeCompare(b.sessions[0].start_time));
  });

  async updateStatus(classId: number, status: 'Completed' | 'Student No Show' | 'Teacher No Show'): Promise<void> {
    await this.tutorService.updateSessionStatus(classId, status);
  }

  async cancelSession(classId: number): Promise<void> {
    if (confirm('Are you sure you want to cancel this session? This action cannot be undone.')) {
      await this.tutorService.updateSessionStatus(classId, 'Cancelled');
    }
  }

  async initiateReschedule(classId: number): Promise<void> {
      // await this.tutorService.initiateReschedule(classId);
      alert('Rescheduling not yet implemented.');
  }

  async requestCancellation(classId: number): Promise<void> {
      if(confirm('Are you sure you want to request cancellation for this session?')) {
          await this.tutorService.updateSessionStatus(classId, 'Cancellation Pending');
      }
  }
}