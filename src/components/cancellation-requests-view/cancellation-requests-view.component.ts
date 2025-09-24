import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { EnrichedClass } from '../../models';
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

  requests = input.required<EnrichedClass[]>();

  async approve(classId: number): Promise<void> {
    if (confirm('Are you sure you want to approve this cancellation?')) {
      await this.tutorService.updateSessionStatus(classId, 'Cancelled');
    }
  }

  async deny(classId: number): Promise<void> {
    if (confirm('Are you sure you want to deny this cancellation request? The session will be set back to "Scheduled".')) {
      await this.tutorService.updateSessionStatus(classId, 'Scheduled');
    }
  }
}
