import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { EnrichedClassSession } from '../../models';
import { TutorDataService } from '../../tutor-data.service';

@Component({
  selector: 'app-cancellation-requests-view',
  templateUrl: './cancellation-requests-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [DatePipe],
})
export class CancellationRequestsViewComponent {
  private tutorService = inject(TutorDataService);

  requests = input.required<EnrichedClassSession[]>();

  approve(classId: string): void {
    if (confirm('Are you sure you want to approve this cancellation?')) {
      this.tutorService.approveCancellation(classId);
    }
  }

  deny(classId: string): void {
    if (confirm('Are you sure you want to deny this cancellation request? The session will be set back to "Scheduled".')) {
      this.tutorService.denyCancellation(classId);
    }
  }
}
