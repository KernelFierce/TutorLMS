
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorDataService } from '../../tutor-data.service';
import { Lead, RecurrenceRule } from '../../models';

@Component({
  selector: 'app-action-forms',
  templateUrl: './action-forms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class ActionFormsComponent {
  private tutorService = inject(TutorDataService);
  
  activeForm = signal<'session' | 'class' | 'demo' | 'payment'>('session');
  
  // Expose service signals to the template
  students = this.tutorService.activeStudents;
  teachers = this.tutorService.teachers;
  leads = computed(() => this.tutorService.leads().filter(l => l.status === 'New' || l.status === 'Contacted'));
  
  // Timezones for dropdowns
  // FIX: Intl.supportedValuesOf('timeZone') is not available in this environment.
  // Using a curated list of common timezones instead.
  timezones = signal([
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
  ]);
  
  // Form models
  sessionModel = signal({ studentId: '', teacherId: '', date: new Date().toISOString().split('T')[0], startTime: '12:00', durationHours: 1, topicsCovered: '', timeZone: 'Asia/Kolkata' });
  
  classModel = signal({ 
      studentId: '', 
      teacherId: '', 
      startTime: '12:00', 
      durationHours: 1, 
      topicsCovered: '',
      timeZone: 'Asia/Kolkata',
      recurring: false,
      recurrenceRule: {
        frequency: 'weekly' as 'weekly' | 'daily',
        interval: 1,
        daysOfWeek: [] as ('SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT')[],
        endDate: '',
        startDate: new Date().toISOString().split('T')[0],
      }
  });

  demoModel = signal({ leadId: '', teacherId: '', date: new Date().toISOString().split('T')[0], startTime: '12:00' });
  paymentModel = signal({ studentId: '', paymentDate: new Date().toISOString().split('T')[0], amount: 0, currency: 'USD' });

  selectedLead = computed(() => {
    const leadId = this.demoModel().leadId;
    return this.leads().find(l => l.id === leadId);
  });

  setForm(form: 'session' | 'class' | 'demo' | 'payment'): void {
    this.activeForm.set(form);
  }

  onLogSession(): void {
    const sessionData = this.sessionModel();
    if (sessionData.studentId && sessionData.teacherId && sessionData.durationHours > 0 && sessionData.topicsCovered) {
      // In a real app, convert local time to UTC before sending
      this.tutorService.logSession(sessionData);
      this.sessionModel.set({ studentId: '', teacherId: '', date: new Date().toISOString().split('T')[0], startTime: '12:00', durationHours: 1, topicsCovered: '', timeZone: 'Asia/Kolkata' });
      alert('Session logged successfully!');
    } else {
      alert('Please fill all session fields.');
    }
  }

  onScheduleClass(): void {
    const classData = this.classModel();
    if (classData.studentId && classData.teacherId && classData.durationHours > 0) {
       // In a real app, you'd convert the start date + time + timezone to a UTC datetime before passing to service
      if (classData.recurring) {
        if (!classData.recurrenceRule.endDate) {
          alert('Please provide an end date for the recurring series.');
          return;
        }
        this.tutorService.scheduleRecurringClass({
          studentId: classData.studentId,
          teacherId: classData.teacherId,
          startTime: classData.startTime,
          durationHours: classData.durationHours,
          topicsCovered: classData.topicsCovered,
          rule: classData.recurrenceRule
        });
      } else {
        this.tutorService.scheduleClass({
          studentId: classData.studentId,
          teacherId: classData.teacherId,
          date: classData.recurrenceRule.startDate, // Use start date for single class
          startTime: classData.startTime,
          durationHours: classData.durationHours,
          topicsCovered: classData.topicsCovered
        });
      }

      this.resetClassModel();
      alert('Class(es) scheduled successfully!');
    } else {
      alert('Please fill all required class fields.');
    }
  }
  
  onDayOfWeekChange(day: 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT', event: Event): void {
      const isChecked = (event.target as HTMLInputElement).checked;
      this.classModel.update(model => {
          const days = model.recurrenceRule.daysOfWeek;
          if (isChecked) {
              if (!days.includes(day)) {
                  days.push(day);
              }
          } else {
              const index = days.indexOf(day);
              if (index > -1) {
                  days.splice(index, 1);
              }
          }
          return {...model};
      });
  }

  onScheduleDemo(): void {
    const demoData = this.demoModel();
    if (demoData.leadId && demoData.date && demoData.teacherId && demoData.startTime) {
      this.tutorService.scheduleDemo(demoData);
      this.demoModel.set({ leadId: '', teacherId: '', date: new Date().toISOString().split('T')[0], startTime: '12:00' });
       alert('Demo scheduled! Confirmation emails have been sent.');
    } else {
      alert('Please fill all demo fields.');
    }
  }

  onLogPayment(): void {
    const paymentData = this.paymentModel();
    if (paymentData.studentId && paymentData.amount > 0) {
      this.tutorService.logPayment(paymentData);
      this.paymentModel.set({ studentId: '', paymentDate: new Date().toISOString().split('T')[0], amount: 0, currency: 'USD' });
      alert('Payment logged successfully!');
    } else {
      alert('Please select a student and enter a valid amount.');
    }
  }
  
  private resetClassModel(): void {
    this.classModel.set({ 
      studentId: '', 
      teacherId: '', 
      startTime: '12:00', 
      durationHours: 1, 
      topicsCovered: '',
      timeZone: 'Asia/Kolkata',
      recurring: false,
      recurrenceRule: {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [],
        endDate: '',
        startDate: new Date().toISOString().split('T')[0],
      }
    });
  }
}
