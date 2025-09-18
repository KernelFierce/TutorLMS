import { Component, ChangeDetectionStrategy, inject, computed, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { AuthService } from '../../auth.service';
import { Course, RescheduleRequest, RescheduleStatus } from '../../models'; // Assuming these will be in the new models

@Component({
  selector: 'app-reschedule-view',
  templateUrl: './reschedule-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
})
export class RescheduleViewComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  
  // TODO: Implement rescheduleRequestsForCurrentUser in DataService
  rescheduleRequests = signal<RescheduleRequest[]>([]);

  suggestionModels = signal<{ [key: string]: string }>({});
  proposedSlotsModels = signal<{ [key: string]: { date: string, startTime: string, endTime: string }[] }>({});
  confirmationModels = signal<{ [key: string]: string }>({});
  
  constructor() {
    effect(() => {
      this.rescheduleRequests().forEach(req => {
        if (!this.proposedSlotsModels()[req.requestId]) {
          this.proposedSlotsModels.update(m => ({...m, [req.requestId]: []}));
        }
      });
    });
  }

  enrichedRequests = computed(() => {
    const requests = this.rescheduleRequests();
    const allCourses = this.dataService.courses();
    const allStudents = this.dataService.students();
    const allTeachers = this.dataService.teachers();

    return requests.map(req => {
      // TODO: Re-implement class enrichment logic based on new data structures
      const courseInfo = undefined; // Placeholder
      const student = allStudents.find(s => s.studentId === req.studentId);
      const teacher = allTeachers.find(t => t.teacherId === req.teacherId);

      return {
        ...req,
        courseInfo, // Placeholder
        studentName: student?.name || 'Unknown',
        teacherName: teacher?.name || 'Unknown',
      }
    });
  });

  submitSuggestion(requestId: string): void {
    const suggestion = this.suggestionModels()[requestId];
    if (suggestion && suggestion.trim()) {
      // TODO: Implement submitStudentRescheduleSuggestion in DataService
      // this.dataService.submitStudentRescheduleSuggestion(requestId, suggestion.trim());
      this.suggestionModels.update(m => ({ ...m, [requestId]: '' }));
    } else {
      alert('Please enter a suggestion.');
    }
  }

  addProposedSlot(requestId: string): void {
    this.proposedSlotsModels.update(m => ({ ...m, [requestId]: [...m[requestId], {date: '', startTime: '', endTime: ''}] }));
  }

  submitProposedSlots(requestId: string): void {
    const slots = this.proposedSlotsModels()[requestId];
    const validSlots = slots.filter(s => s.date && s.startTime && s.endTime);
    if (validSlots.length > 0) {
      const isoSlots = validSlots.map(s => `${s.date}T${s.startTime}:00.000Z`);
      // TODO: Implement submitTeacherProposedSlots in DataService
      // this.dataService.submitTeacherProposedSlots(requestId, isoSlots);
    } else {
      alert('Please add at least one valid time slot.');
    }
  }

  submitConfirmation(requestId: string): void {
    const finalSlot = this.confirmationModels()[requestId];
    if (finalSlot) {
      // TODO: Implement submitStudentFinalConfirmation in DataService
      // this.dataService.submitStudentFinalConfirmation(requestId, finalSlot);
    } else {
      alert('Please select a slot to confirm.');
    }
  }

  formatStatus(status: RescheduleStatus): string {
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
