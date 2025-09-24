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
  
  activeForm = signal<'session' | 'class' | 'demo' | 'payment' | 'assign'>('session');
  
  students = computed(() => this.tutorService.students().filter(s => s.is_active));
  teachers = this.tutorService.teachers;
  leads = computed(() => this.tutorService.leads().filter(l => l.status === 'New' || l.status === 'Contacted'));
  
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
  assignmentModel = signal({
    studentId: '',
    teacherId: '',
    title: '',
    instructions: '',
    dueDate: new Date().toISOString().split('T')[0],
    gradingSystem: 'Points' as const,
    maxPoints: 100
  });

  selectedLead = computed(() => {
    const leadId = this.demoModel().leadId;
    return this.leads().find(l => l.id === leadId);
  });

  setForm(form: 'session' | 'class' | 'demo' | 'payment' | 'assign'): void {
    this.activeForm.set(form);
  }

  async onLogSession(): Promise<void> {
    const sessionData = this.sessionModel();
    if (sessionData.studentId && sessionData.teacherId && sessionData.durationHours > 0 && sessionData.topicsCovered) {
      await this.tutorService.logSession(sessionData);
      this.sessionModel.set({ studentId: '', teacherId: '', date: new Date().toISOString().split('T')[0], startTime: '12:00', durationHours: 1, topicsCovered: '', timeZone: 'Asia/Kolkata' });
      alert('Session logged successfully!');
    } else {
      alert('Please fill all session fields.');
    }
  }

  async onScheduleClass(): Promise<void> {
    const classData = this.classModel();
    if (classData.studentId && classData.teacherId && classData.durationHours > 0) {
      if (classData.recurring) {
        if (!classData.recurrenceRule.endDate) {
          alert('Please provide an end date for the recurring series.');
          return;
        }
        // Recurring logic to be implemented
        alert('Recurring class scheduling is not yet implemented.');
      } else {
        await this.tutorService.scheduleClass({
          studentId: classData.studentId,
          teacherId: classData.teacherId,
          date: classData.recurrenceRule.startDate,
          startTime: classData.startTime,
          durationHours: classData.durationHours,
          topicsCovered: classData.topicsCovered,
          timeZone: classData.timeZone,
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

  async onScheduleDemo(): Promise<void> {
    const demoData = this.demoModel();
    if (demoData.leadId && demoData.date && demoData.teacherId && demoData.startTime) {
      // await this.tutorService.scheduleDemo(demoData);
      this.demoModel.set({ leadId: '', teacherId: '', date: new Date().toISOString().split('T')[0], startTime: '12:00' });
       alert('Demo scheduling is not yet implemented.');
    } else {
      alert('Please fill all demo fields.');
    }
  }

  async onLogPayment(): Promise<void> {
    const paymentData = this.paymentModel();
    if (paymentData.studentId && paymentData.amount > 0) {
      await this.tutorService.logPayment(paymentData);
      this.paymentModel.set({ studentId: '', paymentDate: new Date().toISOString().split('T')[0], amount: 0, currency: 'USD' });
      alert('Payment logged successfully!');
    } else {
      alert('Please select a student and enter a valid amount.');
    }
  }

  async onAssignTask(): Promise<void> {
    const taskData = this.assignmentModel();
    if (taskData.studentId && taskData.teacherId && taskData.title && taskData.dueDate) {
        await this.tutorService.assignTask(taskData);
        this.assignmentModel.set({
            studentId: '',
            teacherId: '',
            title: '',
            instructions: '',
            dueDate: new Date().toISOString().split('T')[0],
            gradingSystem: 'Points' as const,
            maxPoints: 100
        });
        alert('Assignment created successfully!');
    } else {
        alert('Please fill all required assignment fields.');
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
