import { Component, ChangeDetectionStrategy, inject, input, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrichedSubmission, AssignmentUiStatus } from '../../models';
import { AuthService } from '../../auth.service';
import { TutorDataService } from '../../tutor-data.service';

@Component({
  selector: 'app-assignments-view',
  templateUrl: './assignments-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
})
export class AssignmentsViewComponent {
  authService = inject(AuthService);
  tutorService = inject(TutorDataService);

  currentUser = this.authService.currentUser;
  
  // Allow parent components to override the submissions list
  submissionsInput = input<EnrichedSubmission[] | null>(null);

  submissions = computed(() => {
    // If an input is provided, use it. Otherwise, use the default for the current user.
    return this.submissionsInput() ?? this.tutorService.submissionsForCurrentUser();
  });
  
  isGradeModalOpen = signal(false);
  gradingSubmission = signal<EnrichedSubmission | null>(null);

  gradeModel = signal({
    grade: '',
    feedback: ''
  });

  getStatusColor(status: AssignmentUiStatus): string {
    switch (status) {
      case 'Assigned': return 'bg-blue-100 text-blue-800';
      case 'Submitted': return 'bg-yellow-100 text-yellow-800';
      case 'Graded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  async onFileSelected(event: Event, submissionId: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name;
      if (confirm(`Are you sure you want to submit "${fileName}" for this assignment?`)) {
        await this.tutorService.submitAssignment(submissionId, fileName);
      }
      input.value = '';
    }
  }

  viewSubmission(submission: EnrichedSubmission): void {
      alert(`Simulating download for submission:\n${submission.content}\n\nIn a real app, this would open the link.`);
  }

  openGradeModal(submission: EnrichedSubmission): void {
    this.gradingSubmission.set(submission);
    this.gradeModel.set({
      grade: submission.grade?.toString() || '',
      feedback: submission.feedback || '',
    });
    this.isGradeModalOpen.set(true);
  }

  closeGradeModal(): void {
    this.isGradeModalOpen.set(false);
    this.gradingSubmission.set(null);
  }

  async saveGrade(): Promise<void> {
    const submission = this.gradingSubmission();
    if (!submission) return;

    const { grade, feedback } = this.gradeModel();
    if (!grade) {
        alert('Please enter a grade.');
        return;
    }
    await this.tutorService.gradeAssignment(submission.id, grade, feedback);
    this.closeGradeModal();
  }

  async sendNotification(submissionId: number): Promise<void> {
    alert('Simulating sending notification...');
    // await this.tutorService.sendAssignmentNotification(submissionId);
  }
}
