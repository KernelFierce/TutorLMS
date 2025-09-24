import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorDataService } from '../../tutor-data.service';
import { AuthService } from '../../auth.service';
import { TeacherAvailability } from '../../models';

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
  
  isAddModalOpen = signal(false);
  newRangeModel = signal({ date: '', startTime: '09:00', endTime: '10:00' });
  
  private today = new Date();
  
  weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(this.today);
    date.setDate(this.today.getDate() + i);
    return date;
  });

  weeklyData = computed(() => {
    const user = this.authService.currentUser();
    if (!user?.roles.includes('Teacher')) return [];

    const teacherId = user.id;

    const availabilities = this.tutorService.teacherAvailability().filter(a => a.teacherId === teacherId);
    const schedule = this.tutorService.weeklyScheduleForCurrentUser().filter(c => c.teacher.id === teacherId);

    return this.weekDays.map(date => {
        const dateString = date.toISOString().split('T')[0];
        const availForDay = availabilities.find(a => a.date === dateString);
        const scheduleForDay = schedule.filter(s => s.start_time.startsWith(dateString));

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
  
  async addAvailability(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user?.roles.includes('Teacher')) return;
    
    const { date, startTime, endTime } = this.newRangeModel();
    if (date && startTime && endTime && startTime < endTime) {
      // await this.tutorService.setAvailability(user.id, date, { startTime, endTime }, true);
      alert('Setting availability not implemented yet.');
      this.closeAddModal();
    } else {
      alert('Please ensure start time is before end time.');
    }
  }

  async removeAvailability(dateString: string, range: {startTime: string, endTime: string}): Promise<void> {
    const user = this.authService.currentUser();
    if (!user?.roles.includes('Teacher')) return;

    if (confirm(`Are you sure you want to remove the availability from ${range.startTime} to ${range.endTime}?`)) {
       // await this.tutorService.setAvailability(user.id, dateString, range, false);
       alert('Removing availability not implemented yet.');
    }
  }
}
