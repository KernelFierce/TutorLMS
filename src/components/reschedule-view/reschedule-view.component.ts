import { Component, ChangeDetectionStrategy, inject, computed, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { RescheduleRequest, RescheduleStatus, RequestStatus } from '../../models';

@Component({
  selector: 'app-reschedule-view',
  templateUrl: './reschedule-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
})
export class RescheduleViewComponent {
  private tutorService = inject(TutorDataService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  rescheduleRequests = this.tutorService.rescheduleRequestsForCurrentUser;

  suggestionModels = signal<{ [key: number]: string }>({});
  proposedSlotsModels = signal<{ [key: number]: { date: string, startTime: string, endTime: string }[] }>({});
  confirmationModels = signal<{ [key: number]: string }>({});
  
  constructor() {
    effect(() => {
      this.rescheduleRequests().forEach(req => {
        if (!this.proposedSlotsModels()[req.id]) {
          this.proposedSlotsModels.update(m => ({...m, [req.id]: []}));
        }
      });
    });
  }

  enrichedRequests = computed(() => {
    const requests = this.rescheduleRequests();

    return requests.map(req => {
      const classInfo = req.class;
      const student = classInfo.students[0];
      const teacher = classInfo.teacher;
      const userTimeZone = this.currentUser()?.roles.includes('Student') ? student?.time_zone : teacher?.time_zone;
      const enrichedClass = classInfo ? this.tutorService['enrichClass'](classInfo, userTimeZone || 'UTC') : undefined;

      return {
        ...req,
        classInfo: enrichedClass,
        studentName: student?.full_name || 'Unknown',
        teacherName: teacher?.full_name || 'Unknown',
      }
    });
  });

  async submitSuggestion(requestId: number): Promise<void> {
    const suggestion = this.suggestionModels()[requestId];
    if (suggestion && suggestion.trim()) {
      // await this.tutorService.updateRescheduleRequest(requestId, { student_suggestion: suggestion.trim(), status: 'Pending Teacher Slots' });
      this.suggestionModels.update(m => ({ ...m, [requestId]: '' }));
    } else {
      alert('Please enter a suggestion.');
    }
  }

  addProposedSlot(requestId: number): void {
    this.proposedSlotsModels.update(m => ({ ...m, [requestId]: [...m[requestId], {date: '', startTime: '', endTime: ''}] }));
  }

  async submitProposedSlots(requestId: number): Promise<void> {
    const slots = this.proposedSlotsModels()[requestId];
    const validSlots = slots.filter(s => s.date && s.startTime && s.endTime);
    if (validSlots.length > 0) {
      const isoSlots = validSlots.map(s => `${s.date}T${s.startTime}:00.000Z`);
      // await this.tutorService.updateRescheduleRequest(requestId, { proposed_slots: isoSlots, status: 'Pending Student Confirmation' });
    } else {
      alert('Please add at least one valid time slot.');
    }
  }

  async submitConfirmation(requestId: number): Promise<void> {
    const finalSlot = this.confirmationModels()[requestId];
    if (finalSlot) {
      // await this.tutorService.updateRescheduleRequest(requestId, { final_slot: finalSlot, status: 'Confirmed' });
    } else {
      alert('Please select a slot to confirm.');
    }
  }

  formatStatus(status: RequestStatus): string {
    if (!status) return '';
    return status.replace(/([A-Z])/g, ' $1').trim();
  }

  formatDateTime(isoString: string, timeZone?: string): string {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: timeZone || undefined
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }
}