import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Invoice, Payment } from '../../models';

@Component({
  selector: 'app-billing-view',
  templateUrl: './billing-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [DatePipe]
})
export class BillingViewComponent {
  invoices = input.required<Invoice[]>();
  payments = input.required<Payment[]>();

  getStatusColor(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Sent': return 'bg-blue-100 text-blue-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'PartiallyPaid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }
}
