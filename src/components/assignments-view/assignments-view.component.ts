import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrichedAssignment, Assignment } from '../../models';
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
  assignments = this.tutorService.assignmentsForCurrentUser;
  
  isGradeModalOpen = signal(false);
  gradingAssignment = signal<EnrichedAssignment | null>(null);

  gradeModel = signal({
    grade: '',
    feedback: ''
  });

  getStatusColor(status: string): string {
    switch (status) {
      case 'Assigned': return 'bg-blue-100 text-blue-800';
      case 'Submitted': return 'bg-yellow-100 text-yellow-800';
      case 'Graded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  onFileSelected(event: Event, assignmentId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name;
      if (confirm(`Are you sure you want to submit "${fileName}" for this assignment?`)) {
        this.tutorService.submitAssignment(assignmentId, fileName);
      }
      // Reset file input
      input.value = '';
    }
  }

  viewSubmission(assignment: EnrichedAssignment): void {
      alert(`Simulating download for submission:\n${assignment.submissionFileName}\n\nIn a real app, this would open the Google Drive link.`);
  }

  openGradeModal(assignment: EnrichedAssignment): void {
    this.gradingAssignment.set(assignment);
    this.gradeModel.set({
      grade: assignment.grade || '',
      feedback: assignment.feedback || '',
    });
    this.isGradeModalOpen.set(true);
  }

  closeGradeModal(): void {
    this.isGradeModalOpen.set(false);
    this.gradingAssignment.set(null);
  }

  saveGrade(): void {
    const assignment = this.gradingAssignment();
    if (!assignment) return;

    const { grade, feedback } = this.gradeModel();
    if (!grade) {
        alert('Please enter a grade.');
        return;
    }
    this.tutorService.editGrade(assignment.assignmentId, grade, feedback);
    this.closeGradeModal();
  }

  sendNotification(assignmentId: string): void {
    alert('Simulating sending notification...');
    this.tutorService.sendAssignmentNotification(assignmentId);
  }
}
