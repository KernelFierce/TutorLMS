import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { EnrichedClassSession, TeacherAvailability } from '../../models';

@Component({
  selector: 'app-weekly-planner',
  templateUrl: './weekly-planner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe]
})
export class WeeklyPlannerComponent {
  private tutorService = inject(TutorDataService);
  private authService = inject(AuthService);

  viewMode = signal<'week' | 'day'>('week');
  
  // State for adding new availability ranges
  isAddModalOpen = signal(false);
  newRangeModel = signal({ date: '', startTime: '09:00', endTime: '10:00' });
  
  private today = new Date();
  
  // Generate the next 7 days for the calendar view
  weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(this.today);
    date.setDate(this.today.getDate() + i);
    return date;
  });

  weeklyData = computed(() => {
    const user = this.authService.currentUser();
    if (user?.role !== 'Teacher') return [];

    const teacherId = user.entityId!;
    const userTimeZone = this.tutorService.teachers().find(t => t.teacherId === teacherId)?.timeZone || 'UTC';

    const availabilities = this.tutorService.teacherAvailability().filter(a => a.teacherId === teacherId);
    const schedule = this.tutorService.weeklyScheduleForCurrentUser().filter(c => c.teacherId === teacherId);

    return this.weekDays.map(date => {
        const dateString = date.toISOString().split('T')[0];
        const availForDay = availabilities.find(a => a.date === dateString);
        const scheduleForDay = schedule.filter(s => s.date === dateString);

        return {
            date,
            dateString,
            availability: availForDay?.ranges || [],
            schedule: scheduleForDay,
        };
    });
  });

  openAddModal(dateString: string): void {
    this.newRangeModel.set({ date: dateString, startTime: '09:00', endTime: '10:00'});
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }
  
  addAvailability(): void {
    const user = this.authService.currentUser();
    if (user?.role !== 'Teacher') return;
    
    const { date, startTime, endTime } = this.newRangeModel();
    if (date && startTime && endTime && startTime < endTime) {
      this.tutorService.setAvailability(user.entityId!, date, { startTime, endTime }, true);
      this.closeAddModal();
    } else {
      alert('Please ensure start time is before end time.');
    }
  }

  removeAvailability(dateString: string, range: {startTime: string, endTime: string}): void {
    const user = this.authService.currentUser();
    if (user?.role !== 'Teacher') return;

    if (confirm(`Are you sure you want to remove the availability from ${range.startTime} to ${range.endTime}?`)) {
       this.tutorService.setAvailability(user.entityId!, dateString, range, false);
    }
  }
}
