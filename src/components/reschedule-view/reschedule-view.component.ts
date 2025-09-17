import { Component, ChangeDetectionStrategy, inject, computed, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { EnrichedClassSession, RescheduleRequest, RescheduleStatus } from '../../models';

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

  // Form models for each request type
  suggestionModels = signal<{ [key: string]: string }>({});
  proposedSlotsModels = signal<{ [key: string]: { date: string, startTime: string, endTime: string }[] }>({});
  confirmationModels = signal<{ [key: string]: string }>({});
  
  constructor() {
    effect(() => {
      // Pre-populate models when requests change
      this.rescheduleRequests().forEach(req => {
        if (!this.proposedSlotsModels()[req.requestId]) {
          this.proposedSlotsModels.update(m => ({...m, [req.requestId]: []}));
        }
      });
    });
  }

  enrichedRequests = computed(() => {
    const requests = this.rescheduleRequests();
    const allClasses = this.tutorService.classes();
    const allStudents = this.tutorService.students();
    const allTeachers = this.tutorService.teachers();

    return requests.map(req => {
      const classInfo = allClasses.find(c => c.classId === req.classId);
      const student = allStudents.find(s => s.studentId === req.studentId);
      const teacher = allTeachers.find(t => t.teacherId === req.teacherId);
      const userTimeZone = this.currentUser()?.role === 'Student' ? student?.timeZone : teacher?.timeZone;
      const enrichedClass = classInfo ? this.tutorService['enrichClassSession'](classInfo, userTimeZone || 'UTC') : undefined;

      return {
        ...req,
        classInfo: enrichedClass,
        studentName: student?.name || 'Unknown',
        teacherName: teacher?.name || 'Unknown',
      }
    });
  });

  submitSuggestion(requestId: string): void {
    const suggestion = this.suggestionModels()[requestId];
    if (suggestion && suggestion.trim()) {
      this.tutorService.submitStudentRescheduleSuggestion(requestId, suggestion.trim());
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
      const isoSlots = validSlots.map(s => `${s.date}T${s.startTime}:00.000Z`); // Assuming teacher inputs in UTC
      this.tutorService.submitTeacherProposedSlots(requestId, isoSlots);
    } else {
      alert('Please add at least one valid time slot.');
    }
  }

  submitConfirmation(requestId: string): void {
    const finalSlot = this.confirmationModels()[requestId];
    if (finalSlot) {
      this.tutorService.submitStudentFinalConfirmation(requestId, finalSlot);
    } else {
      alert('Please select a slot to confirm.');
    }
  }

  // Helper to format status for display, moving logic from template
  formatStatus(status: RescheduleStatus): string {
    if (!status) return '';
    // This regex adds a space before each capital letter, effectively converting camelCase to Title Case.
    return status.replace(/([A-Z])/g, ' $1').trim();
  }

  // Helper to format ISO strings for display
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